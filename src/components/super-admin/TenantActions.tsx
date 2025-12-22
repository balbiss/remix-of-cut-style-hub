import { useState } from 'react';
import { TenantWithDetails } from '@/pages/super-admin/Tenants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Play, Square, Calendar, Loader2 } from 'lucide-react';

interface TenantActionsProps {
  tenant: TenantWithDetails;
  onRefresh: () => void;
}

export function TenantActions({ tenant, onRefresh }: TenantActionsProps) {
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [days, setDays] = useState('30');
  const { toast } = useToast();

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(days));

      const { error } = await supabase
        .from('tenants')
        .update({
          plan: selectedPlan,
          plan_status: 'active',
          plan_activated_at: new Date().toISOString(),
          plan_expires_at: expiresAt.toISOString(),
          payment_status: 'paid',
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: 'Plano ativado!',
        description: `Plano ${selectedPlan} ativado por ${days} dias`,
      });

      setIsActivateOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error activating plan:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao ativar plano',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          plan_status: 'inactive',
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: 'Plano desativado',
        description: 'O plano foi desativado com sucesso',
      });

      onRefresh();
    } catch (error) {
      console.error('Error deactivating plan:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desativar plano',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtend = async () => {
    setIsLoading(true);
    try {
      const currentExpiry = tenant.plan_expires_at 
        ? new Date(tenant.plan_expires_at) 
        : new Date();
      
      // If already expired, start from today
      const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
      baseDate.setDate(baseDate.getDate() + parseInt(days));

      const { error } = await supabase
        .from('tenants')
        .update({
          plan_expires_at: baseDate.toISOString(),
          plan_status: 'active',
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: 'Período estendido!',
        description: `Plano estendido por mais ${days} dias`,
      });

      setIsExtendOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error extending plan:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao estender plano',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsActivateOpen(true)}>
            <Play className="w-4 h-4 mr-2" />
            Ativar Plano
          </DropdownMenuItem>
          {tenant.plan_status === 'active' && (
            <>
              <DropdownMenuItem onClick={() => setIsExtendOpen(true)}>
                <Calendar className="w-4 h-4 mr-2" />
                Estender Período
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeactivate}
                className="text-destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Desativar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Activate Plan Dialog */}
      <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar Plano</DialogTitle>
            <DialogDescription>
              Ative manualmente o plano para {tenant.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duração (dias)</Label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                min="1"
                max="365"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleActivate} 
              disabled={isLoading}
              className="bg-gradient-to-r from-gold to-copper text-primary-foreground"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Period Dialog */}
      <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Período</DialogTitle>
            <DialogDescription>
              Adicione mais dias ao plano de {tenant.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dias adicionais</Label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                min="1"
                max="365"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExtend} 
              disabled={isLoading}
              className="bg-gradient-to-r from-gold to-copper text-primary-foreground"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Estender'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
