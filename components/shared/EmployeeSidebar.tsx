'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Warehouse, History, LogOut, Egg } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/server/actions/auth'
import type { Employee } from '@/types'

const navItems = [
  { href: '/portal', label: 'Ежедневный отчёт', icon: ClipboardList },
  { href: '/stock', label: 'Склад', icon: Warehouse },
  { href: '/history', label: 'История', icon: History },
]

interface Props {
  employee: Employee
}

export function EmployeeSidebar({ employee }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-gray-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
          <Egg className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Mabruk CRM</p>
          <p className="text-xs text-gray-500 mt-0.5">Птицефабрика</p>
        </div>
      </div>

      {/* Employee info */}
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-sm font-medium text-white truncate">{employee.name}</p>
        {employee.location && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{employee.location.name}</p>
        )}
        <span className="mt-2 inline-flex items-center rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
          Сотрудник
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-gray-800 p-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  )
}
