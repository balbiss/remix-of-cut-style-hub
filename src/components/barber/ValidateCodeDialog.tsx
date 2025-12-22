import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

interface Appointment {
  id: string;
  cliente_nome: string;
  data_hora: string;
  confirmation_code: string | null;
  tolerance_expires_at: string | null;
  service: {
    nome: string;
    preco: number;
  };
}

interface ValidateCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export function ValidateCodeDialog({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: ValidateCodeDialogProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [toleranceStatus, setToleranceStatus] = useState<'within' | 'expired' | null>(null);

  const checkTolerance = () => {
    if (!appointment?.tolerance_expires_at) return 'within';
    
    const now = new Date();
    const toleranceEnd = new Date(appointment.tolerance_expires_at);
    
    return now > toleranceEnd ? 'expired' : 'within';
  };

  const handleValidate = async () => {
    if (!appointment || code.length !== 4) {
      toast.error('Digite o código de 4 dígitos');
      return;
    }

    if (code !== appointment.confirmation_code) {
      toast.error('Código inválido');
      return;
    }

    const status = checkTolerance();
    setToleranceStatus(status);

    if (status === 'within') {
      await completeAppointment();
    }
  };

  const completeAppointment = async () => {
    if (!appointment) return;

    setLoading(true);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointment.id);

    setLoading(false);

    if (error) {
      toast.error('Erro ao finalizar atendimento');
      return;
    }

    toast.success('Atendimento finalizado com sucesso!');
    setCode('');
    setToleranceStatus(null);
    onOpenChange(false);
    onSuccess();
  };

  const handleWait = async () => {
    if (!appointment) return;

    setLoading(true);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'waiting' })
      .eq('id', appointment.id);

    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success('Cliente aguardando vaga');
    setCode('');
    setToleranceStatus(null);
    onOpenChange(false);
    onSuccess();
  };

  const handleReschedule = async () => {
    if (!appointment) return;

    setLoading(true);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'no_show' })
      .eq('id', appointment.id);

    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.info('Agendamento marcado como não compareceu. Cliente deve remarcar.');
    setCode('');
    setToleranceStatus(null);
    onOpenChange(false);
    onSuccess();
  };

  const handleClose = () => {
    setCode('');
    setToleranceStatus(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Validar Código
          </DialogTitle>
          <DialogDescription>
            Digite o código de 4 dígitos do cliente para finalizar o atendimento
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4">
            {/* Client Info */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-sm font-medium">{appointment.cliente_nome}</p>
              <p className="text-xs text-muted-foreground">
                {appointment.service?.nome} • R$ {appointment.service?.preco?.toFixed(2)}
              </p>
            </div>

            {toleranceStatus === null ? (
              <>
                {/* Code Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código de Confirmação</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000"
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>

                <Button
                  onClick={handleValidate}
                  disabled={code.length !== 4 || loading}
                  className="w-full"
                >
                  {loading ? 'Validando...' : 'Validar Código'}
                </Button>
              </>
            ) : toleranceStatus === 'expired' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">Tolerância Expirada</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        O cliente chegou após os 10 minutos de tolerância. Escolha uma opção:
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleWait}
                    disabled={loading}
                    className="flex-col h-auto py-4"
                  >
                    <Clock className="h-5 w-5 mb-2" />
                    <span className="text-xs">Aguardar Vaga</span>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReschedule}
                    disabled={loading}
                    className="flex-col h-auto py-4"
                  >
                    <Calendar className="h-5 w-5 mb-2" />
                    <span className="text-xs">Remarcar</span>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={completeAppointment}
                  disabled={loading}
                  className="w-full text-xs text-muted-foreground"
                >
                  Atender mesmo assim
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
