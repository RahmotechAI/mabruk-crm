'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult, CreateReportInput, DailyReport } from '@/types'
import { revalidatePath } from 'next/cache'

export async function createDailyReport(
  input: CreateReportInput
): Promise<ActionResult<DailyReport>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Check for duplicate report
  const { data: existing } = await supabase
    .from('daily_reports')
    .select('id')
    .eq('location_id', input.location_id)
    .eq('report_date', input.report_date)
    .single()

  if (existing) return { error: 'Отчёт за эту дату уже существует' }

  // Filter out zero quantities
  const items = input.items.filter(i => i.quantity > 0)
  if (items.length === 0) return { error: 'Введите количество хотя бы для одного товара' }

  // Fetch current prices server-side
  const productIds = items.map(i => i.product_id)
  const { data: prices, error: pricesErr } = await supabase
    .from('product_prices')
    .select('product_id, price_per_unit')
    .in('product_id', productIds)
    .is('valid_to', null)

  if (pricesErr || !prices) return { error: 'Не удалось получить цены' }

  const priceMap = new Map(prices.map(p => [p.product_id, p.price_per_unit]))

  // Calculate totals server-side
  const enrichedItems = items.map(item => {
    const unit_price = priceMap.get(item.product_id) ?? 0
    const total_price = Number((item.quantity * unit_price).toFixed(2))
    return { product_id: item.product_id, quantity: item.quantity, unit_price, total_price }
  })

  const total_revenue = enrichedItems.reduce((sum, i) => sum + i.total_price, 0)

  // Create report
  const { data: report, error: reportErr } = await supabase
    .from('daily_reports')
    .insert({
      location_id: input.location_id,
      employee_id: user.id,
      report_date: input.report_date,
      total_revenue: Number(total_revenue.toFixed(2)),
    })
    .select()
    .single()

  if (reportErr || !report) return { error: 'Не удалось создать отчёт: ' + reportErr?.message }

  // Insert items
  const { error: itemsErr } = await supabase
    .from('report_items')
    .insert(enrichedItems.map(i => ({ ...i, report_id: report.id })))

  if (itemsErr) {
    await supabase.from('daily_reports').delete().eq('id', report.id)
    return { error: 'Ошибка сохранения позиций: ' + itemsErr.message }
  }

  // Mirror sales into stock_movements
  const movements = enrichedItems.map(i => ({
    location_id: input.location_id,
    product_id: i.product_id,
    employee_id: user.id,
    type: 'sale' as const,
    quantity: i.quantity,
    movement_date: input.report_date,
  }))

  await supabase.from('stock_movements').insert(movements)

  revalidatePath('/portal')
  revalidatePath('/dashboard')
  return { data: report }
}

export async function getReports(params?: {
  location_id?: string
  from?: string
  to?: string
  limit?: number
}): Promise<DailyReport[]> {
  const supabase = await createClient()

  let query = supabase
    .from('daily_reports')
    .select('*, location:locations(*), employee:employees(*), items:report_items(*, product:products(*))')
    .order('report_date', { ascending: false })

  if (params?.location_id) query = query.eq('location_id', params.location_id)
  if (params?.from) query = query.gte('report_date', params.from)
  if (params?.to) query = query.lte('report_date', params.to)
  if (params?.limit) query = query.limit(params.limit)

  const { data } = await query
  return data ?? []
}

export async function getReportByDate(
  location_id: string,
  report_date: string
): Promise<DailyReport | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('daily_reports')
    .select('*, location:locations(*), employee:employees(*), items:report_items(*, product:products(*))')
    .eq('location_id', location_id)
    .eq('report_date', report_date)
    .single()

  return data ?? null
}
