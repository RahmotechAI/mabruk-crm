-- ============================================================
-- Mabruk CRM — Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- ─── locations ────────────────────────────────────────────────────────────────

CREATE POLICY "locations_admin_all" ON locations
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "locations_employee_select" ON locations
  FOR SELECT TO authenticated
  USING (id = get_my_location_id());

-- ─── employees ────────────────────────────────────────────────────────────────

CREATE POLICY "employees_admin_all" ON employees
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "employees_self_select" ON employees
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ─── products ─────────────────────────────────────────────────────────────────

CREATE POLICY "products_admin_all" ON products
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "products_employee_select" ON products
  FOR SELECT TO authenticated
  USING (TRUE);

-- ─── product_prices ───────────────────────────────────────────────────────────

CREATE POLICY "prices_admin_all" ON product_prices
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "prices_employee_select" ON product_prices
  FOR SELECT TO authenticated
  USING (TRUE);

-- ─── daily_reports ────────────────────────────────────────────────────────────

CREATE POLICY "reports_admin_all" ON daily_reports
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "reports_employee_own_location" ON daily_reports
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'employee'
    AND location_id = get_my_location_id()
  )
  WITH CHECK (
    get_my_role() = 'employee'
    AND location_id = get_my_location_id()
    AND employee_id = auth.uid()
  );

-- ─── report_items ─────────────────────────────────────────────────────────────

CREATE POLICY "report_items_admin_all" ON report_items
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "report_items_employee_own" ON report_items
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'employee'
    AND report_id IN (
      SELECT id FROM daily_reports
      WHERE location_id = get_my_location_id()
    )
  )
  WITH CHECK (
    get_my_role() = 'employee'
    AND report_id IN (
      SELECT id FROM daily_reports
      WHERE location_id = get_my_location_id()
    )
  );

-- ─── stock_movements ──────────────────────────────────────────────────────────

CREATE POLICY "stock_admin_all" ON stock_movements
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "stock_employee_own_location" ON stock_movements
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'employee'
    AND location_id = get_my_location_id()
  )
  WITH CHECK (
    get_my_role() = 'employee'
    AND location_id = get_my_location_id()
    AND employee_id = auth.uid()
  );
