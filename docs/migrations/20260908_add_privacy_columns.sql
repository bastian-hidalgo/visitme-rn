-- Apply this in the Supabase SQL editor for projects created before the privacy flow.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS privacy_consent_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS data_processing_status text NOT NULL DEFAULT 'pending_consent';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_data_processing_status_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_data_processing_status_check
  CHECK (data_processing_status IN ('pending_consent', 'active', 'minimized', 'revoked', 'anonymized'));
