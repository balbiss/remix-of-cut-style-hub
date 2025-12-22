import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gift, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { useLoyaltyRewards, LoyaltyReward } from '@/hooks/useLoyaltyRewards';

export function LoyaltyRewardsForm() {
  const { rewards, isLoading, addReward, updateReward, deleteReward } = useLoyaltyRewards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pointsRequired, setPointsRequired] = useState(100);
  const [rewardType, setRewardType] = useState<'service' | 'discount' | 'custom'>('discount');
  const [rewardValue, setRewardValue] = useState(0);

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setPointsRequired(100);
    setRewardType('discount');
    setRewardValue(0);
    setEditingReward(null);
  };

  const openEditDialog = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setNome(reward.nome);
    setDescricao(reward.descricao || '');
    setPointsRequired(reward.points_required);
    setRewardType(reward.reward_type);
    setRewardValue(reward.reward_value);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;

    if (editingReward) {
      await updateReward(editingReward.id, {
        nome,
        descricao: descricao || null,
        points_required: pointsRequired,
        reward_type: rewardType,
        reward_value: rewardValue,
      });
    } else {
      await addReward({
        nome,
        descricao: descricao || null,
        points_required: pointsRequired,
        reward_type: rewardType,
        reward_value: rewardValue,
        active: true,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteReward(id);
  };

  const handleToggleActive = async (reward: LoyaltyReward) => {
    await updateReward(reward.id, { active: !reward.active });
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'service': return 'Serviço grátis';
      case 'discount': return 'Desconto';
      case 'custom': return 'Personalizado';
      default: return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando recompensas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Recompensas</CardTitle>
                <CardDescription>
                  Configure as recompensas que os clientes podem resgatar
                </CardDescription>
              </div>
            </div>
            <Button
              variant="gold"
              size="sm"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Recompensa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhuma recompensa cadastrada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione recompensas para seus clientes resgatarem
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {rewards.map((reward) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      reward.active
                        ? 'bg-secondary/30 border-border'
                        : 'bg-muted/20 border-muted opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{reward.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          {reward.points_required} pontos • {getRewardTypeLabel(reward.reward_type)}
                          {reward.reward_type === 'discount' && reward.reward_value > 0 && (
                            <span> de {formatCurrency(reward.reward_value)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(reward)}
                        className="h-8 w-8"
                      >
                        <span className={`w-2 h-2 rounded-full ${reward.active ? 'bg-success' : 'bg-muted'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(reward)}
                        className="h-8 w-8"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reward.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da recompensa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da recompensa *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Corte Grátis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição opcional da recompensa"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Pontos necessários *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={pointsRequired}
                onChange={(e) => setPointsRequired(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de recompensa</Label>
              <Select value={rewardType} onValueChange={(v) => setRewardType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Serviço grátis</SelectItem>
                  <SelectItem value="discount">Desconto em R$</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rewardType === 'discount' && (
              <div className="space-y-2">
                <Label htmlFor="value">Valor do desconto (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rewardValue}
                  onChange={(e) => setRewardValue(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={!nome.trim()}>
              {editingReward ? 'Salvar' : 'Criar Recompensa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
