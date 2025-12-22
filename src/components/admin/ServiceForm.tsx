import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Service } from '@/lib/mock-data';

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSave: (service: Omit<Service, 'id' | 'tenant_id'>) => void;
}

export function ServiceForm({
  open,
  onOpenChange,
  service,
  onSave,
}: ServiceFormProps) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (service) {
      setNome(service.nome);
      setPreco(String(service.preco));
      setDuracao(String(service.duracao));
      setDescricao(service.descricao);
      setAtivo(service.ativo);
    } else {
      setNome('');
      setPreco('');
      setDuracao('');
      setDescricao('');
      setAtivo(true);
    }
  }, [service, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome,
      preco: parseFloat(preco),
      duracao: parseInt(duracao),
      descricao,
      ativo,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do serviço</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Corte Tradicional"
              required
            />
          </div>

          {/* Preço e Duração */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (min)</Label>
              <Input
                id="duracao"
                type="number"
                min="5"
                step="5"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                placeholder="30"
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o serviço..."
              rows={3}
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Serviço ativo</Label>
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {service ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
