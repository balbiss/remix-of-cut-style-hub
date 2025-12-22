import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BusinessHour {
  id: string;
  tenant_id: string;
  day_of_week: number;
  is_open: boolean;
  periods: { start: string; end: string }[] | null;
}

export function useBusinessHours() {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenant } = useAuth();

  const fetchBusinessHours = async () => {
    if (!tenant?.id) {
      setBusinessHours([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('day_of_week');

      if (error) throw error;

      const mapped: BusinessHour[] = (data || []).map((bh) => ({
        id: bh.id,
        tenant_id: bh.tenant_id,
        day_of_week: bh.day_of_week,
        is_open: bh.is_open ?? false,
        periods: bh.periods as BusinessHour['periods'],
      }));

      setBusinessHours(mapped);
    } catch (error) {
      console.error('Error fetching business hours:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessHours();
  }, [tenant?.id]);

  // Check if at least one day has business hours configured
  const hasBusinessHoursConfigured = businessHours.some(
    (bh) => bh.is_open && bh.periods && bh.periods.length > 0
  );

  return {
    businessHours,
    loading,
    hasBusinessHoursConfigured,
    refetch: fetchBusinessHours,
  };
}
