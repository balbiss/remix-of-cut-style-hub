import { useEffect, useState } from 'react';
import { SuperAdminLayout } from '@/components/super-admin/SuperAdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: totalTenants } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true });

        const { count: activeTenants } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('plan_status', 'active');

        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'paid');

        const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        setStats({
          totalTenants: totalTenants || 0,
          activeTenants: activeTenants || 0,
          totalUsers: totalUsers || 0,
          totalRevenue,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const statCards = [
    {
      title: 'Tenants',
      value: stats.totalTenants,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Ativos',
      value: stats.activeTenants,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Usuários',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Receita',
      value: formatCurrency(stats.totalRevenue),
      icon: CreditCard,
      color: 'from-gold to-copper',
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-shadow"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">{card.title}</p>
              {loading ? (
                <Skeleton className="h-6 md:h-7 w-16 mt-1" />
              ) : (
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-foreground mt-1">
                  {card.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
