'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResult } from '@/types'
import { revalidatePath } from 'next/cache'

// ─── Guard ────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'Не авторизован' as string }

  const { data: emp } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (emp?.role !== 'admin') return { supabase: null, error: 'Недостаточно прав' as string }
  return { supabase, error: null as null }
}

function revalidateAll() {
  revalidatePath('/reports')
  revalidatePath('/dashboard')
  revalidatePath('/stock')
  revalidatePath('/analytics')
}

// ─── Delete individual report ─────────────────────────────────────────────────

export async function deleteReport(report_id: string): Promise<ActionResult> {
  const { supabase, error: authErr } = await requireAdmin()
  if (!supabase) return { error: authErr! }

  const { data: report } = await supabase
    .from('daily_reports')
    .select('location_id, report_date')
    .eq('id', report_id)
    .single()

  if (!report) return { error: 'Отчёт не найден' }

  // Remove mirrored sale movements for the same location + date
  await supabase
    .from('stock_movements')
    .delete()
    .eq('location_id', report.location_id)
    .eq('movement_date', report.report_date)
    .eq('type', 'sale')

  // Unlock the draft so the employee can re-submit if needed
  await supabase
    .from('report_drafts')
    .update({ status: 'draft' })
    .eq('location_id', report.location_id)
    .eq('report_date', report.report_date)

  // Delete report — cascades to report_items via FK
  const { error } = await supabase
    .from('daily_reports')
    .delete()
    .eq('id', report_id)

  if (error) return { error: error.message }
  revalidateAll()
  return {}
}

// ─── Delete individual stock movement ─────────────────────────────────────────

export async function deleteStockMovement(id: string): Promise<ActionResult> {
  const { supabase, error: authErr } = await requireAdmin()
  if (!supabase) return { error: authErr! }

  const { error } = await supabase
    .from('stock_movements')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/stock')
  revalidatePath('/dashboard')
  return {}
}

// ─── Delete draft ─────────────────────────────────────────────────────────────

export async function deleteDraft(draft_id: string): Promise<ActionResult> {
  const { supabase, error: authErr } = await requireAdmin()
  if (!supabase) return { error: authErr! }

  const { error } = await supabase
    .from('report_drafts')
    .delete()
    .eq('id', draft_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return {}
}

// ─── Bulk reset ───────────────────────────────────────────────────────────────

export interface ResetOptions {
  targets: ('reports' | 'stock_movements' | 'drafts')[]
  location_id?: string
  date_from?: string
  date_to?: string
}

export async function resetData(
  options: ResetOptions
): Promise<ActionResult<{ message: string }>> {
  const { supabase, error: authErr } = await requireAdmin()
  if (!supabase) return { error: authErr! }

  if (options.targets.length === 0) return { error: 'Не выбрано ни одного раздела' }

  // Catch-all filter so PostgREST allows deletes without explicit WHERE
  const EPOCH = '1970-01-01T00:00:00Z'

  const results: string[] = []

  if (options.targets.includes('reports')) {
    let q = supabase.from('daily_reports').delete().gt('created_at', EPOCH)
    if (options.location_id) q = q.eq('location_id', options.location_id)
    if (options.date_from)   q = q.gte('report_date', options.date_from)
    if (options.date_to)     q = q.lte('report_date', options.date_to)
    const { error } = await q
    if (error) return { error: 'Ошибка удаления отчётов: ' + error.message }
    results.push('отчёты')
  }

  if (options.targets.includes('stock_movements')) {
    let q = supabase.from('stock_movements').delete().gt('created_at', EPOCH)
    if (options.location_id) q = q.eq('location_id', options.location_id)
    if (options.date_from)   q = q.gte('movement_date', options.date_from)
    if (options.date_to)     q = q.lte('movement_date', options.date_to)
    const { error } = await q
    if (error) return { error: 'Ошибка удаления складских записей: ' + error.message }
    results.push('складские записи')
  }

  if (options.targets.includes('drafts')) {
    let q = supabase.from('report_drafts').delete().gt('created_at', EPOCH)
    if (options.location_id) q = q.eq('location_id', options.location_id)
    if (options.date_from)   q = q.gte('report_date', options.date_from)
    if (options.date_to)     q = q.lte('report_date', options.date_to)
    const { error } = await q
    if (error) return { error: 'Ошибка удаления черновиков: ' + error.message }
    results.push('черновики')
  }

  revalidateAll()
  return { data: { message: `Удалено: ${results.join(', ')}` } }
}
