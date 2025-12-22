import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TenantWithDetails } from '@/pages/super-admin/Tenants';
import { TenantActions } from './TenantActions';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TenantTableProps {
  tenants: TenantWithDetails[];
  loading: boolean;
  onRefresh: () => void;
}

export function TenantTable({ tenants, loading, onRefresh }: TenantTableProps) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Expirado</Badge>;
      case 'inactive':
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Inativo</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null) => {
    switch (plan) {
      case 'premium':
        return <Badge className="bg-gold/10 text-gold border-gold/20">Premium</Badge>;
      case 'basic':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Básico</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Enterprise</Badge>;
      case 'free':
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground">Nenhum tenant encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usuários</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium">{tenant.nome}</TableCell>
              <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
              <TableCell>{getStatusBadge(tenant.plan_status)}</TableCell>
              <TableCell>{tenant.users_count}</TableCell>
              <TableCell>
                {tenant.plan_expires_at
                  ? format(new Date(tenant.plan_expires_at), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </TableCell>
              <TableCell>
                {tenant.created_at
                  ? format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <TenantActions tenant={tenant} onRefresh={onRefresh} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
