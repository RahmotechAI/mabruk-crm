import {
  TrendingUp,
  DollarSign,
  Calendar,
  CalendarDays,
  Store,
  FileBarChart,
} from 'lucide-react'
import { getDashboardStats, getRevenueByDay, getRevenueByLocation, getTopProducts } from '@/server/actions/analytics'
import { getReports } from '@/server/actions/reports'
import { getDraftsForDate } from '@/server/actions/drafts'
import { getLocations } from '@/server/actions/locations'
import { getProducts } from '@/server/actions/products'
import { getEmployees } from '@/server/actions/employees'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { LocationsRevenueChart } from '@/components/admin/LocationsRevenueChart'
import { RecentReportsTable } from '@/components/admin/RecentReportsTable'
import { TopProductsTable } from '@/components/admin/TopProductsTable'
import { LiveDraftsPanel } from '@/components/admin/LiveDraftsPanel'
import { formatCurrency } from '@/lib/utils'
import { todayISO } from '@/lib/utils'

export default async function DashboardPage() {
  const today = todayISO()

  const [stats, revenueByDay, revenueByLocation, topProducts, recentReports,
         todayDrafts, locations, products, employees] =
    await Promise.all([
      getDashboardStats(),
      getRevenueByDay(30),
      getRevenueByLocation(30),
      getTopProducts(30),
      getReports({ limit: 10 }),
      getDraftsForDate(today),
      getLocations(),
      getProducts(),
      getEmployees(),
    ])

  return (
    <div>
      <PageHeader
        title="Дашборд"
        description="Общая картина бизнеса в режиме реального времени"
      />

      {/* Live reports from employees today */}
      <div className="mb-8">
        <LiveDraftsPanel
          initialDrafts={todayDrafts}
          locations={locations}
          products={products}
          employees={employees}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
        <StatCard
          title="Общая выручка"
          value={stats.total_revenue}
          isCurrency
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Выручка сегодня"
          value={stats.today_revenue}
          isCurrency
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="За 7 дней"
          value={stats.week_revenue}
          isCurrency
          icon={Calendar}
          iconColor="text-blue-700"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="За 30 дней"
          value={stats.month_revenue}
          isCurrency
          icon={CalendarDays}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Активных точек"
          value={stats.active_locations}
          icon={Store}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatCard
          title="Всего отчётов"
          value={stats.total_reports}
          icon={FileBarChart}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Выручка за 30 дней</CardTitle>
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

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Топ товаров (30 дней)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TopProductsTable data={topProducts} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Последние отчёты</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentReportsTable data={recentReports} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
