-- Add validation_code column to loyalty_redemptions table
ALTER TABLE public.loyalty_redemptions 
ADD COLUMN IF NOT EXISTS validation_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups by validation code
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_validation_code 
ON public.loyalty_redemptions(validation_code) 
WHERE validation_code IS NOT NULL;

-- Create index for pending redemptions
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_pending 
ON public.loyalty_redemptions(tenant_id, status) 
WHERE status = 'pending';


