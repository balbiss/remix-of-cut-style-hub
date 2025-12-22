-- Step 1: Clean up orphan user data
DELETE FROM public.users 
WHERE email = 'inoovawebpro@gmail.com' 
AND id NOT IN (SELECT id FROM auth.users);

-- Step 2: Update the handle_user_signup function to handle conflicts
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Create user record linked to tenant (with conflict handling)
  INSERT INTO public.users (id, email, nome, tenant_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    new_tenant_id,
    'admin'
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    nome = EXCLUDED.nome,
    tenant_id = EXCLUDED.tenant_id,
    updated_at = NOW();
  
  -- Assign owner role (with conflict handling)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;