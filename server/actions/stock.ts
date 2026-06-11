'use server'

import { createClient } from '@/lib/supabase/server'
import {
  ActionResult, StockBalance, StockMovement, StockMovementInput,
  InventoryBatchInput, InventoryReportRow,
} from '@/types'
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

export async function addInventoryBatch(input: InventoryBatchInput): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const movements: {
    location_id: string
    product_id: string
    employee_id: string
    type: 'incoming' | 'sale' | 'return'
    quantity: number
    movement_date: string
  }[] = []

  for (const item of input.items) {
    const base = {
      location_id: input.location_id,
      product_id: item.product_id,
      employee_id: user.id,
      movement_date: input.movement_date,
    }
    if (item.delivered > 0) movements.push({ ...base, type: 'incoming', quantity: item.delivered })
    if (item.sold > 0) movements.push({ ...base, type: 'sale', quantity: item.sold })
    if (item.returned > 0) movements.push({ ...base, type: 'return', quantity: item.returned })
  }

  if (movements.length === 0) return { error: 'Нет данных для сохранения' }

  const { error } = await supabase.from('stock_movements').insert(movements)
  if (error) return { error: 'Ошибка сохранения: ' + error.message }

  revalidatePath('/inventory')
  revalidatePath('/stock')
  revalidatePath('/dashboard')
  return {}
}

export async function getInventoryReport(params?: {
  from?: string
  to?: string
  location_id?: string
  product_id?: string
  employee_id?: string
}): Promise<InventoryReportRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from('stock_movements')
    .select('product_id, location_id, type, quantity, product:products(name, sort_order), location:locations(name)')

  if (params?.from) query = query.gte('movement_date', params.from)
  if (params?.to) query = query.lte('movement_date', params.to)
  if (params?.location_id) query = query.eq('location_id', params.location_id)
  if (params?.product_id) query = query.eq('product_id', params.product_id)
  if (params?.employee_id) query = query.eq('employee_id', params.employee_id)

  const { data } = await query
  if (!data) return []

  const map = new Map<string, InventoryReportRow>()

  for (const row of data) {
    const key = `${row.location_id}|${row.product_id}`
    if (!map.has(key)) {
      map.set(key, {
        product_id: row.product_id,
        product_name: (row.product as unknown as { name: string } | null)?.name ?? '',
        location_id: row.location_id,
        location_name: (row.location as unknown as { name: string } | null)?.name ?? '',
        delivered: 0,
        sold: 0,
        returned: 0,
        lost: 0,
        remaining: 0,
      })
    }
    const entry = map.get(key)!
    const qty = Number(row.quantity)
    if (row.type === 'incoming') entry.delivered += qty
    if (row.type === 'sale') entry.sold += qty
    if (row.type === 'return') entry.returned += qty
    if (row.type === 'loss') entry.lost += qty
  }

  for (const entry of map.values()) {
    entry.remaining = entry.delivered - entry.sold - entry.lost + entry.returned
  }

  return Array.from(map.values()).sort((a, b) => {
    const loc = a.location_name.localeCompare(b.location_name, 'ru')
    return loc !== 0 ? loc : a.product_name.localeCompare(b.product_name, 'ru')
  })
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
