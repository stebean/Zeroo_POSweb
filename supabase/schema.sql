-- ============================================================
-- POSWeb — Schema de base de datos para Supabase
-- Ejecutar en el SQL Editor de tu proyecto de Supabase
-- ============================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Productos del catálogo ──────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  internal_key  text,
  description   text,
  cost_price    numeric(10,2) DEFAULT 0,
  sale_price    numeric(10,2) DEFAULT 0,
  stock         integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── Aliases de proveedor (para matching semántico) ──────────
CREATE TABLE IF NOT EXISTS product_aliases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  alias       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── Ventas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total       numeric(10,2),
  created_at  timestamptz DEFAULT now()
);

-- ── Líneas de venta ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id),
  quantity    integer,
  unit_price  numeric(10,2),
  subtotal    numeric(10,2)
);

-- ── Compras / ingresos de inventario ────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_url     text,
  ai_raw_extraction jsonb,
  status           text DEFAULT 'pending',
  created_at       timestamptz DEFAULT now()
);

-- ── Líneas de compra ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id  uuid REFERENCES purchases(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES products(id),
  raw_name     text,
  quantity     integer,
  unit_cost    numeric(10,2),
  is_new_product boolean DEFAULT false
);

-- ── Función para descontar stock ─────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- ── Índices de rendimiento ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_key ON products(internal_key);
CREATE INDEX IF NOT EXISTS idx_aliases_product ON product_aliases(product_id);
CREATE INDEX IF NOT EXISTS idx_aliases_alias ON product_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);

-- ── Trigger: actualizar updated_at automáticamente ──────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS: deshabilitar para el concurso (sin auth) ────────────
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_aliases DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items DISABLE ROW LEVEL SECURITY;

-- ── Datos de ejemplo (productos iniciales) ───────────────────
INSERT INTO products (name, internal_key, cost_price, sale_price, stock, low_stock_threshold) VALUES
  ('Leche Entera 1L',        'LEC-ENT-1LT', 18.50, 24.00, 48, 10),
  ('Refresco Cola 600ml',    'REF-COL-600',  11.00, 16.00, 72, 12),
  ('Aceite Vegetal 1L',      'ACE-VEG-1LT',  35.00, 48.00,  3,  5),
  ('Arroz Extra 1kg',        'ARR-EXT-1KG',  22.00, 30.00, 25,  8),
  ('Jabón de Barra 150g',    'JAB-BAR-150',   8.50, 13.00,  0,  5),
  ('Papel Higiénico 4R',     'PAP-HIG-4R',   28.00, 38.00, 15,  6),
  ('Azúcar Refinada 1kg',    'AZU-REF-1KG',  19.00, 26.00, 18,  5),
  ('Detergente Líquido 500ml','DET-LIQ-500', 30.00, 42.00,  2,  5)
ON CONFLICT DO NOTHING;
