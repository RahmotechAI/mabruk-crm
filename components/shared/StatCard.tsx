import { cn, formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  isCurrency?: boolean
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  sub?: string
  className?: string
}

export function StatCard({
  title, value, isCurrency, icon: Icon,
  iconColor = 'text-blue-600', iconBg = 'bg-blue-50',
  sub, className,
}: StatCardProps) {
  const displayValue = isCurrency ? formatCurrency(Number(value)) : value

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tracking-tight truncate">
            {displayValue}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </Card>
  )
}
