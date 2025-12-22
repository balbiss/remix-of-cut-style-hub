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
import { Separator } from '@/components/ui/separator';
import { Professional } from '@/hooks/useProfessionals';
import { User, Upload, X, Key, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface ProfessionalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional?: Professional | null;
  onSave: (professional: Omit<Professional, 'id' | 'tenant_id' | 'user_id'>) => void;
  onCreateLogin?: (professionalId: string, email: string, password: string, nome: string) => Promise<{ success: boolean; error?: string }>;
}

export function ProfessionalForm({
  open,
  onOpenChange,
  professional,
  onSave,
  onCreateLogin,
}: ProfessionalFormProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(50);
  
  // Login creation fields
  const [createLogin, setCreateLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (professional) {
      setNome(professional.nome);
      setTelefone(professional.telefone || '');
      setEspecialidade(professional.especialidade || '');
      setAtivo(professional.ativo);
      setAvatarUrl(professional.avatar_url);
      setEmail(professional.email || '');
      setCommissionPercent(professional.commission_percent || 50);
      setCreateLogin(false);
      setLoginEmail(professional.email || '');
      setLoginPassword('');
      setPendingFile(null);
    } else {
      setNome('');
      setTelefone('');
      setEspecialidade('');
      setAtivo(true);
      setAvatarUrl(null);
      setEmail('');
      setCommissionPercent(50);
      setCreateLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      setPendingFile(null);
    }
  }, [professional, open]);

  const uploadAvatarToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `professionals/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true });
      
    if (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 2MB.');
        return;
      }

      // Store file for upload on save and show preview
      setPendingFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAvatarUrl = avatarUrl;
    
    // Upload new avatar if pending
    if (pendingFile) {
      setUploadingAvatar(true);
      const uploadedUrl = await uploadAvatarToStorage(pendingFile);
      setUploadingAvatar(false);
      
      if (uploadedUrl) {
        finalAvatarUrl = uploadedUrl;
      } else {
        return; // Don't save if upload failed
      }
    }
    
    // If avatarUrl is a base64 string (legacy), don't save it
    if (finalAvatarUrl && finalAvatarUrl.startsWith('data:')) {
      finalAvatarUrl = null;
    }
    
    onSave({
      nome,
      telefone,
      especialidade,
      ativo,
      avatar_url: finalAvatarUrl,
      email: email || loginEmail,
      commission_percent: commissionPercent,
      schedule: professional?.schedule || null,
    });
    
    onOpenChange(false);
  };

  const handleCreateLoginClick = async () => {
    if (!professional?.id || !onCreateLogin) return;
    
    if (!loginEmail || !loginPassword) {
      alert('Preencha email e senha');
      return;
    }

    if (loginPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setCreatingLogin(true);
    const result = await onCreateLogin(professional.id, loginEmail, loginPassword, professional.nome);
    setCreatingLogin(false);

    if (result.success) {
      setCreateLogin(false);
      onOpenChange(false);
    } else {
      alert(result.error || 'Erro ao criar login');
    }
  };

  const hasExistingLogin = professional?.user_id != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {professional ? 'Editar Profissional' : 'Novo Profissional'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar com Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-2 border-primary/30">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-secondary text-primary">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="w-6 h-6 text-primary" />
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

          {/* Comissão */}
          <div className="space-y-2">
            <Label htmlFor="commission">Comissão (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value))}
              placeholder="Ex: 50"
            />
            <p className="text-xs text-muted-foreground">
              Percentual que o profissional recebe de cada serviço
            </p>
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

          {/* Seção de Login - Apenas para profissionais existentes */}
          {professional && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Acesso ao Sistema</Label>
                </div>

                {hasExistingLogin ? (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">Login criado</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Email: {professional.email}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="createLogin" className="text-sm">
                        Criar acesso para este barbeiro
                      </Label>
                      <Switch
                        id="createLogin"
                        checked={createLogin}
                        onCheckedChange={setCreateLogin}
                      />
                    </div>

                    {createLogin && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="loginEmail">Email de acesso</Label>
                          <Input
                            id="loginEmail"
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loginPassword">Senha</Label>
                          <Input
                            id="loginPassword"
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreateLoginClick}
                          disabled={creatingLogin || !loginEmail || !loginPassword}
                          className="w-full"
                        >
                          {creatingLogin ? 'Criando...' : 'Criar Login do Barbeiro'}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          O barbeiro poderá acessar o sistema para ver seus agendamentos e marcar serviços como realizados.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

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
            <Button type="submit" className="flex-1" disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : professional ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
