-- Allow public access to read connection status and tokens for WhatsApp notifications
-- This is required because the booking flow is public (anonymous users)
CREATE POLICY "Allow public select on connections" ON public.connections
FOR SELECT
TO anon
USING (status = 'online');

-- Also allow public select on tenants if not already allowed (some frontend parts need it)
-- Note: tenants usually has its own policy, but ensuring it's accessible for public bookings
-- CREATE POLICY "Allow public select on tenants" ON public.tenants FOR SELECT TO anon USING (true);
