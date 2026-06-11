'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Minus, Send, CheckCircle2, Loader2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { upsertDraftItem, submitDraft } from '@/server/actions/drafts'
import { formatCurrency } from '@/lib/utils'
import type { Product, ReportDraft } from '@/types'

interface Props {
  draft: ReportDraft
  products: Product[]
}

export function LiveReportForm({ draft, products }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(draft.status === 'submitted')

  // Quantity state — initialised from saved draft items
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    products.forEach(p => { init[p.id] = 0 })
    draft.items?.forEach(item => { init[item.product_id] = Number(item.quantity) })
    return init
  })

  // Track which products have unsaved changes (dot indicator)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Single Supabase browser client (stable ref)
  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
  [])

  // Subscribe to own draft items for multi-tab / admin-initiated awareness
  useEffect(() => {
    if (draft.status === 'submitted') return

    const channel = supabase
      .channel(`draft-items-${draft.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_draft_items',
          filter: `draft_id=eq.${draft.id}`,
        },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as { product_id: string; quantity: number }
            setQuantities(q => ({ ...q, [row.product_id]: Number(row.quantity) }))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, draft.id, draft.status])

  // Persist a single item to the backend
  const saveItem = useCallback(async (productId: string, qty: number) => {
    setSavingIds(s => new Set(s).add(productId))
    await upsertDraftItem(draft.id, productId, qty)
    setSavingIds(s => { const n = new Set(s); n.delete(productId); return n })
  }, [draft.id])

  // Update quantity and debounce the save (500 ms for typing, immediate for buttons)
  function updateQty(productId: string, next: number, immediate = false) {
    const safe = Math.max(0, Math.round(next))
    setQuantities(q => ({ ...q, [productId]: safe }))
    clearTimeout(debounceRefs.current[productId])
    if (immediate) {
      saveItem(productId, safe)
    } else {
      debounceRefs.current[productId] = setTimeout(() => saveItem(productId, safe), 500)
    }
  }

  const lineRevenue = useMemo(() =>
    Object.fromEntries(products.map(p => [
      p.id,
      (quantities[p.id] ?? 0) * (p.current_price ?? 0),
    ])),
  [products, quantities])

  const totalRevenue = useMemo(
    () => Object.values(lineRevenue).reduce((s, v) => s + v, 0),
    [lineRevenue]
  )

  async function handleSubmit() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError('')

    // Flush all pending debounces — save current values immediately
    Object.keys(debounceRefs.current).forEach(id => clearTimeout(debounceRefs.current[id]))
    const saves = products
      .filter(p => (quantities[p.id] ?? 0) > 0)
      .map(p => upsertDraftItem(draft.id, p.id, quantities[p.id]))
    if (saves.length > 0) await Promise.all(saves)

    const res = await submitDraft(draft.id)
    setIsSubmitting(false)

    if (res.error) { setError(res.error); return }
    setSubmitted(true)
    router.refresh()
  }

  // ─── Submitted state ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Отчёт за сегодня отправлен</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Данные зафиксированы. Общая выручка: <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
            </p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Итог отчёта</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-slate-50">
              {products
                .filter(p => (quantities[p.id] ?? 0) > 0)
                .map(p => (
                  <div key={p.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{quantities[p.id]} × {Number(p.current_price ?? 0).toFixed(4)}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(lineRevenue[p.id])}</span>
                  </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="font-semibold text-slate-900">Итого выручка</span>
              <span className="text-xl font-bold text-blue-700">{formatCurrency(totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Live entry form ──────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products list */}
      <div className="lg:col-span-2 space-y-2">
        {products.map(product => {
          const qty = quantities[product.id] ?? 0
          const isSaving = savingIds.has(product.id)
          const hasValue = qty > 0

          return (
            <Card
              key={product.id}
              className={`transition-all duration-200 ${hasValue ? 'ring-1 ring-blue-200 shadow-sm' : 'shadow-none'}`}
            >
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-none">{product.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {Number(product.current_price ?? 0).toFixed(4)} / шт.
                    </p>
                  </div>

                  {/* Quick-add buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, qty + 30, true)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95 transition-transform select-none"
                    >
                      +30
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, qty + 60, true)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95 transition-transform select-none"
                    >
                      +60
                    </button>
                  </div>

                  {/* Stepper + input */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, qty - 1, true)}
                      disabled={qty === 0}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 active:scale-95 transition-transform"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={qty === 0 ? '' : qty}
                      onChange={e => updateQty(product.id, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-16 h-8 text-center text-sm font-bold tabular-nums rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, qty + 1, true)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-transform"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="w-24 text-right shrink-0">
                    {hasValue ? (
                      <span className="text-sm font-semibold text-blue-700 tabular-nums">
                        {formatCurrency(lineRevenue[product.id])}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-200">—</span>
                    )}
                    <div className="h-3 flex justify-end mt-0.5">
                      {isSaving && (
                        <Circle className="h-1.5 w-1.5 fill-amber-400 text-amber-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary sidebar */}
      <div>
        <Card className="sticky top-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Итог</span>
              <span className="flex items-center gap-1.5 text-xs font-normal text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Черновик
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 min-h-[80px]">
              {products
                .filter(p => (quantities[p.id] ?? 0) > 0)
                .map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 truncate mr-2">{p.name} × {quantities[p.id]}</span>
                    <span className="font-medium text-slate-800 tabular-nums shrink-0">
                      {formatCurrency(lineRevenue[p.id])}
                    </span>
                  </div>
                ))}

              {totalRevenue === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  Введите количество слева
                </p>
              )}
            </div>

            {totalRevenue > 0 && (
              <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
                <span className="font-semibold text-slate-900">Итого</span>
                <span className="text-lg font-bold text-blue-700 tabular-nums">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || totalRevenue === 0}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Отправка...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Отправить отчёт</>
              )}
            </Button>

            <p className="text-xs text-slate-400 text-center mt-2">
              После отправки данные нельзя изменить
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
