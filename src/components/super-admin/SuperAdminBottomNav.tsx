import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  ArrowLeft,
} from 'lucide-react';

const navItems = [
  { to: '/super-admin', icon: LayoutDashboard, label: 'Início', end: true },
  { to: '/super-admin/tenants', icon: Building2, label: 'Tenants', end: false },
  { to: '/admin', icon: ArrowLeft, label: 'Admin', end: true },
];

export function SuperAdminBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border safe-area-inset-bottom lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== '/super-admin';
          
          const isDashboardActive = item.to === '/super-admin' && location.pathname === '/super-admin';
          const active = item.end ? isDashboardActive || location.pathname === item.to : isActive;

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
                    layoutId="superAdminBottomNavIndicator"
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
