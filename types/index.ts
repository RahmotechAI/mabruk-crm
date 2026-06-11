export type UserRole = 'admin' | 'employee'

export type StockMovementType = 'incoming' | 'sale' | 'return' | 'loss'

// ─── Database entities ────────────────────────────────────────────────────────

export interface Location {
  id: string
  name: string
  address: string | null
  is_active: boolean
  created_at: string
}

export interface Employee {
  id: string
  name: string
  email: string
  role: UserRole
  location_id: string | null
  is_active: boolean
  created_at: string
  location?: Location
}

export interface Product {
  id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
  current_price?: number
}

export interface ProductPrice {
  id: string
  product_id: string
  price_per_unit: number
  valid_from: string
  valid_to: string | null
  created_at: string
  product?: Product
}

export interface DailyReport {
  id: string
  location_id: string
  employee_id: string
  report_date: string
  total_revenue: number
  created_at: string
  location?: Location
  employee?: Employee
  items?: ReportItem[]
}

export interface ReportItem {
  id: string
  report_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  product?: Product
}

export interface StockMovement {
  id: string
  location_id: string
  product_id: string
  employee_id: string
  type: StockMovementType
  quantity: number
  notes: string | null
  movement_date: string
  created_at: string
  location?: Location
  product?: Product
  employee?: Employee
}

// ─── Computed / view types ────────────────────────────────────────────────────

export interface StockBalance {
  product_id: string
  product_name: string
  incoming: number
  sold: number
  returned: number
  lost: number
  balance: number
}

export interface DashboardStats {
  total_revenue: number
  today_revenue: number
  week_revenue: number
  month_revenue: number
  total_reports: number
  active_locations: number
}

export interface RevenueByDay {
  date: string
  revenue: number
}

export interface RevenueByLocation {
  location_id: string
  location_name: string
  revenue: number
}

export interface ProductSales {
  product_id: string
  product_name: string
  total_quantity: number
  total_revenue: number
}

// ─── Form input types ─────────────────────────────────────────────────────────

export interface ReportItemInput {
  product_id: string
  quantity: number
}

export interface CreateReportInput {
  location_id: string
  report_date: string
  items: ReportItemInput[]
}

export interface StockMovementInput {
  location_id: string
  product_id: string
  type: StockMovementType
  quantity: number
  notes?: string
  movement_date: string
}

export interface CreateLocationInput {
  name: string
  address?: string
}

export interface CreateEmployeeInput {
  name: string
  email: string
  password: string
  role: UserRole
  location_id?: string
}

export interface UpdatePriceInput {
  product_id: string
  price_per_unit: number
}

// ─── Action result types ──────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  data?: T
  error?: string
}

export interface AuthUser {
  id: string
  email: string
  employee: Employee
}
