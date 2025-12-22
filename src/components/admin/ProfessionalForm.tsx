import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Professional } from '@/lib/mock-data';
import { User, Upload, X } from 'lucide-react';

interface ProfessionalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional?: Professional | null;
  onSave: (professional: Omit<Professional, 'id' | 'tenant_id'>) => void;
}

export function ProfessionalForm({
  open,
  onOpenChange,
  professional,
  onSave,
}: ProfessionalFormProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (professional) {
      setNome(professional.nome);
      setTelefone(professional.telefone);
      setEspecialidade(professional.especialidade);
      setAtivo(professional.ativo);
      setAvatarUrl(professional.avatar_url);
    } else {
      setNome('');
      setTelefone('');
      setEspecialidade('');
      setAtivo(true);
      setAvatarUrl(null);
    }
  }, [professional, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome,
      telefone,
      especialidade,
      ativo,
      avatar_url: avatarUrl,
      schedule: professional?.schedule,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {professional ? 'Editar Profissional' : 'Novo Profissional'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar com Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-2 border-gold/30">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-secondary text-gold">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              
              {/* Overlay de upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="w-6 h-6 text-gold" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Escolher Foto
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG ou JPG. Máximo 2MB.
            </p>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva"
              required
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Ex: 11999999999"
              required
            />
          </div>

          {/* Especialidade */}
          <div className="space-y-2">
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input
              id="especialidade"
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              placeholder="Ex: Cortes clássicos"
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Profissional ativo</Label>
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
              {professional ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
