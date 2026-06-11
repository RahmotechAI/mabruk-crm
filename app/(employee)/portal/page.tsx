import { getCurrentUser } from '@/server/actions/auth'
import { getProducts } from '@/server/actions/products'
import { getReportByDate } from '@/server/actions/reports'
import { PageHeader } from '@/components/shared/PageHeader'
import { DailyReportForm } from '@/components/employee/DailyReportForm'
import { ExistingReportView } from '@/components/employee/ExistingReportView'
import { todayISO } from '@/lib/utils'

export default async function PortalPage() {
  const [user, products] = await Promise.all([
    getCurrentUser(),
    getProducts(),
  ])

  if (!user || !user.employee.location_id) return null

  const today = todayISO()
  const existingReport = await getReportByDate(user.employee.location_id, today)

  return (
    <div>
      <PageHeader
        title="Ежедневный отчёт"
        description={`${user.employee.location?.name ?? 'Ваша точка'} · ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {existingReport ? (
        <ExistingReportView report={existingReport} />
      ) : (
        <DailyReportForm
          products={products}
          locationId={user.employee.location_id}
          reportDate={today}
        />
      )}
    </div>
  )
}
