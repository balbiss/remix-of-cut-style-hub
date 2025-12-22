import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scissors, DollarSign, TrendingUp, CheckCircle, Calendar, User, Clock, Shield } from 'lucide-react';
import { BarberLayout } from './Layout';
import { ValidateCodeDialog } from '@/components/barber/ValidateCodeDialog';

interface Appointment {
  id: string;
  cliente_nome: string;
  cliente_zap: string;
  data_hora: string;
  status: string;
  observacoes: string | null;
  confirmation_code: string | null;
  prepaid_amount: number | null;
  payment_method: string | null;
  tolerance_expires_at: string | null;
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
  const { user } = useAuth();
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
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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
        confirmation_code,
        prepaid_amount,
        payment_method,
        tolerance_expires_at,
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
      confirmation_code: apt.confirmation_code,
      prepaid_amount: apt.prepaid_amount,
      payment_method: apt.payment_method,
      tolerance_expires_at: apt.tolerance_expires_at,
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
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Realizado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Cancelado</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Confirmado</Badge>;
      case 'waiting':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Aguardando</Badge>;
      case 'no_show':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Não compareceu</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Pendente</Badge>;
    }
  };

  const openValidateDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setValidateDialogOpen(true);
  };

  const handleValidationSuccess = () => {
    fetchTodayAppointments();
    fetchStats();
  };

  const statsData = [
    {
      label: 'Hoje',
      cuts: stats.todayCuts,
      earnings: stats.todayEarnings,
      icon: Calendar,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
    {
      label: 'Semana',
      cuts: stats.weekCuts,
      earnings: stats.weekEarnings,
      icon: Scissors,
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Mês',
      cuts: stats.monthCuts,
      earnings: stats.monthEarnings,
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <BarberLayout professionalName={professionalName}>
      <div className="space-y-4">
        {/* Commission Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Comissão: {commissionPercent}%
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {statsData.map((stat) => (
            <Card key={stat.label} className={`relative overflow-hidden border-border/50 bg-gradient-to-br ${stat.gradient}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {stat.label}
                  </span>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-bold leading-none">{stat.cuts}</p>
                  <p className="text-[10px] text-muted-foreground">cortes</p>
                </div>
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-sm font-semibold text-primary">
                    R$ {stat.earnings.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Appointments */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Agendamentos de Hoje</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {todayAppointments.length}
              </Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    {/* Time */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className="text-sm font-bold text-primary">
                        {format(new Date(apt.data_hora), 'HH:mm')}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-border/50" />

                    {/* Client & Service */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{apt.cliente_nome}</span>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {apt.service?.nome} • <span className="text-primary font-medium">R$ {apt.service?.preco?.toFixed(2)}</span>
                      </p>
                    </div>

                    {/* Action */}
                    {apt.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => markAsCompleted(apt.id)}
                        className="flex-shrink-0 h-8 px-3 gap-1.5 text-xs"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Concluir
                      </Button>
                    )}
                    
                    {/* Validate Code Button - Only for confirmed online payments */}
                    {apt.status === 'confirmed' && apt.confirmation_code && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openValidateDialog(apt)}
                        className="flex-shrink-0 h-8 px-3 gap-1.5 text-xs border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Validar
                      </Button>
                    )}
                    
                    {/* Handle waiting status */}
                    {apt.status === 'waiting' && (
                      <Button
                        size="sm"
                        onClick={() => markAsCompleted(apt.id)}
                        className="flex-shrink-0 h-8 px-3 gap-1.5 text-xs"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Atender
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validate Code Dialog */}
        <ValidateCodeDialog
          open={validateDialogOpen}
          onOpenChange={setValidateDialogOpen}
          appointment={selectedAppointment}
          onSuccess={handleValidationSuccess}
        />
      </div>
    </BarberLayout>
  );
}