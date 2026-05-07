-- =============================================
-- GEO TRACKING MODULE
-- Real-time driver location sharing + delivery-path recording.
-- Drivers update their GPS position via the workspace; admins
-- view a live map of all active drivers and pending deliveries.
-- =============================================

-- ── 1. Driver locations (one live row per driver) ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.driver_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  driver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  accuracy_m   REAL,                        -- GPS accuracy in metres
  speed_kmh    REAL,                        -- speed if provided by browser
  heading_deg  REAL,                        -- direction 0-360
  is_on_duty   BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, driver_id)              -- upsert key: one row per driver
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_store
  ON public.driver_locations(store_id, is_on_duty);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can upsert their own row; admins can read all
CREATE POLICY "Drivers update own location"
  ON public.driver_locations FOR ALL
  USING (driver_id = auth.uid() OR public.has_role(store_id, 'admin'))
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins read all locations"
  ON public.driver_locations FOR SELECT
  USING (public.has_role(store_id, 'admin'));

-- ── 2. Delivery path recording (optional; one row per GPS ping) ───────────────

CREATE TABLE IF NOT EXISTS public.delivery_path_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_path_points_order
  ON public.delivery_path_points(order_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_path_points_store
  ON public.delivery_path_points(store_id);

ALTER TABLE public.delivery_path_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers insert own path points"
  ON public.delivery_path_points FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Store admins read path points"
  ON public.delivery_path_points FOR SELECT
  USING (public.has_role(store_id, 'admin'));

-- ── 3. RPC: upsert driver location (called from driver workspace) ─────────────

CREATE OR REPLACE FUNCTION public.upsert_driver_location(
  p_store_id   UUID,
  p_lat        DOUBLE PRECISION,
  p_lng        DOUBLE PRECISION,
  p_accuracy   REAL DEFAULT NULL,
  p_speed      REAL DEFAULT NULL,
  p_heading    REAL DEFAULT NULL,
  p_on_duty    BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a driver (or admin) of this store
  IF NOT (public.has_role(p_store_id, 'driver') OR public.has_role(p_store_id, 'admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.driver_locations
    (store_id, driver_id, latitude, longitude, accuracy_m, speed_kmh, heading_deg, is_on_duty, updated_at)
  VALUES
    (p_store_id, auth.uid(), p_lat, p_lng, p_accuracy, p_speed, p_heading, p_on_duty, now())
  ON CONFLICT (store_id, driver_id) DO UPDATE
    SET latitude    = EXCLUDED.latitude,
        longitude   = EXCLUDED.longitude,
        accuracy_m  = EXCLUDED.accuracy_m,
        speed_kmh   = EXCLUDED.speed_kmh,
        heading_deg = EXCLUDED.heading_deg,
        is_on_duty  = EXCLUDED.is_on_duty,
        updated_at  = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_driver_location TO authenticated;
