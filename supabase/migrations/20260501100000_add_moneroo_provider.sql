-- Add Moneroo as a payment provider
-- Moneroo (by Chariow) supports mobile money across 15+ African countries
-- Markets: Benin, Ivory Coast, Senegal, Cameroon, Burkina Faso, Togo, Mali, Niger, Guinea,
--          Ghana, Nigeria, Rwanda, Uganda, Tanzania, Kenya
INSERT INTO public.payment_providers (name, display_name, is_active, fee_percentage, markets, supported_methods)
VALUES (
  'moneroo',
  'Moneroo',
  true,
  2.00,
  ARRAY['BJ','CI','SN','CM','BF','TG','ML','NE','GN','GW','GH','NG','RW','UG','TZ','KE','CD'],
  ARRAY['orange_money','mtn_money','moov_money','wave','mobile_money','card']
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_active = EXCLUDED.is_active,
  fee_percentage = EXCLUDED.fee_percentage,
  markets = EXCLUDED.markets,
  supported_methods = EXCLUDED.supported_methods;
