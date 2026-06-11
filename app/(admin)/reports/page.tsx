import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getReports } from '@/server/actions/reports'
import { getLocations } from '@/server/actions/locations'
import { ReportsFilters } from '@/components/admin/ReportsFilters'
import { ReportsTable } from '@/components/admin/ReportsTable'

interface SearchParams {
  location_id?: string
  from?: string
  to?: string
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const [reports, locations] = await Promise.all([
    getReports({
      location_id: sp.location_id,
      from: sp.from,
      to: sp.to,
    }),
    getLocations(),
  ])

  const totalRevenue = reports.reduce((s, r) => s + Number(r.total_revenue), 0)

  return (
    <div>
      <PageHeader
        title="Отчёты о продажах"
        description={`Найдено ${reports.length} отчётов`}
      />

      <ReportsFilters locations={locations} />

      {reports.length > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-700 font-medium">Итоговая выручка за период</span>
          <span className="text-lg font-bold text-amber-800">
            {new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(totalRevenue)}
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>История отчётов</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ReportsTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  )
}
