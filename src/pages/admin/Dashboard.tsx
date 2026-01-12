import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  Scissors,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Loader2,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { SetupChecklist } from '@/components/admin/SetupChecklist';
import { format, parseISO } from 'date-fns';

const AdminDashboard = () => {
  const { appointments, loading: loadingAppointments } = useAppointments({ date: new Date() });
  const { services, loading: loadingServices } = useServices();
  const { professionals, loading: loadingProfessionals } = useProfessionals();
  const { hasBusinessHoursConfigured, loading: loadingHours } = useBusinessHours();

  const loading = loadingAppointments || loadingServices || loadingProfessionals || loadingHours;

  // Check setup status
  const hasProfessionals = professionals.filter(p => p.ativo).length > 0;
  const hasServices = services.filter(s => s.ativo).length > 0;

  // Calculate stats from real data
  const todayAppointments = appointments.filter(a => a.status !== 'cancelled');
  const confirmedCount = todayAppointments.filter(a => a.status === 'confirmed').length;
  const completedCount = todayAppointments.filter(a => a.status === 'completed').length;
  
  // Calculate today's revenue from completed appointments
  const todayRevenue = todayAppointments
    .filter(a => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + (a.service?.preco || 0), 0);

  const activeProfessionals = professionals.filter(p => p.ativo).length;

  const stats = [
    {
      title: 'Faturamento Hoje',
      value: `R$ ${todayRevenue.toFixed(0)}`,
      change: todayAppointments.length > 0 ? `${todayAppointments.length} atend.` : 'Sem atendimentos',
      icon: DollarSign,
      trend: todayRevenue > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Cortes Realizados',
      value: String(completedCount),
      change: `${confirmedCount} confirmados`,
      icon: Scissors,
      trend: completedCount > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Profissionais',
      value: String(activeProfessionals),
      change: 'ativos',
      icon: Users,
      trend: 'neutral',
    },
    {
      title: 'Serviços',
      value: String(services.filter(s => s.ativo).length),
      change: 'disponíveis',
      icon: TrendingUp,
      trend: 'neutral',
    },
  ];

  // Upcoming appointments (confirmed and pending)
  const upcomingAppointments = todayAppointments
    .filter(a => a.status === 'confirmed' || a.status === 'pending')
    .slice(0, 4)
    .map(a => ({
      time: format(parseISO(a.data_hora), 'HH:mm'),
      client: a.cliente_nome,
      service: a.service?.nome || 'Serviço',
      professional: a.professional?.nome || 'Profissional',
    }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Visão geral do seu negócio</p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>

        {/* Setup Checklist - only shows if incomplete */}
        <SetupChecklist
          hasProfessionals={hasProfessionals}
          hasServices={hasServices}
          hasBusinessHours={hasBusinessHoursConfigured}
        />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="bento" className="h-full">
                <CardContent className="p-3 sm:pt-6 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 sm:space-y-2 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <Card variant="elevated" className="h-full">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">Próximos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum agendamento hoje</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {upcomingAppointments.map((apt, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className="font-semibold text-foreground text-xs sm:text-sm">{apt.time}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-xs sm:text-sm truncate">{apt.client}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{apt.service}</p>
                        </div>
                        <span className="text-[10px] sm:text-xs text-primary hidden sm:block shrink-0">{apt.professional}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Services Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <Card variant="elevated" className="h-full">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">Serviços Populares</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {services.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Scissors className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum serviço cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {services.filter(s => s.ativo).slice(0, 4).map((service, index) => (
                      <div key={service.id} className="space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-foreground truncate">{service.nome}</span>
                          <span className="text-primary font-semibold shrink-0 ml-2">R$ {service.preco.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${100 - index * 20}%` }}
                            transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                            className="h-full gold-gradient rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Team Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-1"
          >
            <Card variant="elevated" className="h-full">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">Equipe</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {professionals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum profissional cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {professionals.filter(p => p.ativo).slice(0, 4).map((prof) => (
                      <div
                        key={prof.id}
                        className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                          <AvatarImage src={prof.avatar_url || undefined} alt={prof.nome} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-xs sm:text-sm truncate">{prof.nome}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{prof.especialidade || 'Profissional'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
