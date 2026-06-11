'use server'

import { createClient } from '@/lib/supabase/server'
import {
  DashboardStats,
  ProductSales,
  RevenueByDay,
  RevenueByLocation,
} from '@/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)

  const [
    { data: allRevenue },
    { data: todayRevenue },
    { data: weekRevenue },
    { data: monthRevenue },
    { count: totalReports },
    { count: activeLocations },
  ] = await Promise.all([
    supabase.from('daily_reports').select('total_revenue'),
    supabase.from('daily_reports').select('total_revenue').eq('report_date', todayStr),
    supabase.from('daily_reports').select('total_revenue').gte('report_date', weekAgo.toISOString().split('T')[0]),
    supabase.from('daily_reports').select('total_revenue').gte('report_date', monthAgo.toISOString().split('T')[0]),
    supabase.from('daily_reports').select('id', { count: 'exact', head: true }),
    supabase.from('locations').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const sum = (rows: { total_revenue: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Number(r.total_revenue), 0)

  return {
    total_revenue: sum(allRevenue),
    today_revenue: sum(todayRevenue),
    week_revenue: sum(weekRevenue),
    month_revenue: sum(monthRevenue),
    total_reports: totalReports ?? 0,
    active_locations: activeLocations ?? 0,
  }
}

export async function getRevenueByDay(days = 30): Promise<RevenueByDay[]> {
  const supabase = await createClient()

  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data } = await supabase
    .from('daily_reports')
    .select('report_date, total_revenue')
    .gte('report_date', from.toISOString().split('T')[0])
    .order('report_date')

  if (!data) return []

  // Aggregate by date
  const map = new Map<string, number>()
  for (const row of data) {
    const prev = map.get(row.report_date) ?? 0
    map.set(row.report_date, prev + Number(row.total_revenue))
  }

  return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }))
}

export async function getRevenueByLocation(days = 30): Promise<RevenueByLocation[]> {
  const supabase = await createClient()

  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data } = await supabase
    .from('daily_reports')
    .select('location_id, total_revenue, location:locations(name)')
    .gte('report_date', from.toISOString().split('T')[0])

  if (!data) return []

  const map = new Map<string, { name: string; revenue: number }>()
  for (const row of data) {
    const loc = (row.location as unknown) as { name: string } | null
    const name = loc?.name ?? row.location_id
    const prev = map.get(row.location_id)
    if (prev) {
      prev.revenue += Number(row.total_revenue)
    } else {
      map.set(row.location_id, { name, revenue: Number(row.total_revenue) })
    }
  }

  return Array.from(map.entries())
    .map(([location_id, { name, revenue }]) => ({
      location_id,
      location_name: name,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getTopProducts(days = 30): Promise<ProductSales[]> {
  const supabase = await createClient()

  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data } = await supabase
    .from('report_items')
    .select('product_id, quantity, total_price, product:products(name), report:daily_reports(report_date)')
    .gte('report:daily_reports.report_date', from.toISOString().split('T')[0])

  if (!data) return []

  const map = new Map<string, { name: string; qty: number; rev: number }>()
  for (const row of data) {
    // Filter rows where the joined report_date condition applied
    const report = (row.report as unknown) as { report_date: string } | null
    if (!report) continue

    const product = (row.product as unknown) as { name: string } | null
    const name = product?.name ?? row.product_id
    const prev = map.get(row.product_id)
    if (prev) {
      prev.qty += Number(row.quantity)
      prev.rev += Number(row.total_price)
    } else {
      map.set(row.product_id, { name, qty: Number(row.quantity), rev: Number(row.total_price) })
    }
  }

  return Array.from(map.entries())
    .map(([product_id, { name, qty, rev }]) => ({
      product_id,
      product_name: name,
      total_quantity: qty,
      total_revenue: rev,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
}
