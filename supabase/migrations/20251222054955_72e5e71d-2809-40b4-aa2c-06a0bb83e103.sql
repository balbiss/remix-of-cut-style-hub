-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'owner');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can see their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Function to handle new user signup - creates tenant and user record
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Create tenant
  INSERT INTO public.tenants (nome, plan, plan_status, payment_status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'barbearia_nome', 'Minha Barbearia'),
    'free',
    'inactive',
    'pending'
  )
  RETURNING id INTO new_tenant_id;
  
  -- Create user record linked to tenant
  INSERT INTO public.users (id, email, nome, tenant_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    new_tenant_id,
    'admin'
  );
  
  -- Assign owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup();

-- Function to check if plan is expired and update status
CREATE OR REPLACE FUNCTION public.check_plan_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If plan_expires_at has passed, set status to expired
  IF NEW.plan_expires_at IS NOT NULL AND NEW.plan_expires_at < NOW() THEN
    NEW.plan_status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-expire plans
DROP TRIGGER IF EXISTS check_plan_expiration_trigger ON public.tenants;
CREATE TRIGGER check_plan_expiration_trigger
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.check_plan_expiration();