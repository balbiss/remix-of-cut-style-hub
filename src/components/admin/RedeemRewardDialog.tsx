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
import { Gift, Star, Check } from 'lucide-react';
import { useLoyaltyRewards, LoyaltyReward } from '@/hooks/useLoyaltyRewards';
import { ClientWithPoints } from '@/hooks/useClients';

interface RedeemRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientWithPoints | null;
  onRedeem: (clientId: string, rewardId: string, points: number) => Promise<void>;
}

export function RedeemRewardDialog({
  open,
  onOpenChange,
  client,
  onRedeem,
}: RedeemRewardDialogProps) {
  const { activeRewards, isLoading } = useLoyaltyRewards();
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const availableRewards = activeRewards.filter(
    (r) => client && r.points_required <= client.pontos
  );

  const handleRedeem = async () => {
    if (!client || !selectedReward) return;

    setIsRedeeming(true);
    await onRedeem(client.id, selectedReward.id, selectedReward.points_required);
    setIsRedeeming(false);
    setSelectedReward(null);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getRewardDescription = (reward: LoyaltyReward) => {
    switch (reward.reward_type) {
      case 'service':
        return 'Serviço grátis';
      case 'discount':
        return `Desconto de ${formatCurrency(reward.reward_value)}`;
      case 'custom':
        return reward.descricao || 'Recompensa personalizada';
      default:
        return '';
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-gold" />
            Resgatar Recompensa
          </DialogTitle>
          <DialogDescription>
            {client.nome} possui <span className="text-gold font-semibold">{client.pontos} pontos</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[300px] overflow-y-auto py-2">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Carregando...</p>
          ) : availableRewards.length === 0 ? (
            <div className="text-center py-6">
              <Star className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Nenhuma recompensa disponível
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                O cliente precisa de mais pontos para resgatar
              </p>
            </div>
          ) : (
            availableRewards.map((reward) => (
              <button
                key={reward.id}
                onClick={() => setSelectedReward(reward)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  selectedReward?.id === reward.id
                    ? 'border-gold bg-gold/10'
                    : 'border-border bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{reward.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getRewardDescription(reward)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="font-semibold text-gold">
                      {reward.points_required}
                    </span>
                    {selectedReward?.id === reward.id && (
                      <Check className="w-5 h-5 text-gold ml-2" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="gold"
            onClick={handleRedeem}
            disabled={!selectedReward || isRedeeming}
          >
            {isRedeeming ? 'Resgatando...' : 'Confirmar Resgate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
