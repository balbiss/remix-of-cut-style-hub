import { motion } from 'framer-motion';
import { Service } from '@/lib/mock-data';
import { Clock, Check } from 'lucide-react';

interface ServiceSelectProps {
  services: Service[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ServiceSelect({ services, selectedIds, onToggle }: ServiceSelectProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-center text-foreground">
        Selecione os Serviços
      </h2>
      <div className="grid gap-2">
        {services.map((service, index) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onToggle(service.id)}
              className={`relative flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300 ${
                isSelected
                  ? 'border-gold bg-gold/10 shadow-gold'
                  : 'border-border bg-card hover:border-gold/50'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`font-semibold text-sm ${isSelected ? 'text-gold' : 'text-foreground'}`}>
                  {service.nome}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{service.duracao} min</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${isSelected ? 'text-gold' : 'text-foreground'}`}>
                  {formatPrice(service.preco)}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-gold border-gold'
                    : 'border-muted-foreground'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
