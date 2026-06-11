'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Activity, CheckCircle2, Clock, Wifi } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { ReportDraft, ReportDraftItem, Location, Product, Employee } from '@/types'

interface Props {
  initialDrafts: ReportDraft[]
  locations: Location[]
  products: Product[]
  employees: Employee[]
}

type DraftMap = Map<string, ReportDraft>
type ItemsMap = Map<string, Map<string, number>> // draft_id → product_id → quantity

function buildMaps(drafts: ReportDraft[]): { draftMap: DraftMap; itemsMap: ItemsMap } {
  const draftMap: DraftMap = new Map()
  const itemsMap: ItemsMap = new Map()

  for (const d of drafts) {
    draftMap.set(d.id, d)
    const productQtys: Map<string, number> = new Map()
    d.items?.forEach(i => productQtys.set(i.product_id, Number(i.quantity)))
    itemsMap.set(d.id, productQtys)
  }

  return { draftMap, itemsMap }
}

export function LiveDraftsPanel({ initialDrafts, locations, products, employees }: Props) {
  const initial = buildMaps(initialDrafts)
  const [draftMap, setDraftMap] = useState<DraftMap>(initial.draftMap)
  const [itemsMap, setItemsMap] = useState<ItemsMap>(initial.itemsMap)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations])
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products])
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees])

  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
  [])

  useEffect(() => {
    // Subscribe to draft status changes
    const draftsChannel = supabase
      .channel('live-drafts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'report_drafts' },
        payload => {
          setLastUpdate(new Date())
          if (payload.eventType === 'INSERT') {
            const row = payload.new as ReportDraft
            setDraftMap(m => {
              const next = new Map(m)
              next.set(row.id, {
                ...row,
                location: locationMap.get(row.location_id),
                employee: employeeMap.get(row.employee_id),
              } as ReportDraft)
              return next
            })
            setItemsMap(m => { const n = new Map(m); n.set(row.id, new Map()); return n })
          }
          if (payload.eventType === 'UPDATE') {
            const row = payload.new as ReportDraft
            setDraftMap(m => {
              const next = new Map(m)
              const existing = m.get(row.id)
              if (existing) next.set(row.id, { ...existing, status: row.status, updated_at: row.updated_at })
              return next
            })
          }
        }
      )
      .subscribe(status => {
        setConnected(status === 'SUBSCRIBED')
      })

    // Subscribe to item quantity changes
    const itemsChannel = supabase
      .channel('live-draft-items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'report_draft_items' },
        payload => {
          setLastUpdate(new Date())
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as ReportDraftItem
            setItemsMap(m => {
              const next = new Map(m)
              const draftItems = new Map(next.get(row.draft_id) ?? [])
              draftItems.set(row.product_id, Number(row.quantity))
              next.set(row.draft_id, draftItems)
              return next
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(draftsChannel)
      supabase.removeChannel(itemsChannel)
    }
  }, [supabase, locationMap, employeeMap])

  const drafts = Array.from(draftMap.values()).sort((a, b) =>
    a.location_id.localeCompare(b.location_id)
  )

  if (drafts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-blue-600" />
            Live отчёты
            <LiveBadge connected={connected} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 py-4 text-center">
            Ни один сотрудник ещё не начал отчёт на сегодня
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Activity className="h-4 w-4 text-blue-600" />
          Live отчёты сегодня
          <LiveBadge connected={connected} />
        </h2>
        {lastUpdate && (
          <span className="text-xs text-slate-400">
            Обновлено {lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {drafts.map(draft => {
          const draftItems = itemsMap.get(draft.id) ?? new Map()
          const loc = (draft.location as { name?: string } | null)?.name
            ?? locationMap.get(draft.location_id)?.name ?? '—'
          const emp = (draft.employee as { name?: string } | null)?.name
            ?? employeeMap.get(draft.employee_id)?.name ?? '—'
          const isSubmitted = draft.status === 'submitted'

          // Calculate preview revenue
          let revenue = 0
          const lines: { name: string; qty: number; total: number }[] = []
          draftItems.forEach((qty, productId) => {
            if (qty <= 0) return
            const product = productMap.get(productId)
            if (!product) return
            const total = qty * (product.current_price ?? 0)
            revenue += total
            lines.push({ name: product.name, qty, total })
          })

          return (
            <Card
              key={draft.id}
              className={`transition-all ${isSubmitted ? 'opacity-70' : 'ring-1 ring-blue-100'}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{loc}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{emp}</p>
                  </div>
                  {isSubmitted ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Сдан
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">
                      <Clock className="h-3 w-3" />
                      В процессе
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {lines.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Данных ещё нет...</p>
                ) : (
                  <div className="space-y-1">
                    {lines.map(l => (
                      <div key={l.name} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">{l.name} × {l.qty}</span>
                        <span className="text-slate-800 font-medium tabular-nums">
                          {formatCurrency(l.total)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-1 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-700">Итого</span>
                      <span className="text-sm font-bold text-blue-700 tabular-nums">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function LiveBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-normal px-2 py-0.5 rounded-full border ${connected ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
      <Wifi className="h-3 w-3" />
      {connected ? 'Live' : 'Подключение...'}
    </span>
  )
}
