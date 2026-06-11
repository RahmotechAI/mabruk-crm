'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult, DailyReport, ReportDraft } from '@/types'
import { revalidatePath } from 'next/cache'

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getOrCreateDraft(
  location_id: string,
  report_date: string
): Promise<ReportDraft | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try existing
  const { data: existing } = await supabase
    .from('report_drafts')
    .select('*, location:locations(*), employee:employees(*), items:report_draft_items(*, product:products(*))')
    .eq('location_id', location_id)
    .eq('report_date', report_date)
    .single()

  if (existing) return existing as ReportDraft

  // Create new
  const { data, error } = await supabase
    .from('report_drafts')
    .insert({ location_id, employee_id: user.id, report_date })
    .select('*, location:locations(*), employee:employees(*), items:report_draft_items(*, product:products(*))')
    .single()

  if (error) return null
  return data as ReportDraft
}

export async function getDraftsForDate(date: string): Promise<ReportDraft[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('report_drafts')
    .select('*, location:locations(*), employee:employees(*), items:report_draft_items(*, product:products(*))')
    .eq('report_date', date)
    .order('created_at', { ascending: true })

  return (data ?? []) as ReportDraft[]
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function upsertDraftItem(
  draft_id: string,
  product_id: string,
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }
  if (quantity < 0) return { error: 'Количество не может быть отрицательным' }

  const { error } = await supabase
    .from('report_draft_items')
    .upsert(
      { draft_id, product_id, quantity, updated_at: new Date().toISOString() },
      { onConflict: 'draft_id,product_id' }
    )

  if (error) return { error: error.message }
  return {}
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export async function submitDraft(draft_id: string): Promise<ActionResult<DailyReport>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Load draft + items
  const { data: draft, error: draftErr } = await supabase
    .from('report_drafts')
    .select('*, items:report_draft_items(product_id, quantity)')
    .eq('id', draft_id)
    .single()

  if (draftErr || !draft) return { error: 'Черновик не найден' }
  if (draft.status === 'submitted') return { error: 'Отчёт уже отправлен' }

  // Guard duplicate final report
  const { data: existing } = await supabase
    .from('daily_reports')
    .select('id')
    .eq('location_id', draft.location_id)
    .eq('report_date', draft.report_date)
    .single()

  if (existing) {
    await supabase.from('report_drafts').update({ status: 'submitted' }).eq('id', draft_id)
    return { error: 'Финальный отчёт за эту дату уже существует' }
  }

  // Filter non-zero items
  const items = ((draft.items ?? []) as { product_id: string; quantity: number }[])
    .filter(i => Number(i.quantity) > 0)

  if (items.length === 0) {
    return { error: 'Введите количество хотя бы для одного товара перед отправкой' }
  }

  // Fetch current prices server-side
  const productIds = items.map(i => i.product_id)
  const { data: prices, error: pricesErr } = await supabase
    .from('product_prices')
    .select('product_id, price_per_unit')
    .in('product_id', productIds)
    .is('valid_to', null)

  if (pricesErr || !prices) return { error: 'Не удалось получить цены' }
  const priceMap = new Map(prices.map(p => [p.product_id, Number(p.price_per_unit)]))

  // Calculate revenue server-side (quantities from DB, prices from DB)
  const enriched = items.map(i => {
    const unit_price = priceMap.get(i.product_id) ?? 0
    const qty = Number(i.quantity)
    return {
      product_id: i.product_id,
      quantity: qty,
      unit_price,
      total_price: Number((qty * unit_price).toFixed(2)),
    }
  })

  const total_revenue = Number(
    enriched.reduce((s, i) => s + i.total_price, 0).toFixed(2)
  )

  // Create immutable daily_report
  const { data: report, error: reportErr } = await supabase
    .from('daily_reports')
    .insert({
      location_id: draft.location_id,
      employee_id: user.id,
      report_date: draft.report_date,
      total_revenue,
    })
    .select()
    .single()

  if (reportErr || !report) {
    return { error: 'Ошибка создания отчёта: ' + reportErr?.message }
  }

  // Insert report items
  const { error: itemsErr } = await supabase
    .from('report_items')
    .insert(enriched.map(i => ({ ...i, report_id: report.id })))

  if (itemsErr) {
    await supabase.from('daily_reports').delete().eq('id', report.id)
    return { error: 'Ошибка сохранения позиций: ' + itemsErr.message }
  }

  // Mirror sales to stock_movements
  await supabase.from('stock_movements').insert(
    enriched.map(i => ({
      location_id: draft.location_id,
      product_id: i.product_id,
      employee_id: user.id,
      type: 'sale' as const,
      quantity: i.quantity,
      movement_date: draft.report_date,
    }))
  )

  // Lock the draft
  await supabase
    .from('report_drafts')
    .update({ status: 'submitted' })
    .eq('id', draft_id)

  revalidatePath('/portal')
  revalidatePath('/dashboard')
  return { data: report as DailyReport }
}
