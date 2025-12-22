import { useEffect, useState } from 'react';
import { SuperAdminLayout } from '@/components/super-admin/SuperAdminLayout';
import { TenantTable } from '@/components/super-admin/TenantTable';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface TenantWithDetails {
  id: string;
  nome: string;
  plan: string | null;
  plan_status: string | null;
  plan_activated_at: string | null;
  plan_expires_at: string | null;
  payment_status: string | null;
  created_at: string | null;
  users_count?: number;
}

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data: tenantsData, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tenantsWithCounts = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          return {
            ...tenant,
            users_count: count || 0,
          };
        })
      );

      setTenants(tenantsWithCounts);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tenants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter((tenant) =>
    tenant.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Tenants</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie as barbearias
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchTenants}
            disabled={loading}
            size="sm"
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Table */}
        <TenantTable 
          tenants={filteredTenants} 
          loading={loading}
          onRefresh={fetchTenants}
        />
      </div>
    </SuperAdminLayout>
  );
}
