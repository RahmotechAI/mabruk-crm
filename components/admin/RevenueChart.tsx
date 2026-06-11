'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatShortDate, formatCurrency } from '@/lib/utils'
import type { RevenueByDay } from '@/types'

interface Props {
  data: RevenueByDay[]
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{label ? formatShortDate(label) : ''}</p>
      <p className="font-semibold text-gray-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function RevenueChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Нет данных за выбранный период
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={v => formatShortDate(v)}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={v => formatCurrency(v)}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
