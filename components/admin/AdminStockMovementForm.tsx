'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addStockMovement } from '@/server/actions/stock'
import { todayISO } from '@/lib/utils'
import type { Product, StockMovementType } from '@/types'

const TYPES: { value: StockMovementType; label: string }[] = [
  { value: 'incoming', label: 'Поступление' },
  { value: 'return',   label: 'Возврат' },
  { value: 'loss',     label: 'Списание' },
]

interface Props {
  products: Product[]
  locationId: string
}

export function AdminStockMovementForm({ products, locationId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    product_id: '',
    type: 'incoming' as StockMovementType,
    quantity: '',
    notes: '',
    movement_date: todayISO(),
  })

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const qty = parseFloat(form.quantity.replace(',', '.'))
    if (!form.product_id) { setError('Выберите товар'); return }
    if (isNaN(qty) || qty <= 0) { setError('Введите корректное количество'); return }

    startTransition(async () => {
      const res = await addStockMovement({
        location_id: locationId,
        product_id: form.product_id,
        type: form.type,
        quantity: qty,
        notes: form.notes,
        movement_date: form.movement_date,
      })
      if (res.error) { setError(res.error); return }
      setSuccess('Операция сохранена успешно')
      setForm(f => ({ ...f, product_id: '', quantity: '', notes: '' }))
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Новая складская операция</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Тип операции *</Label>
              <div className="flex gap-2">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('type', t.value)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      form.type === t.value
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Товар *</Label>
              <Select value={form.product_id} onValueChange={v => set('product_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите товар" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Количество *</Label>
              <Input
                type="number"
                min="0.01"
                step="1"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Дата</Label>
              <Input
                type="date"
                value={form.movement_date}
                onChange={e => set('movement_date', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Примечание</Label>
              <Textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Необязательное пояснение..."
                rows={2}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</>
                : <><Save className="h-4 w-4" /> Сохранить</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
