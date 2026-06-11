import { getCurrentUser } from '@/server/actions/auth'
import { getReports } from '@/server/actions/reports'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportsTable } from '@/components/admin/ReportsTable'
import { formatCurrency } from '@/lib/utils'

export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user || !user.employee.location_id) return null

  const reports = await getReports({
    location_id: user.employee.location_id,
    limit: 30,
  })

  const totalRevenue = reports.reduce((s, r) => s + Number(r.total_revenue), 0)

  return (
    <div>
      <PageHeader
        title="История продаж"
        description="Ваши отчёты за последние 30 дней"
      />

      {reports.length > 0 && (
        <div className="mb-5 rounded-xl bg-amber-50 border border-amber-100 px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-700 font-medium">Итоговая выручка за период</span>
          <span className="text-lg font-bold text-amber-800">{formatCurrency(totalRevenue)}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Отчёты</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ReportsTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  )
}
