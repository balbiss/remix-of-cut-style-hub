import { motion } from 'framer-motion';
import { AlertTriangle, Crown, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NavLink } from 'react-router-dom';

export function SubscriptionBanner() {
  const { tenant, isSubscriptionActive } = useAuth();

  if (isSubscriptionActive) {
    return null;
  }

  const planStatus = tenant?.plan_status;
  const expiresAt = tenant?.plan_expires_at ? new Date(tenant.plan_expires_at) : null;
  const activatedAt = tenant?.plan_activated_at ? new Date(tenant.plan_activated_at) : null;

  const isExpired = planStatus === 'expired' || (expiresAt && expiresAt < new Date());
  const isInactive = planStatus === 'inactive' || !planStatus;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className={`relative overflow-hidden rounded-xl p-6 ${
        isExpired 
          ? 'bg-gradient-to-r from-destructive/20 to-destructive/10 border border-destructive/30' 
          : 'bg-gradient-to-r from-warning/20 to-warning/10 border border-warning/30'
      }`}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              isExpired ? 'bg-destructive/20' : 'bg-warning/20'
            }`}>
              {isExpired ? (
                <AlertTriangle className="w-6 h-6 text-destructive" />
              ) : (
                <Crown className="w-6 h-6 text-warning" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {isExpired ? 'Plano Expirado' : 'Plano Inativo'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isExpired 
                  ? 'Seu plano expirou. Renove para continuar usando todas as funcionalidades.' 
                  : 'Ative um plano para desbloquear todas as funcionalidades do sistema.'}
              </p>
              
              {/* Status info */}
              <div className="flex flex-wrap gap-4 mt-3">
                {tenant?.plan && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Crown className="w-4 h-4" />
                    <span>Plano: <span className="text-foreground capitalize">{tenant.plan}</span></span>
                  </div>
                )}
                {activatedAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Ativado: {format(activatedAt, "dd 'de' MMM", { locale: ptBR })}</span>
                  </div>
                )}
                {expiresAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">Expirou: {format(expiresAt, "dd 'de' MMM", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <NavLink to="/admin/configuracoes">
              <Button 
                variant="outline" 
                className="border-gold/30 text-gold hover:bg-gold/10"
              >
                Ver Planos
              </Button>
            </NavLink>
            <Button className="bg-gradient-to-r from-gold to-copper text-primary-foreground">
              <CreditCard className="w-4 h-4 mr-2" />
              Ativar Agora
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
