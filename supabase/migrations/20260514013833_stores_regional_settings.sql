-- Add regional settings columns to stores table
-- These allow saving currency, timezone and language preferences per store.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Africa/Abidjan',
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr';
