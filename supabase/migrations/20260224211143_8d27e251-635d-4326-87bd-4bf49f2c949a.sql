
-- Create ticket status and priority enums
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high');

-- Support tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  assigned_to uuid DEFAULT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ticket comments table
CREATE TABLE public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Store members can view their own tickets
CREATE POLICY "Store members can view own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (is_store_member(store_id));

-- RLS: Store admins can create tickets
CREATE POLICY "Store members can create tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (is_store_member(store_id));

-- RLS: Superadmins can view all tickets
CREATE POLICY "Superadmins can view all tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- RLS: Superadmins can update any ticket
CREATE POLICY "Superadmins can update tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.is_superadmin());

-- RLS: Comments - store members can view on their tickets
CREATE POLICY "Members can view ticket comments"
ON public.ticket_comments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.support_tickets t
  WHERE t.id = ticket_comments.ticket_id
  AND (is_store_member(t.store_id) OR public.is_superadmin())
) AND (is_internal = false OR public.is_superadmin()));

-- RLS: Anyone involved can add comments
CREATE POLICY "Members can add comments"
ON public.ticket_comments FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.support_tickets t
  WHERE t.id = ticket_comments.ticket_id
  AND (is_store_member(t.store_id) OR public.is_superadmin())
));
