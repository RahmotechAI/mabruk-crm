import { getCurrentUser } from '@/server/actions/auth'
import { getProducts } from '@/server/actions/products'
import { getOrCreateDraft } from '@/server/actions/drafts'
import { getReportByDate } from '@/server/actions/reports'
import { PageHeader } from '@/components/shared/PageHeader'
import { LiveReportForm } from '@/components/employee/LiveReportForm'
import { ExistingReportView } from '@/components/employee/ExistingReportView'
import { todayISO } from '@/lib/utils'

export default async function PortalPage() {
  const [user, products] = await Promise.all([
    getCurrentUser(),
    getProducts(),
  ])

  if (!user || !user.employee.location_id) return null

  const today = todayISO()
  const locationName = (user.employee.location as { name?: string } | null)?.name ?? 'Ваша точка'
  const dateLabel = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // If a finalised report already exists, show it read-only
  const existingReport = await getReportByDate(user.employee.location_id, today)
  if (existingReport) {
    return (
      <div>
        <PageHeader
          title="Ежедневный отчёт"
          description={`${locationName} · ${dateLabel}`}
        />
        <ExistingReportView report={existingReport} />
      </div>
    )
  }

  // Otherwise get or create a live draft
  const draft = await getOrCreateDraft(user.employee.location_id, today)
  if (!draft) {
    return (
      <div className="text-sm text-red-500 p-4">
        Ошибка загрузки черновика. Обновите страницу.
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Ежедневный отчёт"
        description={`${locationName} · ${dateLabel}`}
      />
      <LiveReportForm draft={draft} products={products} />
    </div>
  )
}
