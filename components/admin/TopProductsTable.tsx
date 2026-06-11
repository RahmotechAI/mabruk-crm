import { formatCurrency } from '@/lib/utils'
import type { ProductSales } from '@/types'

interface Props {
  data: ProductSales[]
}

export function TopProductsTable({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-gray-400 py-4">Нет данных</p>
  }

  const maxRevenue = Math.max(...data.map(d => d.total_revenue))

  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((item, i) => (
        <div key={item.product_id} className="flex items-center gap-3">
          <span className="w-5 text-xs font-medium text-gray-400 shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800 truncate">
                {item.product_name}
              </span>
              <span className="text-xs text-gray-500 ml-2 shrink-0">
                {formatCurrency(item.total_revenue)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${(item.total_revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
