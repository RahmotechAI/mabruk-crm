'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { RevenueByLocation } from '@/types'

const COLORS = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7']

interface Props {
  data: RevenueByLocation[]
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: { value: number; payload: RevenueByLocation }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{payload[0].payload.location_name}</p>
      <p className="font-semibold text-gray-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function LocationsRevenueChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Нет данных
      </div>
    )
  }

  const top = data.slice(0, 8)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={top} layout="vertical" margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={v => formatCurrency(v)}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="location_name"
          tick={{ fontSize: 11, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {top.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
