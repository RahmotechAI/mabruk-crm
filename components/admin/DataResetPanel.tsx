'use client'

import { useState } from 'react'
import { ShieldAlert, Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { resetData, type ResetOptions } from '@/server/actions/admin-reset'
import type { Location } from '@/types'

const CONFIRM_WORD = 'УДАЛИТЬ'

interface Props {
  locations: Location[]
}

type Target = 'reports' | 'stock_movements' | 'drafts'

const TARGET_LABELS: Record<Target, string> = {
  reports: 'Отчёты о продажах',
  stock_movements: 'Складские записи',
  drafts: 'Черновики (незавершённые отчёты)',
}

export function DataResetPanel({ locations }: Props) {
  const [targets, setTargets] = useState<Set<Target>>(new Set())
  const [locationId, setLocationId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: string; err?: string } | null>(null)

  function toggleTarget(t: Target) {
    setTargets(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
    setResult(null)
  }

  const isConfirmed = confirmText.trim() === CONFIRM_WORD
  const canSubmit = targets.size > 0 && isConfirmed && !isLoading

  const filterSummary = [
    locationId ? `Точка: ${locations.find(l => l.id === locationId)?.name}` : 'Все точки',
    dateFrom || dateTo
      ? `Период: ${dateFrom || '...'} — ${dateTo || '...'}`
      : 'Весь период',
  ].join(' · ')

  async function handleReset() {
    if (!canSubmit) return
    setIsLoading(true)
    setResult(null)

    const opts: ResetOptions = {
      targets: Array.from(targets),
      location_id: locationId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }

    const res = await resetData(opts)
    setIsLoading(false)

    if (res.error) {
      setResult({ err: res.error })
    } else {
      setResult({ ok: res.data?.message ?? 'Данные удалены' })
      setTargets(new Set())
      setConfirmText('')
      setDateFrom('')
      setDateTo('')
      setLocationId('')
    }
  }

  const selectCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400'

  return (
    <div className="space-y-5">
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-5 py-4">
        <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">Зона опасных операций</p>
          <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
            Удалённые данные невозможно восстановить. Используйте фильтры для точечного удаления
            или оставьте пустыми для полного сброса выбранных разделов.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Step 1: Select targets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">1</span>
              Что удалить
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(TARGET_LABELS) as Target[]).map(t => (
              <label
                key={t}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                  targets.has(t)
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={targets.has(t)}
                  onChange={() => toggleTarget(t)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-400"
                />
                <span className={`text-sm font-medium ${targets.has(t) ? 'text-red-700' : 'text-slate-700'}`}>
                  {TARGET_LABELS[t]}
                </span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Step 2: Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">2</span>
              Фильтры (необязательно)
            </CardTitle>
            <CardDescription className="text-xs">
              Оставьте пустыми — удалятся все данные выбранных разделов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Торговая точка</label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className={selectCls}
              >
                <option value="">Все точки</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">С даты</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={selectCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">По дату</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={selectCls} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Confirm */}
      {targets.size > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">3</span>
              Подтверждение
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
              <p className="font-medium text-slate-800 mb-1">Будет удалено:</p>
              <ul className="space-y-0.5 text-slate-600 text-xs">
                {Array.from(targets).map(t => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Trash2 className="h-3 w-3 text-red-500" />
                    {TARGET_LABELS[t]}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-2">{filterSummary}</p>
            </div>

            {/* Confirm input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Введите <span className="font-mono font-bold text-red-600">{CONFIRM_WORD}</span> для подтверждения
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                className="h-9 w-full max-w-xs rounded-lg border border-slate-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
              />
            </div>

            {/* Result */}
            {result?.err && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {result.err}
              </div>
            )}
            {result?.ok && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {result.ok}
              </div>
            )}

            <Button
              onClick={handleReset}
              disabled={!canSubmit}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Удаление...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Удалить данные</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
