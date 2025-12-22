import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface Professional {
  id: string;
  nome: string;
  especialidade?: string | null;
  avatar_url?: string | null;
}

interface ProfessionalSelectProps {
  professionals: Professional[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProfessionalSelect({ professionals, selectedId, onSelect }: ProfessionalSelectProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-center text-foreground">
        Escolha seu Profissional
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {professionals.map((pro, index) => (
          <motion.button
            key={pro.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(pro.id)}
            className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-300 ${
              selectedId === pro.id
                ? 'border-gold bg-gold/10 shadow-gold'
                : 'border-border bg-card hover:border-gold/50'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1.5 transition-all overflow-hidden ${
              selectedId === pro.id ? 'ring-2 ring-gold ring-offset-2 ring-offset-background' : 'bg-secondary'
            }`}>
              {pro.avatar_url ? (
                <img
                  src={pro.avatar_url}
                  alt={pro.nome}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className={`w-6 h-6 ${selectedId === pro.id ? 'text-gold' : 'text-muted-foreground'}`} />
              )}
            </div>
            <span className={`font-medium text-xs text-center leading-tight ${
              selectedId === pro.id ? 'text-gold' : 'text-foreground'
            }`}>
              {pro.nome}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
