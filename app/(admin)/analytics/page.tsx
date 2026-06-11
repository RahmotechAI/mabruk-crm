import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { LocationsRevenueChart } from '@/components/admin/LocationsRevenueChart'
import { TopProductsTable } from '@/components/admin/TopProductsTable'
import { StatCard } from '@/components/shared/StatCard'
import { getRevenueByDay, getRevenueByLocation, getTopProducts, getDashboardStats } from '@/server/actions/analytics'
import { getStockBalances } from '@/server/actions/stock'
import { getLocations } from '@/server/actions/locations'
import { TrendingUp, TrendingDown, Package, Store } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export default async function AnalyticsPage() {
  const [stats, revenueByDay, revenueByLocation, topProducts, stockBalances, locations] =
    await Promise.all([
      getDashboardStats(),
      getRevenueByDay(30),
      getRevenueByLocation(30),
      getTopProducts(30),
      getStockBalances(),
      getLocations(),
    ])

  const best = topProducts[0]
  const worst = topProducts[topProducts.length - 1]

  // Aggregate stock balances by product across all locations
  const stockMap = new Map<string, { name: string; balance: number }>()
  for (const row of stockBalances) {
    const prev = stockMap.get(row.product_id)
    if (prev) {
      prev.balance += row.balance
    } else {
      stockMap.set(row.product_id, { name: row.product_name, balance: row.balance })
    }
  }
  const aggregatedStock = Array.from(stockMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader title="Аналитика" description="Данные за последние 30 дней" />

      {/* Key metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Выручка за 30 дней"
          value={stats.month_revenue}
          isCurrency
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Лучший товар"
          value={best?.product_name ?? '—'}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Слабый товар"
          value={worst?.product_name ?? '—'}
          icon={TrendingDown}
          iconColor="text-red-500"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Активных точек"
          value={stats.active_locations}
          icon={Store}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Динамика выручки</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Выручка по точкам</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationsRevenueChart data={revenueByLocation} />
          </CardContent>
        </Card>
      </div>

      {/* Products & Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Рейтинг товаров</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TopProductsTable data={topProducts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Суммарный остаток по всем точкам</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedStock.map(row => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className={`text-right font-semibold ${row.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {row.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
