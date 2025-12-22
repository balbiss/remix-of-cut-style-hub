-- Update handle_user_signup to skip tenant creation for barbers
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- If this is a barber being created by admin, skip tenant creation
  -- Barbers are identified by 'is_barber' metadata set in the edge function
  IF NEW.raw_user_meta_data->>'is_barber' = 'true' THEN
    RETURN NEW;
  END IF;

  -- Create tenant for barbershop owners (normal signup)
  INSERT INTO public.tenants (nome, slug, plan, plan_status, payment_status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'barbearia_nome', 'Minha Barbearia'),
    lower(replace(COALESCE(NEW.raw_user_meta_data->>'barbearia_nome', 'minha-barbearia'), ' ', '-')) || '-' || substr(gen_random_uuid()::text, 1, 8),
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
$function$;