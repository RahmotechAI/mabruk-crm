import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { formatShortDate, getMovementTypeLabel, getMovementTypeColor } from '@/lib/utils'
import type { StockMovement } from '@/types'

interface Props {
  movements: StockMovement[]
}

export function StockMovementsLog({ movements }: Props) {
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
        <CardTitle>История операций (последние 50)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead className="text-right">Кол-во</TableHead>
              <TableHead>Примечание</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map(m => {
              const prod = m.product as { name?: string } | null
              return (
                <TableRow key={m.id}>
                  <TableCell className="text-gray-500">{formatShortDate(m.movement_date)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getMovementTypeColor(m.type)}`}>
                      {getMovementTypeLabel(m.type)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{prod?.name ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{m.quantity}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{m.notes ?? '—'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
