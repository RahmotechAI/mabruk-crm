-- ============================================================
-- Mabruk CRM — Database Schema
-- Run this file first in the Supabase SQL editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── locations ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  address    TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── employees ───────────────────────────────────────────────────────────────
-- id mirrors auth.users.id so we can join on auth.uid()
CREATE TABLE IF NOT EXISTS employees (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','employee')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── products ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── product_prices ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_prices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_per_unit NUMERIC(12,7) NOT NULL CHECK (price_per_unit >= 0),
  valid_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── daily_reports ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id),
  report_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  total_revenue NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, report_date)
);

-- ─── report_items ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id   UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price  NUMERIC(12,7) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── stock_movements ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  employee_id   UUID NOT NULL REFERENCES employees(id),
  type          TEXT NOT NULL CHECK (type IN ('incoming','sale','return','loss')),
  quantity      NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  notes         TEXT,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Helper functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM employees WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_location_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT location_id FROM employees WHERE id = auth.uid();
$$;

-- ─── Current price view ───────────────────────────────────────────────────────

CREATE OR REPLACE VIEW current_prices AS
SELECT DISTINCT ON (product_id)
  pp.id,
  pp.product_id,
  pp.price_per_unit,
  pp.valid_from,
  pp.valid_to,
  p.name AS product_name,
  p.sort_order
FROM product_prices pp
JOIN products p ON p.id = pp.product_id
WHERE pp.valid_to IS NULL
ORDER BY product_id, pp.valid_from DESC;

-- ─── Stock balance view ───────────────────────────────────────────────────────

CREATE OR REPLACE VIEW stock_balances AS
SELECT
  sm.location_id,
  sm.product_id,
  p.name AS product_name,
  p.sort_order,
  COALESCE(SUM(CASE WHEN sm.type = 'incoming' THEN sm.quantity ELSE 0 END), 0) AS incoming,
  COALESCE(SUM(CASE WHEN sm.type = 'sale'     THEN sm.quantity ELSE 0 END), 0) AS sold,
  COALESCE(SUM(CASE WHEN sm.type = 'return'   THEN sm.quantity ELSE 0 END), 0) AS returned,
  COALESCE(SUM(CASE WHEN sm.type = 'loss'     THEN sm.quantity ELSE 0 END), 0) AS lost,
  COALESCE(SUM(CASE WHEN sm.type = 'incoming' THEN sm.quantity
                    WHEN sm.type = 'return'   THEN sm.quantity
                    WHEN sm.type = 'sale'     THEN -sm.quantity
                    WHEN sm.type = 'loss'     THEN -sm.quantity
                    ELSE 0 END), 0) AS balance
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
GROUP BY sm.location_id, sm.product_id, p.name, p.sort_order;

-- ─── Seed: products ───────────────────────────────────────────────────────────

INSERT INTO products (name, sort_order) VALUES
  ('СВ',       1),
  ('СВ+',      2),
  ('СоБ',      3),
  ('СоМ',      4),
  ('СоБ(уп)',  5),
  ('СоМ(уп)',  6),
  ('С1Б',      7),
  ('С1М',      8),
  ('С2Б',      9),
  ('С2М',     10),
  ('Мясо кур',11)
ON CONFLICT (name) DO NOTHING;

-- ─── Seed: initial prices ─────────────────────────────────────────────────────

INSERT INTO product_prices (product_id, price_per_unit)
SELECT id, price FROM (VALUES
  ('СВ',       1.0),
  ('СВ+',      1.1),
  ('СоБ',      0.9),
  ('СоМ',      0.9),
  ('СоБ(уп)',  1.0),
  ('СоМ(уп)',  1.0),
  ('С1Б',      0.8333333),
  ('С1М',      0.8333333),
  ('С2Б',      0.8),
  ('С2М',      0.8),
  ('Мясо кур', 20.0)
) AS v(pname, price)
JOIN products ON products.name = v.pname
ON CONFLICT DO NOTHING;
