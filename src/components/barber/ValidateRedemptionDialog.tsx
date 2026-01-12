import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Shield, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Redemption {
  id: string;
  validation_code: string;
  points_spent: number;
  expires_at: string;
  created_at: string;
  client: {
    id: string;
    nome: string;
    telefone: string;
  };
  reward: {
    id: string;
    nome: string;
    reward_type: string;
    reward_value: number;
  };
}

interface ValidateRedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redemption: Redemption | null;
  onSuccess: () => void;
}

export function ValidateRedemptionDialog({
  open,
  onOpenChange,
  redemption,
  onSuccess,
}: ValidateRedemptionDialogProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const checkExpiration = () => {
    if (!redemption?.expires_at) return false;
    
    const now = new Date();
    const expiresAt = new Date(redemption.expires_at);
    
    return now > expiresAt;
  };

  const handleValidate = async () => {
    if (!redemption || code.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    const expired = checkExpiration();
    setIsExpired(expired);

    if (expired) {
      toast.error('Código expirado. O cliente precisa solicitar um novo resgate.');
      return;
    }

    if (code !== redemption.validation_code) {
      toast.error('Código inválido');
      return;
    }

    await confirmRedemption();
  };

  const confirmRedemption = async () => {
    if (!redemption) return;

    setLoading(true);

    try {
      // 1. Atualizar status do resgate para 'completed'
      const { error: redemptionError } = await supabase
        .from('loyalty_redemptions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', redemption.id);

      if (redemptionError) throw redemptionError;

      // 2. Buscar tenant_id do resgate
      const { data: redemptionData } = await supabase
        .from('loyalty_redemptions')
        .select('tenant_id')
        .eq('id', redemption.id)
        .single();

      if (!redemptionData) {
        throw new Error('Dados do resgate não encontrados');
      }

      // 3. Deduzir pontos do cliente
      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('tenant_id', redemptionData.tenant_id)
        .eq('cliente_zap', redemption.client.telefone)
        .maybeSingle();

      if (pointsData) {
        const newPoints = Math.max(0, (pointsData.pontos || 0) - redemption.points_spent);
        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update({
            pontos: newPoints,
            total_redeemed: ((pointsData as any).total_redeemed || 0) + redemption.points_spent,
          })
          .eq('id', pointsData.id);

        if (updateError) throw updateError;
      } else {
        // Criar registro se não existir (caso raro)
        const { error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            tenant_id: redemptionData.tenant_id,
            cliente_zap: redemption.client.telefone,
            pontos: 0,
            total_earned: 0,
            total_redeemed: redemption.points_spent,
          });

        if (insertError) throw insertError;
      }

      toast.success('Resgate confirmado! Os pontos foram deduzidos.');
      setCode('');
      setIsExpired(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error confirming redemption:', error);
      toast.error('Erro ao confirmar resgate');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!redemption) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('loyalty_redemptions')
        .update({ status: 'cancelled' })
        .eq('id', redemption.id);

      if (error) throw error;

      toast.info('Resgate cancelado');
      setCode('');
      setIsExpired(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error cancelling redemption:', error);
      toast.error('Erro ao cancelar resgate');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setIsExpired(false);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getRewardDescription = (reward: Redemption['reward']) => {
    switch (reward.reward_type) {
      case 'service':
        return 'Serviço grátis';
      case 'discount':
        return `Desconto de ${formatCurrency(reward.reward_value)}`;
      case 'custom':
        return 'Recompensa personalizada';
      default:
        return '';
    }
  };

  if (!redemption) return null;

  const expired = checkExpiration();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-gold" />
            Validar Resgate de Recompensa
          </DialogTitle>
          <DialogDescription>
            O cliente deve apresentar o código recebido via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Resgate */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{redemption.client.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recompensa</p>
              <p className="font-medium">{redemption.reward.nome}</p>
              <p className="text-sm text-muted-foreground">
                {getRewardDescription(redemption.reward)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pontos</p>
              <p className="font-medium text-gold">{redemption.points_spent} pontos</p>
            </div>
            {redemption.expires_at && (
              <div>
                <p className="text-sm text-muted-foreground">Expira em</p>
                <p className={`text-sm font-medium ${expired ? 'text-destructive' : ''}`}>
                  {format(new Date(redemption.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          {/* Input do Código */}
          <div className="space-y-2">
            <Label htmlFor="code">Código de Validação</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              disabled={loading || expired}
            />
            <p className="text-xs text-muted-foreground text-center">
              Digite o código de 6 dígitos recebido pelo cliente
            </p>
          </div>

          {/* Aviso de Expiração */}
          {expired && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este código expirou. O cliente precisa solicitar um novo resgate.</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar Resgate
          </Button>
          <Button
            variant="gold"
            onClick={handleValidate}
            disabled={loading || code.length !== 6 || expired}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Validar e Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

