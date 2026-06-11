'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { formatShortDate, formatCurrency } from '@/lib/utils'
import { deleteReport } from '@/server/actions/admin-reset'
import type { DailyReport } from '@/types'

interface Props {
  reports: DailyReport[]
}

export function ReportsTable({ reports: initialReports }: Props) {
  const [reports, setReports] = useState(initialReports)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete(id: string) {
    setError('')
    startTransition(async () => {
      const res = await deleteReport(id)
      if (res.error) { setError(res.error); setConfirmId(null); return }
      setReports(r => r.filter(rep => rep.id !== id))
      setConfirmId(null)
      setExpanded(null)
    })
  }

  if (!reports.length) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
        Отчётов не найдено
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Дата</TableHead>
            <TableHead>Точка</TableHead>
            <TableHead>Сотрудник</TableHead>
            <TableHead className="text-right">Выручка</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map(report => {
            const isOpen = expanded === report.id
            const isConfirming = confirmId === report.id
            const loc = report.location as { name?: string } | null
            const emp = report.employee as { name?: string } | null

            return (
              <>
                {/* Main row */}
                <TableRow
                  key={report.id}
                  className={`cursor-pointer ${isConfirming ? 'bg-red-50 hover:bg-red-50' : ''}`}
                  onClick={() => {
                    if (!isConfirming) setExpanded(isOpen ? null : report.id)
                  }}
                >
                  <TableCell>
                    {isOpen
                      ? <ChevronDown className="h-4 w-4 text-gray-400" />
                      : <ChevronRight className="h-4 w-4 text-gray-400" />
                    }
                  </TableCell>
                  <TableCell className="font-medium">{formatShortDate(report.report_date)}</TableCell>
                  <TableCell>{loc?.name ?? '—'}</TableCell>
                  <TableCell>{emp?.name ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(report.total_revenue)}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    {!isConfirming ? (
                      <button
                        onClick={() => { setConfirmId(report.id); setExpanded(null) }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Удалить отчёт"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </TableCell>
                </TableRow>

                {/* Inline confirm row */}
                {isConfirming && (
                  <TableRow key={`${report.id}-confirm`} className="bg-red-50 hover:bg-red-50">
                    <TableCell colSpan={6} className="py-2.5 px-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>
                            Удалить отчёт за <strong>{formatShortDate(report.report_date)}</strong>
                            {loc?.name ? ` · ${loc.name}` : ''}?
                            Также будут удалены связанные складские записи.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDelete(report.id)}
                            disabled={isPending}
                            className="h-7 px-3 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Да, удалить
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            disabled={isPending}
                            className="h-7 px-3 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Expand items */}
                {isOpen && report.items && (
                  <TableRow key={`${report.id}-items`} className="bg-gray-50 hover:bg-gray-50">
                    <TableCell colSpan={6} className="py-0">
                      <div className="py-3 pl-10">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left font-medium pb-2">Товар</th>
                              <th className="text-right font-medium pb-2">Кол-во</th>
                              <th className="text-right font-medium pb-2">Цена</th>
                              <th className="text-right font-medium pb-2">Сумма</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.items.map(item => {
                              const prod = item.product as { name?: string } | null
                              return (
                                <tr key={item.id} className="border-t border-gray-100">
                                  <td className="py-1.5 text-gray-800">{prod?.name ?? '—'}</td>
                                  <td className="py-1.5 text-right text-gray-600">{item.quantity}</td>
                                  <td className="py-1.5 text-right text-gray-600">{Number(item.unit_price).toFixed(4)}</td>
                                  <td className="py-1.5 text-right font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
