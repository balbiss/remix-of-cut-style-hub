-- Add columns for confirmation code and payment tracking
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(4),
ADD COLUMN IF NOT EXISTS prepaid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tolerance_expires_at TIMESTAMPTZ;