'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { formatShortDate, getMovementTypeLabel, getMovementTypeColor } from '@/lib/utils'
import { deleteStockMovement } from '@/server/actions/admin-reset'
import type { StockMovement } from '@/types'

interface Props {
  movements: StockMovement[]
}

export function StockMovementsLogAdmin({ movements: initialMovements }: Props) {
  const [movements, setMovements] = useState(initialMovements)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete(id: string) {
    setError('')
    startTransition(async () => {
      const res = await deleteStockMovement(id)
      if (res.error) { setError(res.error); setConfirmId(null); return }
      setMovements(m => m.filter(mv => mv.id !== id))
      setConfirmId(null)
    })
  }

  if (!movements.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">Операций нет</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>История операций (последние 100)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead>Сотрудник</TableHead>
              <TableHead className="text-right">Кол-во</TableHead>
              <TableHead>Примечание</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map(m => {
              const prod = m.product as { name?: string } | null
              const emp = m.employee as { name?: string } | null
              const isConfirming = confirmId === m.id

              return (
                <>
                  <TableRow
                    key={m.id}
                    className={isConfirming ? 'bg-red-50 hover:bg-red-50' : ''}
                  >
                    <TableCell className="text-gray-500">{formatShortDate(m.movement_date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getMovementTypeColor(m.type)}`}>
                        {getMovementTypeLabel(m.type)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{prod?.name ?? '—'}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{emp?.name ?? '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{m.quantity}</TableCell>
                    <TableCell className="text-gray-400 text-sm">{m.notes ?? '—'}</TableCell>
                    <TableCell>
                      {!isConfirming && (
                        <button
                          onClick={() => setConfirmId(m.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Удалить запись"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>

                  {isConfirming && (
                    <TableRow key={`${m.id}-confirm`} className="bg-red-50 hover:bg-red-50">
                      <TableCell colSpan={7} className="py-2.5 px-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-sm text-red-700">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>
                              Удалить запись <strong>{getMovementTypeLabel(m.type)}</strong>
                              {prod?.name ? ` · ${prod.name}` : ''} × {m.quantity}?
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleDelete(m.id)}
                              disabled={isPending}
                              className="h-7 px-3 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                              Да, удалить
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              disabled={isPending}
                              className="h-7 px-3 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
