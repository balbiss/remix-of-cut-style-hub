-- Fix check_plan_expiration function search_path
CREATE OR REPLACE FUNCTION public.check_plan_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If plan_expires_at has passed, set status to expired
  IF NEW.plan_expires_at IS NOT NULL AND NEW.plan_expires_at < NOW() THEN
    NEW.plan_status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;