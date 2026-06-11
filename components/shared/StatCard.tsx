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
  change?: string
  changePositive?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  isCurrency,
  icon: Icon,
  iconColor = 'text-amber-600',
  iconBg = 'bg-amber-50',
  change,
  changePositive,
  className,
}: StatCardProps) {
  const displayValue = isCurrency
    ? formatCurrency(Number(value))
    : value

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
            {displayValue}
          </p>
          {change && (
            <p className={cn('mt-1 text-xs font-medium', changePositive ? 'text-emerald-600' : 'text-red-500')}>
              {change}
            </p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </Card>
  )
}
