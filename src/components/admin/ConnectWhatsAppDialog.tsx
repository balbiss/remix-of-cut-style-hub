import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, CheckCircle, AlertCircle, QrCode, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createWhatsAppInstance, getInstanceQRCode, getInstanceStatus, generatePairCode } from '@/lib/whatsapp-api';
import { QRCodeSVG } from 'qrcode.react';

interface ConnectWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConnectWhatsAppDialog({ open, onOpenChange, onSuccess }: ConnectWhatsAppDialogProps) {
  const { tenant, refreshTenant } = useAuth();
  const [instanceName, setInstanceName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'instanceCreated' | 'qrcode' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [instanceToken, setInstanceToken] = useState<string | null>(null);
  const [createdInstanceName, setCreatedInstanceName] = useState<string>('');
  const [loadingQR, setLoadingQR] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'qrcode' | 'phone' | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    return numbers;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Formato: 559192724395 (código do país + DDD + número)
    // Deve ter entre 12 e 15 dígitos
    return phone.length >= 12 && phone.length <= 15 && /^\d+$/.test(phone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleCreateInstance = async () => {
    if (!tenant) {
      toast.error('Tenant não encontrado.');
      return;
    }

    if (!instanceName.trim()) {
      setErrorMessage('Por favor, informe o nome da instância.');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setErrorMessage('Número inválido. Use o formato: 559192724395 (código do país + DDD + número)');
      return;
    }

    setIsCreating(true);
    setStep('creating');
    setErrorMessage('');

    try {
      // Criar instância na API do WhatsApp
      const apiResult = await createWhatsAppInstance({
        instanceName: instanceName.trim(),
        phoneNumber: phoneNumber,
        qrcode: true,
      });

      if (!apiResult.success || !apiResult.instance) {
        throw new Error(apiResult.error || 'Erro ao criar instância na API');
      }

      // Criar registro na tabela connections (status 'offline' - aguardando conexão)
      // A constraint só permite: 'online', 'offline', 'connecting', 'disconnected'
      const { data: connection, error: connError } = await supabase
        .from('connections')
        .insert({
          tenant_id: tenant.id,
          instance_name: instanceName.trim(),
          phone_number: phoneNumber,
          api_instance_token: apiResult.instance.token,
          status: 'offline', // Status inicial: instância criada mas não conectada
        })
        .select()
        .single();

      if (connError) throw connError;

      setConnectionId(connection.id);
      setInstanceToken(apiResult.instance.token);
      setCreatedInstanceName(instanceName.trim());

      // Atualizar tenant com referência à conexão
      await supabase
        .from('tenants')
        .update({
          evolution_api_url: `${import.meta.env.VITE_WHATSAPP_API_URL || 'https://weeb.inoovaweb.com.br'}`,
          evolution_api_token: apiResult.instance.token,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenant.id);

      // Atualizar tenant no contexto
      await refreshTenant();

      setStep('instanceCreated');
      setIsCreating(false);

    } catch (error: any) {
      console.error('Error creating WhatsApp instance:', error);
      setStep('error');
      setErrorMessage(error.message || 'Erro ao criar instância. Tente novamente.');
      
      toast.error(error.message || 'Não foi possível criar a instância.');
      setIsCreating(false);
    }
  };

  const handleGeneratePairCode = async () => {
    if (!instanceToken || !phoneNumber) {
      toast.error('Erro: dados não encontrados.');
      return;
    }

    setGeneratingCode(true);
    setErrorMessage('');

    try {
      const result = await generatePairCode(instanceToken, phoneNumber);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar código de pareamento');
      }

      setPairCode(result.code);
      toast.success('Código gerado com sucesso!');
      
      // Iniciar verificação automática de status
      // Após inserir o código no WhatsApp, a conexão será estabelecida automaticamente
      startStatusCheck(createdInstanceName, instanceToken);
    } catch (error: any) {
      console.error('Error generating pair code:', error);
      setErrorMessage(error.message || 'Erro ao gerar código.');
      toast.error(error.message || 'Erro ao gerar código de pareamento.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleGenerateQRCode = async () => {
    if (!instanceToken || !createdInstanceName) {
      toast.error('Erro: dados da instância não encontrados.');
      return;
    }

    setLoadingQR(true);
    try {
      // Obter QR Code usando o token do usuário
      const qrcodeData = await getInstanceQRCode(createdInstanceName, instanceToken);
      
      if (!qrcodeData) {
        throw new Error('Não foi possível obter o QR Code. Tente novamente.');
      }

      // Atualizar conexão com QR code
      if (connectionId) {
        await supabase
          .from('connections')
          .update({
            qrcode: qrcodeData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connectionId);
      }

      setQrcode(qrcodeData);
      setStep('qrcode');
      
      // Iniciar verificação de status
      startStatusCheck(createdInstanceName, instanceToken);
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(error.message || 'Erro ao gerar QR Code.');
    } finally {
      setLoadingQR(false);
    }
  };

  const startStatusCheck = async (instanceName: string, apiToken: string) => {
    setCheckingStatus(true);
    const maxAttempts = 60; // 5 minutos (5 segundos por tentativa)
    let attempts = 0;
    let checkInterval: NodeJS.Timeout | null = null;

    checkInterval = setInterval(async () => {
      attempts++;
      
      console.log(`[${new Date().toLocaleTimeString()}] Verificando status (tentativa ${attempts}/${maxAttempts})...`);
      
      try {
        const status = await getInstanceStatus(instanceName, apiToken);
        
        console.log(`[${new Date().toLocaleTimeString()}] Status retornado:`, status);
        
        if (status.status === 'online') {
          if (checkInterval) clearInterval(checkInterval);
          setCheckingStatus(false);
          
          console.log('✅ Conexão detectada! Atualizando banco de dados...');
          
          // Atualizar conexão no banco
          if (connectionId) {
            const { error: updateError } = await supabase
              .from('connections')
              .update({
                status: 'online',
                last_connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', connectionId);

            if (updateError) {
              console.error('❌ Erro ao atualizar conexão:', updateError);
            } else {
              console.log('✅ Conexão atualizada no banco com sucesso');
            }
          }

          // Atualizar tenant também
          await refreshTenant();
          
          setStep('success');
          
          toast.success('WhatsApp conectado com sucesso!');

          // Resetar formulário e fechar modal após 2 segundos
          setTimeout(() => {
            setInstanceName('');
            setPhoneNumber('');
            setStep('form');
            setQrcode(null);
            setConnectionId(null);
            setInstanceToken(null);
            setCreatedInstanceName('');
            setConnectionMethod(null);
            setPairCode(null);
            onOpenChange(false);
            onSuccess?.();
          }, 2000);
        } else if (attempts >= maxAttempts) {
          if (checkInterval) clearInterval(checkInterval);
          setCheckingStatus(false);
          toast.error('Tempo limite excedido. A conexão pode não ter sido estabelecida.');
          setStep('error');
          setErrorMessage('Tempo limite excedido. Por favor, verifique se inseriu o código corretamente no WhatsApp.');
        }
      } catch (error) {
        console.error('❌ Error checking status:', error);
        if (attempts >= maxAttempts) {
          if (checkInterval) clearInterval(checkInterval);
          setCheckingStatus(false);
          toast.error('Erro ao verificar status da conexão.');
        }
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  const handleClose = () => {
    if (!isCreating && !loadingQR && !generatingCode) {
      setInstanceName('');
      setPhoneNumber('');
      setStep('form');
      setErrorMessage('');
      setQrcode(null);
      setConnectionId(null);
      setInstanceToken(null);
      setCreatedInstanceName('');
      setConnectionMethod(null);
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
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Crie uma nova instância do WhatsApp para enviar mensagens automáticas
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Nome da Instância</Label>
              <Input
                id="instance-name"
                placeholder="Ex: Minha Barbearia"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Nome identificador para sua instância do WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-number">Número do WhatsApp</Label>
              <Input
                id="phone-number"
                placeholder="559192724395"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={isCreating}
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                Formato: código do país + DDD + número (ex: 559192724395)
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateInstance}
                disabled={isCreating || !instanceName.trim() || !phoneNumber}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Instância'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'creating' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="font-medium">Criando instância...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aguarde enquanto configuramos sua instância do WhatsApp
              </p>
            </div>
          </div>
        )}

        {step === 'instanceCreated' && !connectionMethod && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium">Instância criada com sucesso!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Instância: {createdInstanceName}
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium">Escolha o método de conexão:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConnectionMethod('qrcode')}
                  className="h-auto py-4 flex flex-col items-center gap-2"
                >
                  <QrCode className="w-6 h-6" />
                  <span>QR Code</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConnectionMethod('phone')}
                  className="h-auto py-4 flex flex-col items-center gap-2"
                >
                  <Smartphone className="w-6 h-6" />
                  <span>Código</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full mt-2"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        {step === 'instanceCreated' && connectionMethod === 'qrcode' && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium">Gerar QR Code</p>
              <p className="text-sm text-muted-foreground">
                Clique no botão abaixo para gerar o QR Code e escanear com seu WhatsApp
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setConnectionMethod(null)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
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
                    Gerar QR Code
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'instanceCreated' && connectionMethod === 'phone' && !pairCode && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium">Conectar via Código</p>
              <p className="text-sm text-muted-foreground">
                Clique no botão para gerar um código que você irá inserir no WhatsApp
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConnectionMethod(null);
                  setPhoneCode('');
                  setErrorMessage('');
                  setPairCode(null);
                }}
                className="flex-1"
                disabled={generatingCode}
              >
                Voltar
              </Button>
              <Button
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
                    Gerar Código
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'instanceCreated' && connectionMethod === 'phone' && pairCode && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium">Código de Pareamento</p>
              <p className="text-sm text-muted-foreground">
                Insira este código no WhatsApp no número {phoneNumber}
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
              
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMessage}</span>
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
                  onClick={() => {
                    setPairCode(null);
                    setErrorMessage('');
                  }}
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

        {step === 'qrcode' && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium">Escaneie o QR Code</p>
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp no seu celular e escaneie este código para conectar
              </p>
            </div>

            {qrcode && (
              <>
                {qrcode.startsWith('data:image') ? (
                  // Se for base64 de imagem, mostrar imagem diretamente
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={qrcode} alt="QR Code" className="w-64 h-64" />
                  </div>
                ) : qrcode.startsWith('blob:') || qrcode.startsWith('http') && qrcode.includes('.png') || qrcode.includes('.jpg') ? (
                  // Se for URL de imagem direta
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={qrcode} alt="QR Code" className="w-64 h-64" />
                  </div>
                ) : (
                  // Se for string (texto do QR code), renderizar como QR code SVG
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={qrcode}
                      size={256}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                )}
              </>
            )}

            {checkingStatus && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aguardando conexão...</span>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
              disabled={checkingStatus}
            >
              Cancelar
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium">Instância criada com sucesso!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seu WhatsApp está conectado e pronto para uso
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">Erro ao criar instância</p>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage || 'Não foi possível criar a instância. Tente novamente.'}
              </p>
            </div>
            <Button onClick={() => setStep('form')} variant="outline" className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

