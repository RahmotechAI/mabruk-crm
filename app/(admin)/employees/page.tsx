import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { getEmployees } from '@/server/actions/employees'
import { getLocations } from '@/server/actions/locations'
import { EmployeesManager } from '@/components/admin/EmployeesManager'

export default async function EmployeesPage() {
  const [employees, locations] = await Promise.all([
    getEmployees(),
    getLocations(),
  ])

  return (
    <div>
      <PageHeader title="Сотрудники" description="Управление учётными записями сотрудников" />
      <Card>
        <CardContent className="pt-6">
          <EmployeesManager initialEmployees={employees} locations={locations} />
        </CardContent>
      </Card>
    </div>
  )
}
