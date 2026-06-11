'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { RevenueByLocation } from '@/types'

const BLUES = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

function CustomTooltip({ active, payload }: {
  active?: boolean; payload?: { value: number; payload: RevenueByLocation }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-400 mb-1">{payload[0].payload.location_name}</p>
      <p className="font-semibold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function LocationsRevenueChart({ data }: { data: RevenueByLocation[] }) {
  if (!data.length) {
    return <div className="flex h-48 items-center justify-center text-sm text-slate-400">Нет данных</div>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tickFormatter={v => formatCurrency(v)}
          tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="location_name"
          tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {data.slice(0, 8).map((_, i) => <Cell key={i} fill={BLUES[i % BLUES.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
