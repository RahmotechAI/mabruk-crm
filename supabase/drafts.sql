-- ============================================================
-- Mabruk CRM — Live Report Drafts
-- Run this AFTER schema.sql and rls.sql in Supabase SQL Editor
-- ============================================================

-- ─── report_drafts ────────────────────────────────────────────────────────────
-- One row per location per day. Status 'draft' while employee is typing,
-- becomes 'submitted' once they finalise the day's report.

CREATE TABLE IF NOT EXISTS report_drafts (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  employee_id UUID        NOT NULL REFERENCES employees(id),
  report_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, report_date)
);

-- ─── report_draft_items ───────────────────────────────────────────────────────
-- One row per product per draft. Upserted on every quantity change.

CREATE TABLE IF NOT EXISTS report_draft_items (
  id         UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id   UUID           NOT NULL REFERENCES report_drafts(id) ON DELETE CASCADE,
  product_id UUID           NOT NULL REFERENCES products(id),
  quantity   NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (draft_id, product_id)
);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS drafts_updated_at ON report_drafts;
CREATE TRIGGER drafts_updated_at
  BEFORE UPDATE ON report_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS draft_items_updated_at ON report_draft_items;
CREATE TRIGGER draft_items_updated_at
  BEFORE UPDATE ON report_draft_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE report_drafts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_draft_items ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all drafts
CREATE POLICY "drafts_admin_all" ON report_drafts
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee: own location's draft only
CREATE POLICY "drafts_employee_own" ON report_drafts
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

-- Admin: full access to all draft items
CREATE POLICY "draft_items_admin_all" ON report_draft_items
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee: items belonging to their own location's draft
CREATE POLICY "draft_items_employee_own" ON report_draft_items
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'employee'
    AND draft_id IN (
      SELECT id FROM report_drafts
      WHERE location_id = get_my_location_id()
    )
  )
  WITH CHECK (
    get_my_role() = 'employee'
    AND draft_id IN (
      SELECT id FROM report_drafts
      WHERE location_id = get_my_location_id()
        AND employee_id = auth.uid()
    )
  );

-- ─── Enable Supabase Realtime ─────────────────────────────────────────────────
-- This broadcasts row changes to subscribed clients (employees + admin).

ALTER PUBLICATION supabase_realtime ADD TABLE report_drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE report_draft_items;
