-- ============================================================
-- POSWeb — Políticas de seguridad Row Level Security (RLS)
-- Ejecutar en Supabase SQL Editor DESPUÉS del schema.sql
-- ============================================================

-- ── Activar RLS en todas las tablas ─────────────────────────
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_aliases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items    ENABLE ROW LEVEL SECURITY;

-- ── Eliminar políticas previas (idempotente) ─────────────────
DROP POLICY IF EXISTS "Lectura pública de productos"      ON products;
DROP POLICY IF EXISTS "Usuarios autenticados modifican"   ON products;
DROP POLICY IF EXISTS "Lectura pública de aliases"        ON product_aliases;
DROP POLICY IF EXISTS "Usuarios autenticados aliases"     ON product_aliases;
DROP POLICY IF EXISTS "Insertar ventas autenticado"       ON sales;
DROP POLICY IF EXISTS "Leer ventas autenticado"           ON sales;
DROP POLICY IF EXISTS "Insertar líneas autenticado"       ON sale_items;
DROP POLICY IF EXISTS "Leer líneas autenticado"           ON sale_items;
DROP POLICY IF EXISTS "Gestión compras autenticado"       ON purchases;
DROP POLICY IF EXISTS "Gestión purchase_items autenticado" ON purchase_items;

-- ────────────────────────────────────────────────────────────
-- PRODUCTS: lectura pública (catálogo visible para cajero)
--           escritura solo autenticados
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Lectura pública de productos"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados modifican productos"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- PRODUCT_ALIASES: igual que products
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Lectura pública de aliases"
  ON product_aliases FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados gestionan aliases"
  ON product_aliases FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- SALES & SALE_ITEMS: solo autenticados
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Insertar ventas autenticado"
  ON sales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Leer ventas autenticado"
  ON sales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Insertar líneas de venta autenticado"
  ON sale_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Leer líneas de venta autenticado"
  ON sale_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- PURCHASES & PURCHASE_ITEMS: solo autenticados
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Gestión de compras autenticado"
  ON purchases FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Gestión de purchase_items autenticado"
  ON purchase_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- FUNCIÓN AUXILIAR: validar que solo el dueño modifica su dato
-- (preparado para multi-tenant futuro)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS uuid AS $$
  SELECT auth.uid()
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────
-- PROTECCIÓN: evitar manipulación directa de stock negativo
-- ────────────────────────────────────────────────────────────
ALTER TABLE products ADD CONSTRAINT stock_no_negativo
  CHECK (stock >= 0);

ALTER TABLE products ADD CONSTRAINT precio_positivo
  CHECK (sale_price >= 0 AND cost_price >= 0);

ALTER TABLE sale_items ADD CONSTRAINT cantidad_positiva
  CHECK (quantity > 0);

ALTER TABLE purchase_items ADD CONSTRAINT cantidad_compra_positiva
  CHECK (quantity > 0);

-- ────────────────────────────────────────────────────────────
-- RATE LIMITING: tabla para registrar intentos de auth
-- (Supabase Auth tiene rate limiting integrado, esto es extra)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_rate_limit (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash    text NOT NULL,        -- IP hasheada, no en texto plano
  action     text NOT NULL,        -- 'login' | 'signup'
  created_at timestamptz DEFAULT now()
);

-- Auto-limpiar registros de más de 1 hora
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_time
  ON auth_rate_limit(ip_hash, created_at DESC);

-- Solo el sistema puede insertar/leer (service_role)
ALTER TABLE auth_rate_limit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo servicio accede rate limit"
  ON auth_rate_limit FOR ALL
  USING (false); -- Bloquear acceso desde anon/authenticated
