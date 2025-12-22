import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Service, Professional } from '@/lib/mock-data';
import { CreditCard, Banknote, Calendar, Clock, User, Scissors } from 'lucide-react';

interface PaymentStepProps {
  professional: Professional | undefined;
  services: Service[];
  date: Date | null;
  time: string | null;
  clientName: string;
  onPaymentSelect: (method: 'online' | 'local') => void;
}

export function PaymentStep({
  professional,
  services,
  date,
  time,
  clientName,
  onPaymentSelect,
}: PaymentStepProps) {
  const total = services.reduce((sum, s) => sum + s.preco, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.duracao, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="font-display text-xl font-semibold text-center text-foreground">
        Resumo do Agendamento
      </h2>

      {/* Summary Card */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
            <User className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profissional</p>
            <p className="font-semibold text-foreground">{professional?.nome}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scissors className="w-4 h-4" />
            <span className="text-sm">Serviços</span>
          </div>
          {services.map((service) => (
            <div key={service.id} className="flex justify-between pl-6">
              <span className="text-foreground">{service.nome}</span>
              <span className="text-gold font-semibold">{formatPrice(service.preco)}</span>
            </div>
          ))}
        </div>

        {date && time && (
          <div className="flex gap-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-sm text-foreground capitalize">{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              <span className="text-sm text-foreground">{time}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold gold-text">{formatPrice(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Duração estimada</p>
            <p className="font-semibold text-foreground">{totalDuration} min</p>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">Escolha como pagar</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="gold"
            size="lg"
            onClick={() => onPaymentSelect('online')}
            className="flex-col h-auto py-4"
          >
            <CreditCard className="w-6 h-6 mb-2" />
            <span>Pagar Online</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onPaymentSelect('local')}
            className="flex-col h-auto py-4 hover:border-gold hover:text-gold"
          >
            <Banknote className="w-6 h-6 mb-2" />
            <span>Pagar no Local</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
