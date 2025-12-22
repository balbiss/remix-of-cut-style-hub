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
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const stats = [
  {
    title: 'Faturamento Hoje',
    value: 'R$ 1.250',
    change: '+12%',
    icon: DollarSign,
    trend: 'up',
  },
  {
    title: 'Cortes Realizados',
    value: '18',
    change: '+3',
    icon: Scissors,
    trend: 'up',
  },
  {
    title: 'Novos Clientes',
    value: '5',
    change: 'esta semana',
    icon: Users,
    trend: 'neutral',
  },
  {
    title: 'Taxa de Ocupação',
    value: '87%',
    change: '+5%',
    icon: TrendingUp,
    trend: 'up',
  },
];

const upcomingAppointments = [
  { time: '14:30', client: 'Lucas Mendes', service: 'Corte + Barba', professional: 'Carlos' },
  { time: '15:00', client: 'Rafael Costa', service: 'Corte Degradê', professional: 'João' },
  { time: '15:30', client: 'André Souza', service: 'Corte Tradicional', professional: 'Carlos' },
  { time: '16:00', client: 'Bruno Lima', service: 'Barba Completa', professional: 'Pedro' },
];

const weeklyData = [
  { day: 'Seg', value: 85 },
  { day: 'Ter', value: 70 },
  { day: 'Qua', value: 92 },
  { day: 'Qui', value: 78 },
  { day: 'Sex', value: 95 },
  { day: 'Sáb', value: 100 },
  { day: 'Dom', value: 0 },
];

const AdminDashboard = () => {
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
                        {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-success shrink-0" />}
                        {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-destructive shrink-0" />}
                        <span className={`text-xs sm:text-sm ${
                          stat.trend === 'up' ? 'text-success' : 
                          stat.trend === 'down' ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Performance Chart */}
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
                  <CardTitle className="text-base sm:text-lg">Ocupação Semanal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="flex items-end justify-between h-32 sm:h-40 gap-1 sm:gap-2">
                  {weeklyData.map((item, index) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${item.value}%` }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                        className={`w-full rounded-t-md ${
                          item.value > 90 ? 'gold-gradient' : 
                          item.value > 0 ? 'bg-primary/50' : 
                          'bg-secondary'
                        }`}
                        style={{ minHeight: item.value > 0 ? '8px' : '4px' }}
                      />
                      <span className="text-[9px] sm:text-xs text-muted-foreground">{item.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-1"
          >
            <Card variant="elevated" className="h-full">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">Top Serviços</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { name: 'Corte + Barba', count: 28, percent: 100 },
                    { name: 'Corte Degradê', count: 22, percent: 78 },
                    { name: 'Corte Tradicional', count: 18, percent: 64 },
                    { name: 'Barba Completa', count: 12, percent: 43 },
                  ].map((service, index) => (
                    <div key={service.name} className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-foreground truncate">{service.name}</span>
                        <span className="text-primary font-semibold shrink-0 ml-2">{service.count}</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${service.percent}%` }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                          className="h-full gold-gradient rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
