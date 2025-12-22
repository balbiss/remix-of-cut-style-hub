import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicLogo } from '@/components/DynamicLogo';
import { DesktopHeader } from '@/components/admin/DesktopHeader';
import { BottomNav } from '@/components/admin/BottomNav';
import { SubscriptionBanner } from '@/components/admin/SubscriptionBanner';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/use-responsive';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/agenda', icon: Calendar, label: 'Agenda', end: false },
  { to: '/admin/profissionais', icon: Users, label: 'Equipe', end: false },
  { to: '/admin/servicos', icon: Scissors, label: 'Serviços', end: false },
  { to: '/admin/clientes', icon: Users, label: 'Clientes', end: false },
  { to: '/admin/financeiro', icon: DollarSign, label: 'Financeiro', end: false },
  { to: '/admin/configuracoes', icon: Settings, label: 'Configurações', end: false },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isDesktop } = useResponsive();
  const { tenant } = useAuth();

  const logoUrl = tenant?.logo_url || null;
  const businessName = tenant?.nome || 'BarberPro';

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <DynamicLogo
            logoUrl={logoUrl}
            businessName={businessName}
            size="md"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== '/admin';
            
            const isDashboardActive = item.to === '/admin' && location.pathname === '/admin';
            const active = item.end ? isDashboardActive : isActive;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  active
                    ? 'bg-sidebar-accent text-gold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-gold' : ''}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Site
          </NavLink>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col lg:hidden"
          >
            <div className="absolute top-0 right-0 translate-x-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="m-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Logo */}
            <div className="p-6 border-b border-sidebar-border">
              <DynamicLogo
                logoUrl={logoUrl}
                businessName={businessName}
                size="md"
              />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to) && item.to !== '/admin';
                
                const isDashboardActive = item.to === '/admin' && location.pathname === '/admin';
                const active = item.end ? isDashboardActive : isActive;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      active
                        ? 'bg-sidebar-accent text-gold'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${active ? 'text-gold' : ''}`} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border">
              <NavLink
                to="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar ao Site
              </NavLink>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Desktop Header */}
        <DesktopHeader />

        {/* Mobile Top Bar */}
        <header className="glass-strong sticky top-0 z-30 border-b border-border px-4 py-3 flex items-center justify-between lg:hidden">
          <DynamicLogo
            logoUrl={logoUrl}
            businessName={businessName}
            size="sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <SubscriptionBanner />
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
