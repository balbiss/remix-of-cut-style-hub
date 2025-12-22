-- Create loyalty_config table (tenant configuration for loyalty program)
CREATE TABLE public.loyalty_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  points_type VARCHAR NOT NULL DEFAULT 'visit' CHECK (points_type IN ('visit', 'amount')),
  points_per_visit INTEGER NOT NULL DEFAULT 10,
  points_per_real NUMERIC(10,2) NOT NULL DEFAULT 1,
  min_amount_for_points NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Create loyalty_rewards table (configurable rewards)
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  points_required INTEGER NOT NULL DEFAULT 100,
  reward_type VARCHAR NOT NULL DEFAULT 'discount' CHECK (reward_type IN ('service', 'discount', 'custom')),
  reward_value NUMERIC(10,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create loyalty_redemptions table (redemption history)
CREATE TABLE public.loyalty_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add total_earned and total_redeemed columns to loyalty_points
ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS total_earned INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_redeemed INTEGER NOT NULL DEFAULT 0;

-- Enable RLS for new tables
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_config (tenant-based access)
CREATE POLICY "Allow all on loyalty_config" ON public.loyalty_config
FOR ALL USING (true);

-- RLS Policies for loyalty_rewards
CREATE POLICY "Allow all on loyalty_rewards" ON public.loyalty_rewards
FOR ALL USING (true);

-- RLS Policies for loyalty_redemptions
CREATE POLICY "Allow all on loyalty_redemptions" ON public.loyalty_redemptions
FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_loyalty_config_tenant ON public.loyalty_config(tenant_id);
CREATE INDEX idx_loyalty_rewards_tenant ON public.loyalty_rewards(tenant_id);
CREATE INDEX idx_loyalty_rewards_active ON public.loyalty_rewards(tenant_id, active);
CREATE INDEX idx_loyalty_redemptions_tenant ON public.loyalty_redemptions(tenant_id);
CREATE INDEX idx_loyalty_redemptions_client ON public.loyalty_redemptions(client_id);
CREATE INDEX idx_loyalty_points_tenant_phone ON public.loyalty_points(tenant_id, cliente_zap);

-- Update triggers for updated_at
CREATE TRIGGER update_loyalty_config_updated_at
BEFORE UPDATE ON public.loyalty_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at
BEFORE UPDATE ON public.loyalty_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_redemptions_updated_at
BEFORE UPDATE ON public.loyalty_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();