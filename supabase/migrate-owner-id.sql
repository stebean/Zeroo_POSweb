-- ============================================================
-- Migración: aislamiento por usuario (multi-tenant)
-- Cada cuenta de Google tiene su propio inventario y ventas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. Agregar owner_id a las tablas principales ─────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 2. Eliminar políticas anteriores de products ──────────────
DROP POLICY IF EXISTS "Lectura pública de productos"            ON products;
DROP POLICY IF EXISTS "Usuarios autenticados modifican productos" ON products;
DROP POLICY IF EXISTS "Lectura pública de aliases"              ON product_aliases;
DROP POLICY IF EXISTS "Usuarios autenticados gestionan aliases" ON product_aliases;
DROP POLICY IF EXISTS "Insertar ventas autenticado"             ON sales;
DROP POLICY IF EXISTS "Leer ventas autenticado"                 ON sales;
DROP POLICY IF EXISTS "Insertar líneas de venta autenticado"    ON sale_items;
DROP POLICY IF EXISTS "Leer líneas de venta autenticado"        ON sale_items;
DROP POLICY IF EXISTS "Gestión de compras autenticado"          ON purchases;
DROP POLICY IF EXISTS "Gestión de purchase_items autenticado"   ON purchase_items;

-- ── 3. Nuevas políticas: cada usuario solo ve sus datos ───────

-- PRODUCTS: solo el dueño ve y modifica sus productos
CREATE POLICY "Ver propios productos"
  ON products FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Gestionar propios productos"
  ON products FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- PRODUCT_ALIASES: accesibles a través del producto dueño
CREATE POLICY "Ver aliases de propios productos"
  ON product_aliases FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Gestionar aliases de propios productos"
  ON product_aliases FOR ALL
  USING (
    product_id IN (
      SELECT id FROM products WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE owner_id = auth.uid()
    )
  );

-- SALES: solo el dueño ve sus ventas
CREATE POLICY "Ver propias ventas"
  ON sales FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Registrar propias ventas"
  ON sales FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- SALE_ITEMS: accesibles a través de la venta dueña
CREATE POLICY "Ver líneas de propias ventas"
  ON sale_items FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Registrar líneas de propias ventas"
  ON sale_items FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE owner_id = auth.uid()
    )
  );

-- PURCHASES: solo el dueño ve sus compras
CREATE POLICY "Ver propias compras"
  ON purchases FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Gestionar propias compras"
  ON purchases FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- PURCHASE_ITEMS: accesibles a través de la compra dueña
CREATE POLICY "Ver items de propias compras"
  ON purchase_items FOR SELECT
  USING (
    purchase_id IN (
      SELECT id FROM purchases WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Registrar items de propias compras"
  ON purchase_items FOR INSERT
  WITH CHECK (
    purchase_id IN (
      SELECT id FROM purchases WHERE owner_id = auth.uid()
    )
  );

-- ── 4. Actualizar función decrement_stock: solo el dueño ──────
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_product_id
    AND owner_id = auth.uid(); -- protección extra
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Limpiar datos de ejemplo sin owner (ya no aplican) ─────
-- Los datos de ejemplo del schema.sql quedarán invisibles porque
-- no tienen owner_id asignado. Los usuarios crearán los suyos
-- mediante el flujo normal o importando comprobantes.
-- Si quieres limpiarlos:
-- DELETE FROM products WHERE owner_id IS NULL;
