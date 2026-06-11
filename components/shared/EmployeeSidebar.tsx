'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Warehouse, History, LogOut, Egg } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/server/actions/auth'
import type { Employee } from '@/types'

const navItems = [
  { href: '/portal',  label: 'Ежедневный отчёт', icon: ClipboardList },
  { href: '/inventory', label: 'Склад',            icon: Warehouse },
  { href: '/history', label: 'История',           icon: History },
]

interface Props { employee: Employee }

export function EmployeeSidebar({ employee }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col" style={{ background: '#0c1a2e' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#1a2d45' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Egg className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">Mabruk CRM</p>
          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Птицефабрика</p>
        </div>
      </div>

      {/* Employee info */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#1a2d45' }}>
        <p className="text-sm font-medium text-white truncate">{employee.name}</p>
        {employee.location && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#475569' }}>
            {(employee.location as { name?: string }).name}
          </p>
        )}
        <span className="mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-slate-700" style={{ background: '#1a2d45', color: '#94a3b8' }}>
          Сотрудник
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#1a2d45' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t" style={{ borderColor: '#1a2d45' }}>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-red-400"
            onMouseEnter={e => (e.currentTarget.style.background = '#1a2d45')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  )
}
