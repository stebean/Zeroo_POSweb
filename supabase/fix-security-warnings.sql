-- ============================================================
-- Fix: advertencias de seguridad del linter de Supabase
-- Ejecutar en SQL Editor
-- ============================================================

-- ── 1. search_path fijo en todas las funciones ───────────────
-- Previene ataques de search_path hijacking

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER                  -- cambiamos a INVOKER: corre con permisos del usuario llamante
SET search_path = public, pg_temp -- search_path fijo
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_product_id
    AND owner_id = auth.uid();  -- solo el dueño puede descontar su stock
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid()
$$;

-- ── 2. Revocar ejecución anónima de decrement_stock ──────────
-- Solo usuarios autenticados deben poder llamar esta función
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated;

-- ── 3. Leaked password protection ────────────────────────────
-- Este warning se resuelve en el dashboard de Supabase:
-- Authentication → Configuration → Password Security
-- Activa "Enable leaked password protection (HaveIBeenPwned)"
-- No se puede configurar por SQL.
