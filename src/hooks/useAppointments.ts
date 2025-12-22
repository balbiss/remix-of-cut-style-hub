import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface Appointment {
  id: string;
  tenant_id: string;
  professional_id: string;
  service_id: string;
  data_hora: string;
  cliente_nome: string;
  cliente_zap: string;
  observacoes: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  professional?: {
    id: string;
    nome: string;
  };
  service?: {
    id: string;
    nome: string;
    preco: number;
    duracao: number;
  };
}

interface UseAppointmentsOptions {
  date?: Date;
}

export function useAppointments(options?: UseAppointmentsOptions) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenant } = useAuth();

  const fetchAppointments = async () => {
    if (!tenant?.id) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          professional:professionals(id, nome),
          service:services(id, nome, preco, duracao)
        `)
        .eq('tenant_id', tenant.id)
        .order('data_hora');

      if (options?.date) {
        const start = format(startOfDay(options.date), "yyyy-MM-dd'T'HH:mm:ss");
        const end = format(endOfDay(options.date), "yyyy-MM-dd'T'HH:mm:ss");
        query = query.gte('data_hora', start).lte('data_hora', end);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: Appointment[] = (data || []).map((a) => ({
        id: a.id,
        tenant_id: a.tenant_id,
        professional_id: a.professional_id,
        service_id: a.service_id,
        data_hora: a.data_hora,
        cliente_nome: a.cliente_nome,
        cliente_zap: a.cliente_zap,
        observacoes: a.observacoes,
        status: (a.status || 'pending') as Appointment['status'],
        professional: a.professional as Appointment['professional'],
        service: a.service ? {
          ...a.service,
          preco: Number(a.service.preco)
        } : undefined,
      }));

      setAppointments(mapped);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [tenant?.id, options?.date?.toDateString()]);

  const addAppointment = async (data: {
    professional_id: string;
    service_id: string;
    data_hora: string;
    cliente_nome: string;
    cliente_zap: string;
    observacoes?: string;
    status: 'pending' | 'confirmed';
  }) => {
    if (!tenant?.id) return null;

    try {
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert({
          tenant_id: tenant.id,
          professional_id: data.professional_id,
          service_id: data.service_id,
          data_hora: data.data_hora,
          cliente_nome: data.cliente_nome,
          cliente_zap: data.cliente_zap,
          observacoes: data.observacoes,
          status: data.status,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAppointments();
      return newAppointment;
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast.error('Erro ao criar agendamento');
      return null;
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      await fetchAppointments();
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento');
      return false;
    }
  };

  return {
    appointments,
    loading,
    refetch: fetchAppointments,
    addAppointment,
    updateAppointmentStatus,
  };
}
