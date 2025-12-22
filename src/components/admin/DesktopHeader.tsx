import { useLocation } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  '/admin': { title: 'Dashboard', breadcrumb: 'Início' },
  '/admin/agenda': { title: 'Agenda', breadcrumb: 'Agenda' },
  '/admin/clientes': { title: 'Clientes', breadcrumb: 'Clientes' },
  '/admin/financeiro': { title: 'Financeiro', breadcrumb: 'Financeiro' },
  '/admin/configuracoes': { title: 'Configurações', breadcrumb: 'Configurações' },
};

export function DesktopHeader() {
  const location = useLocation();
  const currentPage = pageTitles[location.pathname] || { title: 'Admin', breadcrumb: 'Admin' };

  return (
    <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-border bg-background/50 backdrop-blur-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Admin</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">{currentPage.breadcrumb}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-9 h-9 bg-secondary/50 border-border"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold" />
        </Button>

        {/* User */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <User className="w-4 h-4 text-gold" />
          </div>
        </Button>
      </div>
    </header>
  );
}
