'use client'

import { useState, useTransition } from 'react'
import { Filter, RefreshCw, TrendingUp, TrendingDown, RotateCcw, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInventoryReport } from '@/server/actions/stock'
import type { InventoryReportRow, Location, Product, Employee } from '@/types'

interface Props {
  locations: Location[]
  products: Product[]
  employees: Employee[]
  initialData: InventoryReportRow[]
}

interface Filters {
  from: string
  to: string
  location_id: string
  product_id: string
  employee_id: string
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('ru')}</p>
    </div>
  )
}

export function AdminInventoryReport({ locations, products, employees, initialData }: Props) {
  const [data, setData] = useState<InventoryReportRow[]>(initialData)
  const [isPending, startTransition] = useTransition()

  const [filters, setFilters] = useState<Filters>({
    from: '',
    to: '',
    location_id: '',
    product_id: '',
    employee_id: '',
  })

  function fetchData(f: Filters) {
    startTransition(async () => {
      const result = await getInventoryReport({
        from: f.from || undefined,
        to: f.to || undefined,
        location_id: f.location_id || undefined,
        product_id: f.product_id || undefined,
        employee_id: f.employee_id || undefined,
      })
      setData(result)
    })
  }

  function handleChange(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    fetchData(next)
  }

  function handleReset() {
    const empty: Filters = { from: '', to: '', location_id: '', product_id: '', employee_id: '' }
    setFilters(empty)
    fetchData(empty)
  }

  const totals = data.reduce(
    (acc, row) => ({
      delivered: acc.delivered + row.delivered,
      sold: acc.sold + row.sold,
      returned: acc.returned + row.returned,
      remaining: acc.remaining + row.remaining,
    }),
    { delivered: 0, sold: 0, returned: 0, remaining: 0 }
  )

  const hasFilters = Object.values(filters).some(Boolean)

  const selectCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-blue-600" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">С даты</label>
              <input
                type="date"
                value={filters.from}
                onChange={e => handleChange('from', e.target.value)}
                className={selectCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">По дату</label>
              <input
                type="date"
                value={filters.to}
                onChange={e => handleChange('to', e.target.value)}
                className={selectCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Точка</label>
              <select
                value={filters.location_id}
                onChange={e => handleChange('location_id', e.target.value)}
                className={selectCls}
              >
                <option value="">Все точки</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Товар</label>
              <select
                value={filters.product_id}
                onChange={e => handleChange('product_id', e.target.value)}
                className={selectCls}
              >
                <option value="">Все товары</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Сотрудник</label>
              <select
                value={filters.employee_id}
                onChange={e => handleChange('employee_id', e.target.value)}
                className={selectCls}
              >
                <option value="">Все сотрудники</option>
                {employees.filter(e => e.role === 'employee').map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Сбросить фильтры
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Поступило"
            value={totals.delivered}
            color="bg-emerald-50 border-emerald-100 text-emerald-800"
          />
          <StatCard
            icon={<TrendingDown className="h-4 w-4" />}
            label="Продано"
            value={totals.sold}
            color="bg-blue-50 border-blue-100 text-blue-800"
          />
          <StatCard
            icon={<RotateCcw className="h-4 w-4" />}
            label="Возврат"
            value={totals.returned}
            color="bg-amber-50 border-amber-100 text-amber-800"
          />
          <StatCard
            icon={<Package className="h-4 w-4" />}
            label="Остаток"
            value={totals.remaining}
            color={`border ${totals.remaining < 0 ? 'bg-red-50 border-red-100 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          />
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-0 p-0">
          {isPending ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Загрузка...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-slate-400">Нет данных по выбранным фильтрам</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left font-semibold text-slate-600 py-3 px-4">Точка</th>
                    <th className="text-left font-semibold text-slate-600 py-3 px-4">Товар</th>
                    <th className="text-right font-semibold text-emerald-700 py-3 px-4">Поступило</th>
                    <th className="text-right font-semibold text-blue-700 py-3 px-4">Продано</th>
                    <th className="text-right font-semibold text-amber-700 py-3 px-4">Возврат</th>
                    <th className="text-right font-semibold text-red-600 py-3 px-4">Списание</th>
                    <th className="text-right font-semibold text-slate-800 py-3 px-4">Остаток</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr
                      key={`${row.location_id}-${row.product_id}-${i}`}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors last:border-0"
                    >
                      <td className="py-3 px-4 text-slate-700">{row.location_name}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{row.product_name}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-emerald-700">
                        {row.delivered > 0 ? row.delivered.toLocaleString('ru') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-blue-700">
                        {row.sold > 0 ? row.sold.toLocaleString('ru') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-amber-700">
                        {row.returned > 0 ? row.returned.toLocaleString('ru') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-red-600">
                        {row.lost > 0 ? row.lost.toLocaleString('ru') : '—'}
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums font-bold ${row.remaining < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {row.remaining.toLocaleString('ru')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
