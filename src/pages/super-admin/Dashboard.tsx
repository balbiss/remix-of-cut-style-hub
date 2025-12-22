import { useEffect, useState } from 'react';
import { SuperAdminLayout } from '@/components/super-admin/SuperAdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';

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
        // Fetch total tenants
        const { count: totalTenants } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true });

        // Fetch active tenants
        const { count: activeTenants } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('plan_status', 'active');

        // Fetch total users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Fetch total revenue from paid payments
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

  const statCards = [
    {
      title: 'Total de Tenants',
      value: stats.totalTenants,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Tenants Ativos',
      value: stats.activeTenants,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: CreditCard,
      color: 'from-gold to-copper',
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {loading ? '...' : card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/super-admin/tenants"
              className="flex items-center gap-3 p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Gerenciar Tenants</span>
            </a>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
