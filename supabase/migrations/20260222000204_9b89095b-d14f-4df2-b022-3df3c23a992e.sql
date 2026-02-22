
-- =============================================
-- INTRAMATE E-COMMERCE BACKEND
-- =============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'caller', 'preparer', 'driver');
CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'preparing', 'ready', 'shipping', 'delivered', 'returned', 'cancelled');
CREATE TYPE public.delivery_status AS ENUM ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed');
CREATE TYPE public.campaign_type AS ENUM ('sms', 'whatsapp', 'email');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sent', 'cancelled');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.form_status AS ENUM ('active', 'draft', 'archived');

-- 2. STORES
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sector TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- 4. USER_ROLES (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id, role)
);

-- 5. PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0, -- FCFA
  cost_price INTEGER DEFAULT 0,
  sku TEXT,
  stock INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER DEFAULT 5,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PRODUCT_VARIANTS
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Taille L / Rouge"
  sku TEXT,
  price_modifier INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  segment TEXT DEFAULT 'standard',
  loyalty_points INTEGER DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'manual', -- manual, embed_form, import
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'new',
  total_amount INTEGER NOT NULL DEFAULT 0,
  shipping_address TEXT,
  shipping_city TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual', -- manual, embed_form
  created_by UUID REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id),
  prepared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ORDER_ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. DELIVERIES
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id),
  status delivery_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_fee INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type campaign_type NOT NULL DEFAULT 'sms',
  status campaign_status NOT NULL DEFAULT 'draft',
  message_content TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. CAMPAIGN_RECIPIENTS
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, clicked
  sent_at TIMESTAMPTZ,
  UNIQUE(campaign_id, customer_id)
);

-- 13. INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  modules TEXT[] DEFAULT '{}',
  period_start DATE,
  period_end DATE,
  paid_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. EMBED_FORMS
CREATE TABLE public.embed_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status form_status NOT NULL DEFAULT 'draft',
  fields JSONB NOT NULL DEFAULT '[]',
  style JSONB NOT NULL DEFAULT '{}',
  submissions_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_store_id ON public.profiles(store_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_store_id ON public.user_roles(store_id);
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_customers_store_id ON public.customers(store_id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_deliveries_store_id ON public.deliveries(store_id);
CREATE INDEX idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX idx_campaigns_store_id ON public.campaigns(store_id);
CREATE INDEX idx_embed_forms_store_id ON public.embed_forms(store_id);
CREATE INDEX idx_invoices_store_id ON public.invoices(store_id);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Get store IDs where user is a member
CREATE OR REPLACE FUNCTION public.get_user_store_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.user_roles WHERE user_id = auth.uid()
$$;

-- Check if user has a specific role in a store
CREATE OR REPLACE FUNCTION public.has_role(_store_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND store_id = _store_id
      AND role = _role
  )
$$;

-- Check if user is a member of a store (any role)
CREATE OR REPLACE FUNCTION public.is_store_member(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND store_id = _store_id
  )
$$;

-- Check if user is the store owner
CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id
      AND owner_id = auth.uid()
  )
$$;

-- =============================================
-- TRIGGERS: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER tr_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_embed_forms_updated_at BEFORE UPDATE ON public.embed_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE + ROLE ON STORE CREATION
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for the store owner
  INSERT INTO public.profiles (user_id, store_id, name, email)
  SELECT 
    NEW.owner_id,
    NEW.id,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
    email
  FROM auth.users WHERE id = NEW.owner_id;
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, store_id, role)
  VALUES (NEW.owner_id, NEW.id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_new_store_setup
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_store();

-- =============================================
-- RLS POLICIES
-- =============================================

-- STORES
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their stores" ON public.stores FOR SELECT USING (public.is_store_member(id));
CREATE POLICY "Users can create stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their stores" ON public.stores FOR UPDATE USING (public.is_store_owner(id));

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view profiles" ON public.profiles FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid() AND public.is_store_member(store_id));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(store_id, 'admin'));

-- USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view roles" ON public.user_roles FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(store_id, 'admin'));

-- PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view products" ON public.products FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Admins can manage products" ON public.products FOR INSERT WITH CHECK (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.has_role(store_id, 'admin'));

-- PRODUCT_VARIANTS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view variants" ON public.product_variants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.is_store_member(p.store_id))
);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_role(p.store_id, 'admin'))
);
CREATE POLICY "Admins can update variants" ON public.product_variants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_role(p.store_id, 'admin'))
);
CREATE POLICY "Admins can delete variants" ON public.product_variants FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_role(p.store_id, 'admin'))
);

-- CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view customers" ON public.customers FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Members can create customers" ON public.customers FOR INSERT WITH CHECK (public.is_store_member(store_id));
CREATE POLICY "Members can update customers" ON public.customers FOR UPDATE USING (public.is_store_member(store_id));
CREATE POLICY "Admins can delete customers" ON public.customers FOR DELETE USING (public.has_role(store_id, 'admin'));

-- ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view orders" ON public.orders FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Members can create orders" ON public.orders FOR INSERT WITH CHECK (public.is_store_member(store_id));
CREATE POLICY "Members can update orders" ON public.orders FOR UPDATE USING (public.is_store_member(store_id));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.has_role(store_id, 'admin'));

-- ORDER_ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_store_member(o.store_id))
);
CREATE POLICY "Members can manage order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_store_member(o.store_id))
);
CREATE POLICY "Members can update order items" ON public.order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_store_member(o.store_id))
);
CREATE POLICY "Members can delete order items" ON public.order_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_store_member(o.store_id))
);

-- DELIVERIES
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view deliveries" ON public.deliveries FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Members can create deliveries" ON public.deliveries FOR INSERT WITH CHECK (public.is_store_member(store_id));
CREATE POLICY "Members can update deliveries" ON public.deliveries FOR UPDATE USING (public.is_store_member(store_id));
CREATE POLICY "Admins can delete deliveries" ON public.deliveries FOR DELETE USING (public.has_role(store_id, 'admin'));

-- CAMPAIGNS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view campaigns" ON public.campaigns FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR INSERT WITH CHECK (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can update campaigns" ON public.campaigns FOR UPDATE USING (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can delete campaigns" ON public.campaigns FOR DELETE USING (public.has_role(store_id, 'admin'));

-- CAMPAIGN_RECIPIENTS
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view recipients" ON public.campaign_recipients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.is_store_member(c.store_id))
);
CREATE POLICY "Admins can manage recipients" ON public.campaign_recipients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.has_role(c.store_id, 'admin'))
);
CREATE POLICY "Admins can delete recipients" ON public.campaign_recipients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.has_role(c.store_id, 'admin'))
);

-- INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view invoices" ON public.invoices FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR INSERT WITH CHECK (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can update invoices" ON public.invoices FOR UPDATE USING (public.has_role(store_id, 'admin'));

-- EMBED_FORMS
ALTER TABLE public.embed_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view forms" ON public.embed_forms FOR SELECT USING (public.is_store_member(store_id));
CREATE POLICY "Admins can manage forms" ON public.embed_forms FOR INSERT WITH CHECK (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can update forms" ON public.embed_forms FOR UPDATE USING (public.has_role(store_id, 'admin'));
CREATE POLICY "Admins can delete forms" ON public.embed_forms FOR DELETE USING (public.has_role(store_id, 'admin'));

-- =============================================
-- STORAGE BUCKET for product images
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Store admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Store admins can update product images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Store admins can delete product images" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND auth.uid() IS NOT NULL
);
