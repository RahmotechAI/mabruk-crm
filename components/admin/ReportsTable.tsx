'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { formatShortDate, formatCurrency } from '@/lib/utils'
import type { DailyReport } from '@/types'

interface Props {
  reports: DailyReport[]
}

export function ReportsTable({ reports }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!reports.length) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
        Отчётов не найдено
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Дата</TableHead>
          <TableHead>Точка</TableHead>
          <TableHead>Сотрудник</TableHead>
          <TableHead className="text-right">Выручка</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map(report => {
          const isOpen = expanded === report.id
          const loc = report.location as { name?: string } | null
          const emp = report.employee as { name?: string } | null
          return (
            <>
              <TableRow
                key={report.id}
                className="cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : report.id)}
              >
                <TableCell>
                  {isOpen
                    ? <ChevronDown className="h-4 w-4 text-gray-400" />
                    : <ChevronRight className="h-4 w-4 text-gray-400" />
                  }
                </TableCell>
                <TableCell className="font-medium">
                  {formatShortDate(report.report_date)}
                </TableCell>
                <TableCell>{loc?.name ?? '—'}</TableCell>
                <TableCell>{emp?.name ?? '—'}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(report.total_revenue)}
                </TableCell>
              </TableRow>
              {isOpen && report.items && (
                <TableRow key={`${report.id}-items`} className="bg-gray-50 hover:bg-gray-50">
                  <TableCell colSpan={5} className="py-0">
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
  )
}
