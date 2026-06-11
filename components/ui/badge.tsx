import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      variant: {
        default:     'bg-blue-50 text-blue-700 ring-blue-600/20',
        secondary:   'bg-slate-100 text-slate-600 ring-slate-500/20',
        destructive: 'bg-red-50 text-red-700 ring-red-600/20',
        success:     'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        outline:     'bg-white text-slate-700 ring-slate-200',
        warning:     'bg-amber-50 text-amber-700 ring-amber-600/20',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
