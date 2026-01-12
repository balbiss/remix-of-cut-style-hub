import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scissors, DollarSign, TrendingUp, CheckCircle, Calendar, User, Clock, Shield, Filter, X, Gift } from 'lucide-react';
import { BarberLayout } from './Layout';
import { ValidateCodeDialog } from '@/components/barber/ValidateCodeDialog';
import { awardPointsOnAppointmentCompletion } from '@/lib/loyalty-points';
import { ValidateRedemptionDialog } from '@/components/barber/ValidateRedemptionDialog';

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
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<any | null>(null);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchProfessionalData();
  }, [user]);

  useEffect(() => {
    if (professionalId) {
      fetchTodayAppointments();
      fetchStats();
      fetchPendingRedemptions();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, dateFilter, customDate, statusFilter]);

  // Refresh appointments periodically
  useEffect(() => {
    if (!professionalId) return;

    const interval = setInterval(() => {
      fetchTodayAppointments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [professionalId, dateFilter, customDate, statusFilter]);

  const fetchProfessionalData = async () => {
    if (!user) {
      console.log('No user found');
      setLoading(false);
      return;
    }

    console.log('Fetching professional for user:', user.id);

    const { data, error } = await supabase
      .from('professionals')
      .select('id, nome, commission_percent, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching professional:', error);
      toast.error('Erro ao carregar dados do profissional');
      setLoading(false);
      return;
    }

    console.log('Professional found:', data);

    if (data) {
      setProfessionalId(data.id);
      setProfessionalName(data.nome);
      setCommissionPercent(data.commission_percent || 50);
    } else {
      console.warn('No professional found for user:', user.id);
      toast.error('Profissional não encontrado. Verifique se sua conta está vinculada a um profissional.');
      setLoading(false);
    }
  };

  const fetchTodayAppointments = async () => {
    if (!professionalId) {
      setLoading(false);
      return;
    }

    // Calculate date range based on filter
    let start: string;
    let end: string;
    const today = new Date();

    if (dateFilter === 'today') {
      start = startOfDay(today).toISOString();
      end = endOfDay(today).toISOString();
    } else if (dateFilter === 'week') {
      start = startOfWeek(today, { locale: ptBR }).toISOString();
      end = endOfWeek(today, { locale: ptBR }).toISOString();
    } else if (dateFilter === 'month') {
      start = startOfMonth(today).toISOString();
      end = endOfMonth(today).toISOString();
    } else if (dateFilter === 'custom' && customDate) {
      const selectedDate = new Date(customDate);
      start = startOfDay(selectedDate).toISOString();
      end = endOfDay(selectedDate).toISOString();
    } else {
      // Default to today if custom date not selected
      start = startOfDay(today).toISOString();
      end = endOfDay(today).toISOString();
    }

    console.log('Fetching appointments for professional:', professionalId);
    console.log('Date range:', { start, end, dateFilter, statusFilter });

    let query = supabase
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
        service_id,
        services:service_id (
          nome,
          preco,
          duracao
        )
      `)
      .eq('professional_id', professionalId)
      .gte('data_hora', start)
      .lte('data_hora', end);

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.order('data_hora');

    if (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos');
      setLoading(false);
      return;
    }

    console.log('Appointments found:', data?.length || 0, data);

    const mapped = (data || []).map((apt: any) => ({
      id: apt.id,
      cliente_nome: apt.cliente_nome,
      cliente_zap: apt.cliente_zap,
      data_hora: apt.data_hora,
      status: apt.status || 'pending',
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

    // Lançar pontos de fidelidade automaticamente
    const pointsResult = await awardPointsOnAppointmentCompletion(appointmentId);
    if (pointsResult.success && pointsResult.pointsAwarded > 0) {
      toast.success(`Serviço marcado como realizado! Cliente ganhou ${pointsResult.pointsAwarded} pontos.`);
    } else {
      toast.success('Serviço marcado como realizado!');
    }

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

  const fetchPendingRedemptions = async () => {
    if (!user) return;

    try {
      // Buscar tenant_id do profissional
      const { data: professional } = await supabase
        .from('professionals')
        .select('tenant_id')
        .eq('id', professionalId)
        .single();

      if (!professional) return;

      // Buscar resgates pendentes do tenant
      const { data, error } = await supabase
        .from('loyalty_redemptions')
        .select(`
          id,
          validation_code,
          points_spent,
          expires_at,
          created_at,
          clients:client_id (id, nome, telefone),
          loyalty_rewards:reward_id (id, nome, reward_type, reward_value)
        `)
        .eq('tenant_id', professional.tenant_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending redemptions:', error);
        return;
      }

      // Mapear dados
      const mapped = (data || []).map((red: any) => ({
        id: red.id,
        validation_code: red.validation_code,
        points_spent: red.points_spent,
        expires_at: red.expires_at,
        created_at: red.created_at,
        client: red.clients,
        reward: red.loyalty_rewards,
      }));

      setPendingRedemptions(mapped);
    } catch (error) {
      console.error('Error fetching pending redemptions:', error);
    }
  };

  const openRedemptionDialog = (redemption: any) => {
    setSelectedRedemption(redemption);
    setRedemptionDialogOpen(true);
  };

  const handleRedemptionSuccess = () => {
    fetchPendingRedemptions();
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
              <h3 className="font-semibold text-sm">
                {dateFilter === 'today' ? 'Agendamentos de Hoje' : 
                 dateFilter === 'week' ? 'Agendamentos da Semana' :
                 dateFilter === 'month' ? 'Agendamentos do Mês' :
                 'Agendamentos'}
              </h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {todayAppointments.length}
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Select value={dateFilter} onValueChange={(value: 'today' | 'week' | 'month' | 'custom') => setDateFilter(value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Data Específica</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === 'custom' && (
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-9 text-xs"
                />
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="completed">Realizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>

              {(dateFilter !== 'today' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFilter('today');
                    setStatusFilter('all');
                    setCustomDate('');
                  }}
                  className="h-9 text-xs gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
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

        {/* Resgates Pendentes */}
        {pendingRedemptions.length > 0 && (
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gift className="w-5 h-5 text-gold" />
                  Resgates Pendentes
                </h3>
                <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                  {pendingRedemptions.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {pendingRedemptions.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-gold/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {redemption.client?.nome || 'Cliente'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {redemption.reward?.nome} • {redemption.points_spent} pontos
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => openRedemptionDialog(redemption)}
                      className="ml-2 shrink-0"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Validar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validate Code Dialog */}
        <ValidateCodeDialog
          open={validateDialogOpen}
          onOpenChange={setValidateDialogOpen}
          appointment={selectedAppointment}
          onSuccess={handleValidationSuccess}
        />

        {/* Validate Redemption Dialog */}
        <ValidateRedemptionDialog
          open={redemptionDialogOpen}
          onOpenChange={setRedemptionDialogOpen}
          redemption={selectedRedemption}
          onSuccess={handleRedemptionSuccess}
        />
      </div>
    </BarberLayout>
  );
}