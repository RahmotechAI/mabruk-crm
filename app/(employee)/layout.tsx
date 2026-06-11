import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { EmployeeSidebar } from '@/components/shared/EmployeeSidebar'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.employee.role === 'admin') redirect('/dashboard')
  if (!user.employee.location_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Точка не назначена</p>
          <p className="mt-2 text-sm text-gray-500">
            Обратитесь к администратору для назначения торговой точки
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <EmployeeSidebar employee={user.employee} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
