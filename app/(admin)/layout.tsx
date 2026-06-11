import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { AdminSidebar } from '@/components/shared/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.employee.role !== 'admin') redirect('/portal')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
