import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trophy, Home, Star, Shield, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessScreenProps {
  clientName: string;
  loyaltyPoints: number;
  earnedPoints?: number;
  loyaltyEnabled?: boolean;
  confirmationCode?: string | null;
  paymentMethod?: 'online' | 'local';
}

export function SuccessScreen({
  clientName,
  loyaltyPoints,
  earnedPoints = 0,
  loyaltyEnabled = true,
  confirmationCode = null,
  paymentMethod = 'local',
}: SuccessScreenProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-14 h-14 text-success" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-display text-3xl font-bold text-foreground text-center mb-2"
      >
        Agendamento Confirmado!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-center mb-6"
      >
        {clientName}, seu horário foi reservado com sucesso!
      </motion.p>

      {/* Confirmation Code Card - Only for online payments */}
      {confirmationCode && paymentMethod === 'online' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full max-w-sm bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border-2 border-primary/40 p-6 mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Código de Confirmação</span>
          </div>
          
          <div className="bg-background/80 rounded-xl p-4 mb-4">
            <p className="text-4xl font-mono font-bold text-center tracking-[0.3em] text-primary">
              {confirmationCode}
            </p>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Apresente este código ao barbeiro ao chegar para finalizar o atendimento
          </p>
        </motion.div>
      )}

      {/* Tolerance Reminder - Only for online payments */}
      {paymentMethod === 'online' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6"
        >
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-500 text-sm">Lembre-se</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você tem até <strong className="text-foreground">10 minutos</strong> de tolerância após o horário marcado. 
                Chegue no horário para garantir seu atendimento!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loyalty Points Card */}
      {loyaltyEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="w-full max-w-sm bg-gradient-to-br from-gold/20 to-copper/20 rounded-2xl border border-gold/30 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-gold" />
              <span className="font-semibold text-foreground">Programa Fidelidade</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Seu saldo atual</p>
            <p className="text-4xl font-bold gold-text">{loyaltyPoints}</p>
            <p className="text-sm text-muted-foreground">pontos</p>
          </div>
          {earnedPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 p-3 bg-gold/10 rounded-lg flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5 text-gold" />
              <span className="text-sm font-medium text-foreground">
                +{earnedPoints} pontos ganhos neste agendamento
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm"
      >
        <Button
          variant="gold"
          size="xl"
          className="w-full"
          onClick={() => navigate('/')}
        >
          <Home className="w-5 h-5 mr-2" />
          Voltar ao Início
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm text-muted-foreground text-center mt-6"
      >
        Você receberá uma confirmação via WhatsApp
      </motion.p>
    </motion.div>
  );
}
