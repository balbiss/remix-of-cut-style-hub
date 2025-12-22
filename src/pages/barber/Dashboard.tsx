import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scissors, DollarSign, Clock, CheckCircle, LogOut, Calendar } from 'lucide-react';
import { BarberLayout } from './Layout';

interface Appointment {
  id: string;
  cliente_nome: string;
  cliente_zap: string;
  data_hora: string;
  status: string;
  observacoes: string | null;
  service: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

interface Stats {
  todayCuts: number;
  todayEarnings: number;
  weekCuts: number;
  weekEarnings: number;
  monthCuts: number;
  monthEarnings: number;
}

export default function BarberDashboard() {
  const { user, signOut } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState<string>('');
  const [commissionPercent, setCommissionPercent] = useState<number>(50);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayCuts: 0,
    todayEarnings: 0,
    weekCuts: 0,
    weekEarnings: 0,
    monthCuts: 0,
    monthEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfessionalData();
  }, [user]);

  useEffect(() => {
    if (professionalId) {
      fetchTodayAppointments();
      fetchStats();
    }
  }, [professionalId]);

  const fetchProfessionalData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('professionals')
      .select('id, nome, commission_percent')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching professional:', error);
      toast.error('Erro ao carregar dados do profissional');
      return;
    }

    if (data) {
      setProfessionalId(data.id);
      setProfessionalName(data.nome);
      setCommissionPercent(data.commission_percent || 50);
    }
  };

  const fetchTodayAppointments = async () => {
    if (!professionalId) return;

    const today = new Date();
    const start = startOfDay(today).toISOString();
    const end = endOfDay(today).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        cliente_nome,
        cliente_zap,
        data_hora,
        status,
        observacoes,
        services:service_id (
          nome,
          preco,
          duracao
        )
      `)
      .eq('professional_id', professionalId)
      .gte('data_hora', start)
      .lte('data_hora', end)
      .order('data_hora');

    if (error) {
      console.error('Error fetching appointments:', error);
      return;
    }

    const mapped = (data || []).map((apt: any) => ({
      id: apt.id,
      cliente_nome: apt.cliente_nome,
      cliente_zap: apt.cliente_zap,
      data_hora: apt.data_hora,
      status: apt.status,
      observacoes: apt.observacoes,
      service: apt.services,
    }));

    setTodayAppointments(mapped);
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!professionalId) return;

    const today = new Date();
    const dayStart = startOfDay(today).toISOString();
    const dayEnd = endOfDay(today).toISOString();
    const weekStart = startOfWeek(today, { locale: ptBR }).toISOString();
    const weekEnd = endOfWeek(today, { locale: ptBR }).toISOString();
    const monthStart = startOfMonth(today).toISOString();
    const monthEnd = endOfMonth(today).toISOString();

    // Fetch completed appointments for stats
    const { data: completed } = await supabase
      .from('appointments')
      .select(`
        data_hora,
        services:service_id (preco)
      `)
      .eq('professional_id', professionalId)
      .eq('status', 'completed')
      .gte('data_hora', monthStart)
      .lte('data_hora', monthEnd);

    if (completed) {
      let todayCuts = 0, todayEarnings = 0;
      let weekCuts = 0, weekEarnings = 0;
      let monthCuts = 0, monthEarnings = 0;

      completed.forEach((apt: any) => {
        const date = apt.data_hora;
        const earnings = ((apt.services?.preco || 0) * commissionPercent) / 100;

        if (date >= dayStart && date <= dayEnd) {
          todayCuts++;
          todayEarnings += earnings;
        }
        if (date >= weekStart && date <= weekEnd) {
          weekCuts++;
          weekEarnings += earnings;
        }
        monthCuts++;
        monthEarnings += earnings;
      });

      setStats({
        todayCuts,
        todayEarnings,
        weekCuts,
        weekEarnings,
        monthCuts,
        monthEarnings,
      });
    }
  };

  const markAsCompleted = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId);

    if (error) {
      toast.error('Erro ao marcar como realizado');
      return;
    }

    toast.success('Serviço marcado como realizado!');
    fetchTodayAppointments();
    fetchStats();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Realizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <BarberLayout professionalName={professionalName}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCuts} cortes</div>
              <p className="text-xs text-muted-foreground">
                R$ {stats.todayEarnings.toFixed(2)} em comissão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekCuts} cortes</div>
              <p className="text-xs text-muted-foreground">
                R$ {stats.weekEarnings.toFixed(2)} em comissão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthCuts} cortes</div>
              <p className="text-xs text-muted-foreground">
                R$ {stats.monthEarnings.toFixed(2)} em comissão
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agendamentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : todayAppointments.length === 0 ? (
              <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {format(new Date(apt.data_hora), 'HH:mm', { locale: ptBR })}
                        </span>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {apt.cliente_nome}
                      </p>
                      <p className="text-sm font-medium">
                        {apt.service?.nome} - R$ {apt.service?.preco?.toFixed(2)}
                      </p>
                    </div>
                    
                    {apt.status === 'pending' && (
                      <Button
                        onClick={() => markAsCompleted(apt.id)}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marcar Realizado
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sua Comissão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você recebe <span className="font-bold text-primary">{commissionPercent}%</span> do valor de cada serviço realizado.
            </p>
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
}
