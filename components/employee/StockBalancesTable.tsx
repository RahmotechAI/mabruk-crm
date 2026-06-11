import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import type { StockBalance } from '@/types'

interface Props {
  balances: StockBalance[]
}

export function StockBalancesTable({ balances }: Props) {
  if (!balances.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">Данных по складу нет</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Остатки по складу</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead className="text-right">Поступило</TableHead>
              <TableHead className="text-right">Продано</TableHead>
              <TableHead className="text-right">Возврат</TableHead>
              <TableHead className="text-right">Списание</TableHead>
              <TableHead className="text-right font-bold">Остаток</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map(row => (
              <TableRow key={row.product_id}>
                <TableCell className="font-medium">{row.product_name}</TableCell>
                <TableCell className="text-right text-emerald-700">{row.incoming}</TableCell>
                <TableCell className="text-right text-blue-700">{row.sold}</TableCell>
                <TableCell className="text-right text-amber-700">{row.returned}</TableCell>
                <TableCell className="text-right text-red-600">{row.lost}</TableCell>
                <TableCell className={`text-right font-bold text-base ${row.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {row.balance}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
