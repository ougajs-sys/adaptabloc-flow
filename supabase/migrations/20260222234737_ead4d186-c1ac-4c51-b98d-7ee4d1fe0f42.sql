
-- 1. Create payment_providers table
CREATE TABLE public.payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  api_key text,
  secret_key text,
  fee_percentage numeric(5,2) NOT NULL DEFAULT 0,
  markets text[] NOT NULL DEFAULT '{}',
  supported_methods text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view providers"
  ON public.payment_providers FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmins can manage providers"
  ON public.payment_providers FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Authenticated can view active providers"
  ON public.payment_providers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 2. Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  modules text[] NOT NULL DEFAULT '{}',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  provider text,
  country text,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  renewal_date timestamptz,
  grace_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (is_store_member(store_id));

CREATE POLICY "Superadmins can view all subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmins can manage subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

-- 3. Create transactions table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id),
  gross_amount integer NOT NULL DEFAULT 0,
  net_amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  provider text NOT NULL,
  country text,
  fee_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (is_store_member(store_id));

CREATE POLICY "Superadmins can view all transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmins can manage transactions"
  ON public.transactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

-- 4. Seed default providers (all disabled)
INSERT INTO public.payment_providers (name, display_name, fee_percentage, markets, supported_methods) VALUES
  ('cinetpay', 'CinetPay', 3.00, ARRAY['CI','SN','CM','BF','ML','TG','BJ','GN','NE','CD'], ARRAY['visa','mastercard','orange_money','mtn_money']),
  ('paydunya', 'PayDunya', 2.00, ARRAY['CI','SN','GH','BF','ML','TG','BJ','GN'], ARRAY['visa','mastercard','orange_money','mtn_money','moov_money']),
  ('wave', 'Wave Business', 1.00, ARRAY['CI','SN'], ARRAY['wave']),
  ('paystack', 'Paystack', 1.50, ARRAY['NG','GH','ZA','KE','CI','SN'], ARRAY['visa','mastercard','bank_transfer']);

-- 5. Triggers
CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON public.payment_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Add country to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS country text;

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
