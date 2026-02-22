
-- Add missing order pipeline statuses
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'caller_pending' AFTER 'new';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'in_transit' AFTER 'ready';
