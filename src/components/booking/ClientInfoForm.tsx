import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { User, Phone } from 'lucide-react';

interface ClientInfoFormProps {
  name: string;
  phone: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function ClientInfoForm({ name, phone, onNameChange, onPhoneChange }: ClientInfoFormProps) {
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onPhoneChange(formatted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="font-display text-xl font-semibold text-center text-foreground">
        Seus Dados
      </h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            Nome Completo
          </label>
          <Input
            type="text"
            placeholder="Digite seu nome"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Phone className="w-4 h-4" />
            WhatsApp
          </label>
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={15}
          />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Seus dados são protegidos e usados apenas para confirmação do agendamento.
      </p>
    </motion.div>
  );
}
