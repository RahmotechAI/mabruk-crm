'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatShortDate, formatCurrency } from '@/lib/utils'
import type { RevenueByDay } from '@/types'

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-400 mb-1">{label ? formatShortDate(label) : ''}</p>
      <p className="font-semibold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data.length) {
    return <div className="flex h-48 items-center justify-center text-sm text-slate-400">Нет данных</div>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tickFormatter={v => formatShortDate(v)}
          tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={v => formatCurrency(v)}
          tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
          fill="url(#blueGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
