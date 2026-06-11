import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { DailyReport } from '@/types'

interface Props {
  report: DailyReport
}

export function ExistingReportView({ report }: Props) {
  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Отчёт за сегодня уже сдан</p>
          <p className="text-xs text-emerald-600 mt-0.5">Вы можете посмотреть детали ниже</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Детали отчёта</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-50">
            {(report.items ?? []).map(item => {
              const prod = item.product as { name?: string } | null
              return (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{prod?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.quantity} × {Number(item.unit_price).toFixed(4)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Итого выручка</span>
            <span className="text-xl font-bold text-amber-600">
              {formatCurrency(report.total_revenue)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
