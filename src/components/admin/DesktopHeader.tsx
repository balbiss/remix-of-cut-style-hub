import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsPanel } from '@/components/admin/NotificationsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  '/admin': { title: 'Dashboard', breadcrumb: 'Início' },
  '/admin/agenda': { title: 'Agenda', breadcrumb: 'Agenda' },
  '/admin/clientes': { title: 'Clientes', breadcrumb: 'Clientes' },
  '/admin/financeiro': { title: 'Financeiro', breadcrumb: 'Financeiro' },
  '/admin/configuracoes': { title: 'Configurações', breadcrumb: 'Configurações' },
  '/admin/profissionais': { title: 'Equipe', breadcrumb: 'Profissionais' },
  '/admin/servicos': { title: 'Serviços', breadcrumb: 'Serviços' },
};

export function DesktopHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, signOut } = useAuth();
  const currentPage = pageTitles[location.pathname] || { title: 'Admin', breadcrumb: 'Admin' };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

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
        <NotificationsPanel />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <User className="w-4 h-4 text-gold" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{userData?.nome || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{userData?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
