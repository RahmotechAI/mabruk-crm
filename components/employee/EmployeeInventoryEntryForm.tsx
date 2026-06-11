'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { addInventoryBatch } from '@/server/actions/stock'
import { todayISO } from '@/lib/utils'
import type { Product, StockBalance } from '@/types'

interface ProductRow {
  product_id: string
  product_name: string
  current_balance: number
  delivered: string
  sold: string
  returned: string
}

interface Props {
  products: Product[]
  locationId: string
  balances: StockBalance[]
}

export function EmployeeInventoryEntryForm({ products, locationId, balances }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [date, setDate] = useState(todayISO())

  const balanceMap = new Map(balances.map(b => [b.product_id, b.balance]))

  const [rows, setRows] = useState<ProductRow[]>(() =>
    products.map(p => ({
      product_id: p.id,
      product_name: p.name,
      current_balance: balanceMap.get(p.id) ?? 0,
      delivered: '',
      sold: '',
      returned: '',
    }))
  )

  function updateRow(idx: number, field: 'delivered' | 'sold' | 'returned', val: string) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [field]: val } : row))
  }

  function computeNewBalance(row: ProductRow): number {
    const d = parseFloat(row.delivered.replace(',', '.')) || 0
    const s = parseFloat(row.sold.replace(',', '.')) || 0
    const ret = parseFloat(row.returned.replace(',', '.')) || 0
    return row.current_balance + d - s + ret
  }

  function hasAnyEntry(): boolean {
    return rows.some(r => r.delivered || r.sold || r.returned)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const items = rows
      .filter(r => r.delivered || r.sold || r.returned)
      .map(r => ({
        product_id: r.product_id,
        delivered: parseFloat(r.delivered.replace(',', '.')) || 0,
        sold: parseFloat(r.sold.replace(',', '.')) || 0,
        returned: parseFloat(r.returned.replace(',', '.')) || 0,
      }))

    if (items.length === 0) {
      setError('Введите данные хотя бы по одному товару')
      return
    }

    startTransition(async () => {
      const res = await addInventoryBatch({ location_id: locationId, movement_date: date, items })
      if (res.error) { setError(res.error); return }

      setSuccess('Данные сохранены успешно')
      setRows(r => r.map(row => ({ ...row, delivered: '', sold: '', returned: '' })))
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Ввод складских данных
        </CardTitle>
        <CardDescription>
          Заполните только строки с движением товаров. Остаток рассчитывается автоматически.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Дата</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left font-semibold text-slate-600 py-3 px-4 min-w-[130px]">Товар</th>
                  <th className="text-right font-semibold text-slate-500 py-3 px-3 min-w-[90px]">
                    <span className="text-xs uppercase tracking-wide">Остаток</span>
                  </th>
                  <th className="text-center font-semibold text-emerald-700 py-3 px-3 min-w-[110px]">
                    <span className="text-xs uppercase tracking-wide">+ Поступило</span>
                  </th>
                  <th className="text-center font-semibold text-blue-700 py-3 px-3 min-w-[110px]">
                    <span className="text-xs uppercase tracking-wide">− Продано</span>
                  </th>
                  <th className="text-center font-semibold text-amber-700 py-3 px-3 min-w-[110px]">
                    <span className="text-xs uppercase tracking-wide">+ Возврат</span>
                  </th>
                  <th className="text-right font-semibold text-slate-800 py-3 px-4 min-w-[100px]">
                    <span className="text-xs uppercase tracking-wide">= Итого</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const hasEntry = !!(row.delivered || row.sold || row.returned)
                  const newBalance = computeNewBalance(row)
                  const displayBalance = hasEntry ? newBalance : row.current_balance
                  const isNegative = displayBalance < 0

                  return (
                    <tr
                      key={row.product_id}
                      className={`border-b border-slate-100 transition-colors last:border-0 ${hasEntry ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="py-2.5 px-4 font-medium text-slate-800">{row.product_name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                        {row.current_balance}
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.delivered}
                          onChange={e => updateRow(idx, 'delivered', e.target.value)}
                          placeholder="0"
                          className="h-8 text-right tabular-nums focus:ring-emerald-500 focus:border-emerald-400"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.sold}
                          onChange={e => updateRow(idx, 'sold', e.target.value)}
                          placeholder="0"
                          className="h-8 text-right tabular-nums focus:ring-blue-500 focus:border-blue-400"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.returned}
                          onChange={e => updateRow(idx, 'returned', e.target.value)}
                          placeholder="0"
                          className="h-8 text-right tabular-nums focus:ring-amber-500 focus:border-amber-400"
                        />
                      </td>
                      <td className={`py-2.5 px-4 text-right font-bold tabular-nums text-base ${isNegative ? 'text-red-600' : hasEntry ? 'text-blue-700' : 'text-slate-700'}`}>
                        {displayBalance}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              disabled={isPending || !hasAnyEntry()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Сохранение...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Сохранить движения</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
