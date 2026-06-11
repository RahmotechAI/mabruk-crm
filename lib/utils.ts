import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: ru })
  } catch {
    return dateStr
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: ru })
  } catch {
    return dateStr
  }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function getMovementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    incoming: 'Поступление',
    sale: 'Продажа',
    return: 'Возврат',
    loss: 'Списание',
  }
  return labels[type] ?? type
}

export function getMovementTypeColor(type: string): string {
  const colors: Record<string, string> = {
    incoming: 'text-emerald-600 bg-emerald-50',
    sale: 'text-blue-600 bg-blue-50',
    return: 'text-amber-600 bg-amber-50',
    loss: 'text-red-600 bg-red-50',
  }
  return colors[type] ?? 'text-gray-600 bg-gray-50'
}
