import { formatShortDate, formatCurrency } from '@/lib/utils'
import type { DailyReport } from '@/types'

interface Props {
  data: DailyReport[]
}

export function RecentReportsTable({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-gray-400 py-4">Отчётов пока нет</p>
  }

  return (
    <div className="divide-y divide-gray-50">
      {data.map(report => (
        <div key={report.id} className="flex items-center justify-between py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {(report.location as { name?: string } | null)?.name ?? '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatShortDate(report.report_date)} · {(report.employee as { name?: string } | null)?.name}
            </p>
          </div>
          <span className="ml-4 shrink-0 text-sm font-semibold text-gray-900">
            {formatCurrency(report.total_revenue)}
          </span>
        </div>
      ))}
    </div>
  )
}
