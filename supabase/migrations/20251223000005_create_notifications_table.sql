-- ============================================================
-- Criar tabela de notificações para o painel admin
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('payment_confirmed', 'appointment_cancelled', 'refund_processed', 'payment_expired')),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (tenant-based access)
-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Users can view own tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own tenant notifications" ON public.notifications;

-- Criar policies
CREATE POLICY "Users can view own tenant notifications" ON public.notifications
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own tenant notifications" ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own tenant notifications" ON public.notifications
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete own tenant notifications" ON public.notifications
FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(tenant_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON public.notifications(appointment_id);

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

