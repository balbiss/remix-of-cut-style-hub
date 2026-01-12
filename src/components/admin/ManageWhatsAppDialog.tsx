import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, CheckCircle, AlertCircle, QrCode, Smartphone, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getInstanceQRCode, getInstanceStatus, generatePairCode, deleteInstance } from '@/lib/whatsapp-api';
import { QRCodeSVG } from 'qrcode.react';

interface ManageWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: any;
  onConnectionUpdate: () => void;
}

export function ManageWhatsAppDialog({ 
  open, 
  onOpenChange, 
  connection,
  onConnectionUpdate 
}: ManageWhatsAppDialogProps) {
  const { tenant, refreshTenant } = useAuth();
  const [step, setStep] = useState<'manage' | 'qrcode' | 'phoneCode' | 'deleting'>('manage');
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar status ao abrir o modal
  useEffect(() => {
    if (open && connection) {
      checkStatus();
    }
  }, [open, connection]);

  const checkStatus = async () => {
    if (!connection?.api_instance_token || !connection?.instance_name) return;

    setCheckingStatus(true);
    try {
      const status = await getInstanceStatus(connection.instance_name, connection.api_instance_token);
      setCurrentStatus(status.status);
      
      // Atualizar no banco se mudou
      if (status.status !== connection.status) {
        await supabase
          .from('connections')
          .update({
            status: status.status === 'online' ? 'online' : status.status === 'offline' ? 'offline' : 'connecting',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);
        
        onConnectionUpdate();
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleGenerateQRCode = async () => {
    if (!connection?.api_instance_token || !connection?.instance_name) {
      toast.error('Erro: dados da instância não encontrados.');
      return;
    }

    setLoadingQR(true);
    try {
      const qrcodeData = await getInstanceQRCode(connection.instance_name, connection.api_instance_token);
      
      if (!qrcodeData) {
        throw new Error('Não foi possível obter o QR Code. Tente novamente.');
      }

      // Atualizar QR code no banco
      await supabase
        .from('connections')
        .update({
          qrcode: qrcodeData,
          status: 'connecting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      setQrcode(qrcodeData);
      setStep('qrcode');
      startStatusCheck();
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(error.message || 'Erro ao gerar QR Code.');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleGeneratePairCode = async () => {
    if (!connection?.api_instance_token || !connection?.instance_name || !connection?.phone_number) {
      toast.error('Erro: dados da instância não encontrados.');
      return;
    }

    setGeneratingCode(true);
    try {
      const result = await generatePairCode(connection.api_instance_token, connection.phone_number);

      if (!result.success || !result.code) {
        throw new Error(result.error || 'Erro ao gerar código de pareamento');
      }

      setPairCode(result.code);
      toast.success('Código gerado com sucesso!');
      
      // Atualizar status para connecting
      await supabase
        .from('connections')
        .update({
          status: 'connecting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      setStep('phoneCode');
      startStatusCheck();
    } catch (error: any) {
      console.error('Error generating pair code:', error);
      toast.error(error.message || 'Erro ao gerar código de pareamento.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const startStatusCheck = () => {
    if (!connection?.id || !connection?.api_instance_token || !connection?.instance_name) return;

    setCheckingStatus(true);
    const maxAttempts = 60; // 5 minutos
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        // Verificar status na API
        const status = await getInstanceStatus(connection.instance_name, connection.api_instance_token);
        
        console.log(`Verificando status (tentativa ${attempts}/${maxAttempts}):`, status);
        
        if (status.status === 'online') {
          clearInterval(interval);
          setCheckingStatus(false);
          
          // Atualizar no banco
          const { error: updateError } = await supabase
            .from('connections')
            .update({
              status: 'online',
              last_connected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);

          if (!updateError) {
            onConnectionUpdate();
            toast.success('WhatsApp conectado com sucesso!');
            setStep('manage');
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setCheckingStatus(false);
          toast.error('Tempo limite excedido. Verifique se inseriu o código corretamente.');
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setCheckingStatus(false);
        }
      }
    }, 5000);

    // Limpar após 5 minutos
    setTimeout(() => {
      clearInterval(interval);
      setCheckingStatus(false);
    }, 5 * 60 * 1000);
  };

  const handleDeleteInstance = async () => {
    if (!connection?.api_instance_token || !connection?.instance_name) {
      toast.error('Erro: dados da instância não encontrados.');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar esta instância? Esta ação não pode ser desfeita e irá remover a instância tanto do sistema quanto da API.')) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🗑️ Iniciando deleção da instância:', {
        instanceName: connection.instance_name,
        hasToken: !!connection.api_instance_token,
        connectionId: connection.id,
      });

      // PRIMEIRO: Deletar da API
      console.log('1️⃣ Deletando da API WUZAPI...');
      const result = await deleteInstance(connection.instance_name, connection.api_instance_token);

      console.log('📋 Resultado da deleção da API:', result);

      // Só continuar se a deleção da API foi bem-sucedida
      // Se retornou 404 (não encontrado), ainda consideramos sucesso pois já foi deletado
      if (!result.success) {
        // Se o erro for "not found", ainda podemos remover do banco (já foi deletado)
        if (result.error?.toLowerCase().includes('not found') || 
            result.error?.toLowerCase().includes('não encontrado') ||
            result.error?.toLowerCase().includes('user not found')) {
          console.log('⚠️ Instância não encontrada na API (pode já ter sido deletada), continuando...');
        } else {
          // Se foi outro erro, não remover do banco
          throw new Error(result.error || 'Erro ao deletar instância da API. A instância não foi removida da API.');
        }
      } else {
        console.log('✅ Instância deletada com sucesso da API');
      }

      // SEGUNDO: Remover do banco de dados local (só se a API foi deletada ou não existe)
      console.log('2️⃣ Removendo do banco de dados local...');
      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('id', connection.id);

      if (deleteError) {
        console.error('❌ Erro ao remover do banco:', deleteError);
        throw new Error('Erro ao remover conexão do banco de dados');
      }
      console.log('✅ Removido do banco de dados local');

      // TERCEIRO: Limpar dados do tenant
      console.log('3️⃣ Limpando dados do tenant...');
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          evolution_api_url: null,
          evolution_api_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenant?.id);

      if (updateError) {
        console.error('⚠️ Erro ao limpar dados do tenant (não crítico):', updateError);
        // Não é crítico, continuar
      } else {
        console.log('✅ Dados do tenant limpos');
      }

      await refreshTenant();
      onConnectionUpdate();
      toast.success('Instância deletada com sucesso do sistema e da API!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Error deleting instance:', error);
      toast.error(error.message || 'Erro ao deletar instância. Verifique o console para mais detalhes.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!loadingQR && !generatingCode && !isDeleting) {
      setStep('manage');
      setQrcode(null);
      setPairCode(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            Gerenciar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Gerencie sua instância do WhatsApp: gere QR Code, conecte via código ou delete a instância
          </DialogDescription>
        </DialogHeader>

        {step === 'manage' && (
          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                currentStatus === 'online' || connection?.status === 'online'
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : currentStatus === 'connecting' || connection?.status === 'connecting'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-muted border-border'
              }`}>
                {currentStatus === 'online' || connection?.status === 'online' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : currentStatus === 'connecting' || connection?.status === 'connecting' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {currentStatus === 'online' || connection?.status === 'online' ? 'WhatsApp Conectado' : 
                     currentStatus === 'connecting' || connection?.status === 'connecting' ? 'Conectando...' : 
                     'Instância Criada (Aguardando Conexão)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Instância: {connection?.instance_name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkStatus}
                  disabled={checkingStatus}
                >
                  <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Só mostrar botões de conexão se não estiver conectado */}
              {(currentStatus !== 'online' && connection?.status !== 'online') && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateQRCode}
                    disabled={loadingQR}
                    className="flex-1"
                  >
                    {loadingQR ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Code
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGeneratePairCode}
                    disabled={generatingCode}
                    className="flex-1"
                  >
                    {generatingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Código
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Button
                variant="destructive"
                onClick={handleDeleteInstance}
                disabled={isDeleting}
                className="w-full"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Instância
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'qrcode' && qrcode && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium">Escaneie o QR Code</p>
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp no seu celular e escaneie este código para conectar
              </p>
            </div>

            {qrcode.startsWith('data:image') ? (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrcode} alt="QR Code" className="w-64 h-64" />
              </div>
            ) : qrcode.startsWith('blob:') || (qrcode.startsWith('http') && (qrcode.includes('.png') || qrcode.includes('.jpg'))) ? (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrcode} alt="QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={qrcode}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            )}

            {checkingStatus && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aguardando conexão...</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('manage')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        {step === 'phoneCode' && pairCode && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium">Código de Pareamento</p>
              <p className="text-sm text-muted-foreground">
                Insira este código no WhatsApp no número {connection?.phone_number}
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Código para WhatsApp</Label>
                <div className="flex justify-center">
                  <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 min-w-[200px]">
                    <p className="text-4xl font-bold text-primary tracking-widest text-center">
                      {pairCode}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Digite este código no WhatsApp quando solicitado. A conexão será estabelecida automaticamente.
                </p>
              </div>

              {checkingStatus && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aguardando conexão...</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('manage')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

