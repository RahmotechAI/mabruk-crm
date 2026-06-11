'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult, StockBalance, StockMovement, StockMovementInput } from '@/types'
import { revalidatePath } from 'next/cache'

export async function addStockMovement(
  input: StockMovementInput
): Promise<ActionResult<StockMovement>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  if (input.quantity <= 0) return { error: 'Количество должно быть больше нуля' }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      location_id: input.location_id,
      product_id: input.product_id,
      employee_id: user.id,
      type: input.type,
      quantity: input.quantity,
      notes: input.notes?.trim() || null,
      movement_date: input.movement_date,
    })
    .select('*, product:products(*), location:locations(*)')
    .single()

  if (error) return { error: 'Ошибка сохранения: ' + error.message }

  revalidatePath('/stock')
  revalidatePath('/dashboard')
  return { data }
}

export async function getStockMovements(params?: {
  location_id?: string
  product_id?: string
  type?: string
  from?: string
  to?: string
  limit?: number
}): Promise<StockMovement[]> {
  const supabase = await createClient()

  let query = supabase
    .from('stock_movements')
    .select('*, product:products(*), location:locations(*), employee:employees(*)')
    .order('created_at', { ascending: false })

  if (params?.location_id) query = query.eq('location_id', params.location_id)
  if (params?.product_id) query = query.eq('product_id', params.product_id)
  if (params?.type) query = query.eq('type', params.type)
  if (params?.from) query = query.gte('movement_date', params.from)
  if (params?.to) query = query.lte('movement_date', params.to)
  if (params?.limit) query = query.limit(params.limit)

  const { data } = await query
  return data ?? []
}

export async function getStockBalances(location_id?: string): Promise<StockBalance[]> {
  const supabase = await createClient()

  let query = supabase
    .from('stock_balances')
    .select('*')
    .order('sort_order')

  if (location_id) query = query.eq('location_id', location_id)

  const { data } = await query
  return (data ?? []).map(row => ({
    product_id: row.product_id,
    product_name: row.product_name,
    incoming: Number(row.incoming),
    sold: Number(row.sold),
    returned: Number(row.returned),
    lost: Number(row.lost),
    balance: Number(row.balance),
  }))
}
