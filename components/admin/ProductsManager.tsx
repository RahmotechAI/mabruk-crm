'use client'

import { useState, useTransition } from 'react'
import { Pencil, Package, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { updatePrice, toggleProductActive } from '@/server/actions/products'
import type { Product } from '@/types'

interface Props {
  initialProducts: Product[]
}

export function ProductsManager({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [error, setError] = useState('')

  function startEdit(product: Product) {
    setEditingId(product.id)
    setPriceInput(String(product.current_price ?? 0))
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setPriceInput('')
    setError('')
  }

  function savePrice(product: Product) {
    const val = parseFloat(priceInput.replace(',', '.'))
    if (isNaN(val) || val < 0) { setError('Введите корректную цену'); return }

    startTransition(async () => {
      const res = await updatePrice({ product_id: product.id, price_per_unit: val })
      if (res.error) { setError(res.error); return }
      setProducts(prods => prods.map(p =>
        p.id === product.id ? { ...p, current_price: val } : p
      ))
      setEditingId(null)
    })
  }

  function toggleActive(product: Product) {
    startTransition(async () => {
      await toggleProductActive(product.id, !product.is_active)
      setProducts(prods => prods.map(p =>
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ))
    })
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Товар</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Текущая цена</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium">{product.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={product.is_active ? 'success' : 'secondary'}>
                  {product.is_active ? 'Активен' : 'Отключён'}
                </Badge>
              </TableCell>
              <TableCell>
                {editingId === product.id ? (
                  <Input
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    className="h-8 w-32 text-sm"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') savePrice(product)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                  />
                ) : (
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {Number(product.current_price ?? 0).toFixed(7)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {editingId === product.id ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => savePrice(product)} disabled={isPending}>
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => startEdit(product)} title="Изменить цену">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <button
                    onClick={() => toggleActive(product)}
                    disabled={isPending}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      product.is_active
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {product.is_active ? 'Откл.' : 'Вкл.'}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
