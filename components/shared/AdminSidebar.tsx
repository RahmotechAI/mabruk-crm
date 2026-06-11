'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart3, FileText, MapPin,
  Users, Package, Warehouse, LogOut, Egg,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/server/actions/auth'

const navItems = [
  { href: '/dashboard', label: 'Дашборд',      icon: LayoutDashboard },
  { href: '/analytics', label: 'Аналитика',    icon: BarChart3 },
  { href: '/reports',   label: 'Отчёты',       icon: FileText },
  { href: '/stock',     label: 'Склад',        icon: Warehouse },
  { href: '/locations', label: 'Точки',        icon: MapPin },
  { href: '/employees', label: 'Сотрудники',   icon: Users },
  { href: '/products',  label: 'Товары и цены', icon: Package },
]

export function AdminSidebar() {
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

      {/* Role badge */}
      <div className="px-4 pt-3 pb-1">
        <span className="inline-flex items-center rounded-md bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
          Администратор
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-2 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
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
