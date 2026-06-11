'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createDailyReport } from '@/server/actions/reports'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface Props {
  products: Product[]
  locationId: string
  reportDate: string
}

export function DailyReportForm({ products, locationId, reportDate }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [quantities, setQuantities] = useState<Record<string, string>>(
    Object.fromEntries(products.map(p => [p.id, '']))
  )

  function setQty(id: string, val: string) {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setQuantities(q => ({ ...q, [id]: val }))
    }
  }

  const lineTotal = useMemo(() => {
    return Object.fromEntries(
      products.map(p => {
        const qty = parseFloat(quantities[p.id] || '0') || 0
        return [p.id, qty * (p.current_price ?? 0)]
      })
    )
  }, [products, quantities])

  const totalRevenue = useMemo(
    () => Object.values(lineTotal).reduce((s, v) => s + v, 0),
    [lineTotal]
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const items = products
      .filter(p => parseFloat(quantities[p.id] || '0') > 0)
      .map(p => ({
        product_id: p.id,
        quantity: parseFloat(quantities[p.id]),
      }))

    if (items.length === 0) {
      setError('Введите количество хотя бы для одного товара')
      return
    }

    startTransition(async () => {
      const res = await createDailyReport({ location_id: locationId, report_date: reportDate, items })
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Введите количество проданного товара</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-gray-50">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 py-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Цена: {Number(product.current_price ?? 0).toFixed(4)}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={quantities[product.id]}
                      onChange={e => setQty(product.id, e.target.value)}
                      placeholder="0"
                      className="w-28 text-right"
                    />
                    <div className="w-28 text-right">
                      {lineTotal[product.id] > 0 ? (
                        <span className="text-sm font-medium text-amber-700">
                          {formatCurrency(lineTotal[product.id])}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Итог</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products
                  .filter(p => parseFloat(quantities[p.id] || '0') > 0)
                  .map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{p.name}</span>
                      <span className="font-medium">{formatCurrency(lineTotal[p.id])}</span>
                    </div>
                  ))}

                {totalRevenue > 0 && (
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Итого</span>
                    <span className="text-lg font-bold text-amber-600">
                      {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                )}

                {totalRevenue === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Введите данные слева
                  </p>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full mt-6" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</>
                ) : (
                  <><Save className="h-4 w-4" /> Сохранить отчёт</>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center mt-3">
                Отчёт нельзя будет изменить после сохранения
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
