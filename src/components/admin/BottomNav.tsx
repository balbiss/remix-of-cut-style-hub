import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Início', end: true },
  { to: '/admin/agenda', icon: Calendar, label: 'Agenda', end: false },
  { to: '/admin/profissionais', icon: Users, label: 'Equipe', end: false },
  { to: '/admin/servicos', icon: Scissors, label: 'Serviços', end: false },
  { to: '/admin/configuracoes', icon: Settings, label: 'Config', end: false },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border safe-area-inset-bottom lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
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
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              <motion.div
                className={`flex flex-col items-center gap-1 ${
                  active ? 'text-gold' : 'text-muted-foreground'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 w-12 h-1 rounded-full gold-gradient"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
