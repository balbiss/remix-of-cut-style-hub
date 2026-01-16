import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Copy, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { createPixPaymentViaEdgeFunction, checkPixPaymentStatus } from '@/lib/mercado-pago';
import { sendTextMessage, sendImageMessage } from '@/lib/whatsapp-api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  description: string;
  tenantId: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string; // Número do cliente para WhatsApp
  externalReference?: string;
  onPaymentSuccess?: (paymentId: string) => void;
  // Dados para criar reserva temporária
  professionalId?: string;
  serviceId?: string;
  appointmentDateTime?: Date;
  totalPrice?: number;
}

export function PixPaymentDialog({
  open,
  onOpenChange,
  amount,
  description,
  tenantId,
  payerName,
  payerEmail,
  payerPhone,
  externalReference,
  onPaymentSuccess,
  professionalId,
  serviceId,
  appointmentDateTime,
  totalPrice,
}: PixPaymentDialogProps) {
  console.log('📦 [DEBUG] PixPaymentDialog rendered! Open:', open);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const messageSentRef = useRef<boolean>(false);
  const [temporaryAppointmentId, setTemporaryAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      console.log('🔄 PixPaymentDialog: Dialog aberto, verificando se já existe PIX...');

      // Limpar polling anterior se existir
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Verificar se já existe uma reserva temporária para este horário
      checkExistingReservation();
    } else {
      console.log('🔄 PixPaymentDialog: Dialog fechado, limpando estados...');
      // Limpar polling quando o dialog fechar
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Resetar estados quando fechar
      setQrCode(null);
      setQrCodeBase64(null);
      setPaymentId(null);
      setPaymentStatus('pending');
      setCopied(false);
      setCheckingPayment(false);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Verificar se já existe reserva temporária para este horário
  const checkExistingReservation = async () => {
    if (!professionalId || !serviceId || !appointmentDateTime) {
      // Se não tem dados necessários, gerar PIX normalmente
      generatePixPayment();
      return;
    }

    setLoading(true);

    try {
      // Buscar reserva temporária existente para este horário
      const { data: existingReservation } = await supabase
        .from('appointments')
        .select('id, pix_payment_id, tolerance_expires_at, status')
        .eq('tenant_id', tenantId)
        .eq('professional_id', professionalId)
        .eq('data_hora', appointmentDateTime.toISOString())
        .eq('status', 'pending_payment')
        .eq('cliente_zap', payerPhone || '')
        .maybeSingle();

      if (existingReservation && existingReservation.pix_payment_id) {
        // Verificar se ainda não expirou
        const expiresAt = new Date(existingReservation.tolerance_expires_at || 0);
        const now = new Date();

        if (now <= expiresAt) {
          // Reserva ainda válida, usar PIX existente
          console.log('✅ Reserva temporária encontrada, usando PIX existente:', existingReservation.pix_payment_id);
          setTemporaryAppointmentId(existingReservation.id);
          setPaymentId(existingReservation.pix_payment_id);

          // Buscar dados do PIX do Mercado Pago (ou recriar se necessário)
          // Por enquanto, vamos gerar novo PIX, mas você pode buscar do banco se salvar
          generatePixPayment();
        } else {
          // Reserva expirada, cancelar e gerar novo
          console.log('⏰ Reserva expirada, cancelando e gerando novo PIX...');
          await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', existingReservation.id);

          // Enviar mensagem de expiração
          await sendExpirationMessage();

          // Gerar novo PIX
          generatePixPayment();
        }
      } else {
        // Não existe reserva, gerar novo PIX
        console.log('🆕 Nenhuma reserva encontrada, gerando novo PIX...');
        generatePixPayment();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar reserva:', error);
      // Em caso de erro, gerar novo PIX
      generatePixPayment();
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem quando reserva expirar
  const sendExpirationMessage = async () => {
    if (!payerPhone) return;

    try {
      // Buscar conexão do WhatsApp do tenant
      const { data: connection } = await supabase
        .from('connections')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'online')
        .maybeSingle();

      if (!connection || !connection.api_instance_token) {
        console.log('WhatsApp não conectado, mensagem de expiração não enviada');
        return;
      }

      // Buscar nome da barbearia
      const { data: tenant } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', tenantId)
        .single();

      const barbershopName = tenant?.nome || 'Barbearia';

      const message = `*${barbershopName}*\n\n` +
        `Olá ${payerName || 'Cliente'}! 👋\n\n` +
        `O tempo para realizar o pagamento PIX do seu agendamento *expirou* (15 minutos).\n\n` +
        `O horário foi liberado e você pode criar um novo agendamento quando quiser.\n\n` +
        `Obrigado pela preferência! 🙏`;

      await sendTextMessage(
        connection.instance_name,
        payerPhone,
        message,
        connection.api_instance_token
      );

      console.log('✅ Mensagem de expiração enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de expiração:', error);
    }
  };

  const generatePixPayment = async () => {
    console.log('⚙️ [DEBUG] generatePixPayment called');
    console.log('🔄 generatePixPayment: Iniciando...', { amount, description, tenantId });
    setLoading(true);
    setPaymentStatus('pending');
    try {
      console.log('🔄 generatePixPayment: Chamando Edge Function...');
      const result = await createPixPaymentViaEdgeFunction(
        {
          amount,
          description,
          payerName,
          payerEmail,
          externalReference,
        },
        tenantId
      );

      console.log('🔄 generatePixPayment: Resultado recebido:', result);

      if (result.success && result.payment) {
        console.log('✅ generatePixPayment: PIX gerado com sucesso!', result.payment);

        // Verificar se realmente temos dados do PIX
        if (!result.payment.id) {
          throw new Error('ID do pagamento não encontrado na resposta');
        }

        // Separar código PIX copy-paste e imagem base64
        const pixCopyPasteCode =
          result.payment.qr_code ||
          result.payment.point_of_interaction?.transaction_data?.qr_code ||
          null;

        const qrCodeImageBase64 =
          result.payment.qr_code_base64 ||
          result.payment.point_of_interaction?.transaction_data?.qr_code_base64 ||
          null;

        // Se temos imagem base64, usar ela (preferencial)
        if (qrCodeImageBase64) {
          // Se já está com prefixo data:image, usar direto
          // Se não, adicionar prefixo
          const base64Image = qrCodeImageBase64.startsWith('data:image')
            ? qrCodeImageBase64
            : `data:image/png;base64,${qrCodeImageBase64}`;
          setQrCodeBase64(base64Image);
          // Também salvar o código copy-paste se disponível
          if (pixCopyPasteCode) {
            setQrCode(pixCopyPasteCode);
          }
          setPaymentId(result.payment.id);
        }
        // Se não temos imagem, mas temos código copy-paste, gerar QR Code
        else if (pixCopyPasteCode) {
          // Verificar se o código não é muito longo para QR Code
          if (pixCopyPasteCode.length > 2000) {
            throw new Error('Código PIX muito longo para gerar QR Code. Use a imagem base64.');
          }
          setQrCode(pixCopyPasteCode);
          setQrCodeBase64(null);
          setPaymentId(result.payment.id);
        } else {
          throw new Error('QR Code não encontrado na resposta');
        }

        // Criar agendamento temporário (reserva) com expiração de 15 minutos
        // Date.now() retorna o timestamp em UTC, e toISOString() converte para string UTC
        // O Supabase armazena em UTC, então está tudo correto
        if (professionalId && serviceId && appointmentDateTime) {
          const toleranceExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos a partir de agora (horário local do navegador)

          // Log para debug (mostrar horário de Brasília)
          const nowBRT = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const expiresAtBRT = toleranceExpiresAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          console.log(`🕐 Horário atual (Brasília): ${nowBRT}`);
          console.log(`⏰ Expira em (Brasília): ${expiresAtBRT} (15 minutos)`);

          const { data: tempAppointment, error: tempError } = await supabase
            .from('appointments')
            .insert({
              tenant_id: tenantId,
              professional_id: professionalId,
              service_id: serviceId,
              data_hora: appointmentDateTime.toISOString(),
              cliente_nome: payerName || 'Cliente',
              cliente_zap: payerPhone || '',
              status: 'pending_payment',
              payment_method: 'online',
              prepaid_amount: amount,
              tolerance_expires_at: toleranceExpiresAt.toISOString(),
              pix_payment_id: result.payment.id,
            })
            .select('id')
            .single();

          if (tempError) {
            console.error('❌ Erro ao criar reserva temporária:', tempError);
            console.error('❌ Detalhes do erro:', JSON.stringify(tempError, null, 2));
          } else if (tempAppointment) {
            setTemporaryAppointmentId(tempAppointment.id);
            console.log('✅ Reserva temporária criada:', {
              id: tempAppointment.id,
              professionalId,
              serviceId,
              dataHora: appointmentDateTime.toISOString(),
              expiresAt: toleranceExpiresAt.toISOString(),
            });
          } else {
            console.warn('⚠️ Agendamento temporário não foi criado (sem erro, mas sem dados)');
          }
        }

        // Enviar mensagem no WhatsApp após gerar o PIX (apenas uma vez)
        if (pixCopyPasteCode && payerPhone && !messageSentRef.current) {
          messageSentRef.current = true; // Marcar como enviado
          await sendWhatsAppMessage(pixCopyPasteCode);
        }

        // Iniciar verificação automática do status do pagamento
        if (result.payment.id) {
          startPaymentPolling(result.payment.id);
        }
      } else {
        throw new Error(result.error || 'Erro ao gerar pagamento PIX');
      }
    } catch (error: any) {
      console.error('❌ Erro ao gerar PIX:', error);
      console.error('❌ Stack trace:', error.stack);

      // Mensagem de erro mais específica
      let errorMessage = error.message || 'Erro ao gerar código PIX. Tente novamente.';

      if (error.message?.includes('JWT') || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Edge Function não encontrada ou não autorizada. A função create-pix-payment precisa ser deployada no Supabase. Verifique o console para mais detalhes.';
      }

      if (error.message?.includes('404') || error.message?.includes('não encontrada')) {
        errorMessage = 'Edge Function não encontrada. Certifique-se de que a função create-pix-payment foi deployada no Supabase.';
      }

      // Não fechar o dialog em caso de erro, deixar o usuário tentar novamente
      toast.error(errorMessage);
      setPaymentStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppMessage = async (pixCode: string) => {
    if (!payerPhone || !pixCode) return;

    try {
      // Buscar conexão do WhatsApp do tenant
      const { data: connection, error: connError } = await supabase
        .from('connections')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'online')
        .maybeSingle();

      if (connError) {
        console.error('❌ Erro ao buscar conexão WhatsApp:', connError);
        console.log('💡 Dica: Verifique se a tabela "connections" tem política RLS para acesso público (anon).');
        return;
      }

      if (!connection) {
        console.warn('⚠️ Nenhuma conexão WhatsApp ativa encontrada para o tenant:', tenantId);
        return;
      }

      if (!connection.api_instance_token) {
        console.warn('⚠️ Conexão WhatsApp encontrada, mas falta o token da API (api_instance_token).', connection);
        return;
      }

      console.log('✅ Conexão WhatsApp encontrada ativa:', connection.instance_name);

      // Buscar nome da barbearia
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', tenantId)
        .single();

      const barbershopName = tenant?.nome || 'Barbearia';

      // Formatar mensagem
      const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(price);
      };

      // Primeira mensagem: Informações do agendamento
      const message1 = `*${barbershopName}*\n\n` +
        `Olá ${payerName || 'Cliente'}! 👋\n\n` +
        `Seu agendamento está *pendente de pagamento*.\n\n` +
        `*Valor:* ${formatPrice(amount)}\n` +
        `*Descrição:* ${description}\n\n` +
        `Para confirmar seu agendamento, realize o pagamento PIX de *50% do valor* (${formatPrice(amount)}).\n\n` +
        `O código abaixo é o PIX copiar e colar. Após o pagamento, seu agendamento será confirmado automaticamente. ✅\n\n` +
        `Obrigado pela preferência! 🙏`;

      // Segunda mensagem: Código PIX separado (fácil de copiar) - apenas o código
      const message2 = `${pixCode}`;

      // Enviar QR Code com a mensagem informativa (se tivermos imagem base64)
      let result1;
      if (qrCodeBase64) {
        console.log('📤 Enviando QR Code como imagem...');
        result1 = await sendImageMessage(
          connection.instance_name,
          payerPhone,
          qrCodeBase64,
          message1,
          connection.api_instance_token
        );
      } else {
        console.log('📤 Enviando apenas texto (QR Code imagem não disponível)');
        result1 = await sendTextMessage(
          connection.instance_name,
          payerPhone,
          message1,
          connection.api_instance_token
        );
      }

      if (result1.success) {
        console.log('✅ Mensagem 1 (agendamento/imagem) enviada com sucesso');

        // Aguardar 1 segundo antes de enviar a segunda mensagem
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enviar segunda mensagem (código PIX sozinho para fácil cópia)
        const result2 = await sendTextMessage(
          connection.instance_name,
          payerPhone,
          message2,
          connection.api_instance_token
        );

        if (result2.success) {
          console.log('✅ Mensagem 2 (código PIX) enviada com sucesso');
          toast.success('Mensagens enviadas no WhatsApp!');
        } else {
          console.error('❌ Erro ao enviar mensagem 2 (código PIX):', result2.error);
          toast.success('Mensagem enviada (código PIX pode não ter sido enviado)');
        }
      } else {
        console.error('❌ Erro ao enviar mensagem 1 (informações):', result1.error);
        // Não mostrar erro para o usuário, é opcional
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
      // Não mostrar erro para o usuário, é opcional
    }
  };

  const startPaymentPolling = async (id: string) => {
    // Limpar polling anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Verificar status a cada 5 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // PRIMEIRO: Verificar se o agendamento temporário ainda é válido (não expirou)
        if (temporaryAppointmentId) {
          const { data: tempAppt } = await supabase
            .from('appointments')
            .select('tolerance_expires_at, status')
            .eq('id', temporaryAppointmentId)
            .single();

          if (tempAppt) {
            const expiresAt = new Date(tempAppt.tolerance_expires_at || 0);
            const now = new Date();

            if (now > expiresAt && tempAppt.status === 'pending_payment') {
              // Agendamento expirado - cancelar e enviar mensagem
              console.log('⏰ Reserva expirada (15 minutos), cancelando...');

              await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', temporaryAppointmentId);

              // Enviar mensagem de expiração
              await sendExpirationMessage();

              setPaymentStatus('rejected');
              toast.error('Tempo de pagamento expirado (15 minutos). O horário foi liberado.');

              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              // Fechar dialog após alguns segundos
              setTimeout(() => {
                onOpenChange(false);
              }, 3000);

              return;
            }

            if (tempAppt.status !== 'pending_payment') {
              // Agendamento já foi processado (confirmado ou cancelado)
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              return;
            }
          }
        }

        // SEGUNDO: Verificar status do pagamento no Mercado Pago
        const result = await checkPixPaymentStatus(id, tenantId);

        if (result.success && result.status) {
          console.log('📊 Status do pagamento:', result.status);

          if (result.status === 'approved') {
            setPaymentStatus('approved');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            toast.success('✅ Pagamento confirmado! Seu agendamento está sendo processado...');
            // Aguardar um pouco antes de chamar o callback
            setTimeout(() => {
              onPaymentSuccess?.(id);
            }, 1000);
          } else if (result.status === 'rejected' || result.status === 'cancelled') {
            setPaymentStatus('rejected');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            toast.error('❌ Pagamento foi rejeitado ou cancelado. Verifique os dados e tente novamente.', {
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status do pagamento:', error);
      }
    }, 5000) as unknown as number; // Verificar a cada 5 segundos
  };

  const handleCheckPayment = async () => {
    if (!paymentId) return;

    setCheckingPayment(true);
    try {
      const result = await checkPixPaymentStatus(paymentId, tenantId);

      if (result.success && result.status === 'approved') {
        setPaymentStatus('approved');
        toast.success('✅ Pagamento confirmado! Seu agendamento está sendo processado...');
        onPaymentSuccess?.(paymentId);
      } else if (result.success && result.status === 'pending') {
        toast.info('⏳ Pagamento ainda não foi confirmado. Aguarde alguns instantes e tente novamente.', {
          duration: 5000,
        });
      } else if (result.success && result.status === 'rejected') {
        toast.error('❌ Pagamento foi rejeitado. Verifique os dados e tente novamente.', {
          duration: 5000,
        });
      } else if (result.success && result.status) {
        // Outros status
        const statusMessages: Record<string, string> = {
          'in_process': '🔄 Pagamento está sendo processado. Aguarde...',
          'cancelled': '❌ Pagamento foi cancelado. Tente novamente.',
          'refunded': '↩️ Pagamento foi estornado. Entre em contato com o suporte.',
        };
        const message = statusMessages[result.status] || `Status: ${result.status}`;
        toast.info(message, { duration: 5000 });
      } else {
        // Erro na verificação
        let errorMessage = 'Não foi possível verificar o pagamento.';

        if (result.error) {
          if (result.error.includes('authorization') || result.error.includes('Missing')) {
            errorMessage = 'Erro de conexão. Por favor, recarregue a página e tente novamente.';
          } else if (result.error.includes('404') || result.error.includes('não encontrado')) {
            errorMessage = 'Pagamento não encontrado. Verifique se o código PIX está correto.';
          } else if (result.error.includes('timeout') || result.error.includes('network')) {
            errorMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = 'Não foi possível verificar o pagamento. Tente novamente em alguns instantes.';
          }
        }

        toast.error(errorMessage, {
          duration: 6000,
          description: 'Se o problema persistir, entre em contato com o suporte.',
        });
      }
    } catch (error: any) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar pagamento. Tente novamente em alguns instantes.', {
        duration: 5000,
        description: 'Se o problema persistir, recarregue a página.',
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCopyCode = async () => {
    // Copiar o código PIX copy-paste (não o base64)
    const codeToCopy = qrCode || '';
    if (codeToCopy) {
      try {
        await navigator.clipboard.writeText(codeToCopy);
        setCopied(true);
        toast.success('Código PIX copiado!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Erro ao copiar código');
      }
    } else {
      toast.error('Código PIX não disponível para copiar');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Pagamento PIX</DialogTitle>
          <DialogDescription className="text-center">
            Escaneie o QR Code ou copie o código para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
            <p className="text-3xl font-bold gold-text">{formatPrice(amount)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              50% do valor total do agendamento
            </p>
          </div>

          {/* QR Code */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <p className="text-sm text-muted-foreground">Gerando código PIX...</p>
            </div>
          ) : qrCodeBase64 || qrCode ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-3 rounded-lg border-2 border-gold/20 shadow-sm">
                {qrCodeBase64 ? (
                  // Se temos imagem base64, usar ela
                  <img
                    src={qrCodeBase64}
                    alt="QR Code PIX"
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
                  />
                ) : qrCode ? (
                  // Se temos código copy-paste, gerar QR Code
                  <QRCodeSVG
                    value={qrCode}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="sm:w-[256px] sm:h-[256px]"
                  />
                ) : null}
              </div>

              {/* Copiar código */}
              <Button
                variant="outline"
                onClick={handleCopyCode}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Código copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar código PIX
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-sm text-muted-foreground text-center">
                Erro ao gerar código PIX. Tente novamente.
              </p>
              <Button
                variant="outline"
                onClick={generatePixPayment}
                className="w-full"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Aviso de tempo */}
          {paymentStatus === 'pending' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    ⏰ Pagamento deve ser realizado em até 15 minutos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Após esse tempo, o horário será liberado e você receberá uma notificação. Você poderá criar um novo agendamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold">Como pagar:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escaneie o QR Code ou cole o código PIX</li>
              <li>Confirme o pagamento</li>
              <li>Seu agendamento será confirmado automaticamente</li>
            </ol>
          </div>

          {/* Status do pagamento */}
          {paymentStatus === 'approved' && (
            <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-500">
                Pagamento confirmado! Criando agendamento...
              </p>
            </div>
          )}

          {paymentStatus === 'pending' && paymentId && (
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <p className="text-sm font-medium text-amber-600">
                  Aguardando confirmação...
                </p>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center line-clamp-2 sm:line-clamp-none">
                Verificando automaticamente a cada 5 segundos.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={paymentStatus === 'approved'}
            >
              Fechar
            </Button>
            {paymentId && paymentStatus !== 'approved' && (
              <Button
                variant="gold"
                onClick={handleCheckPayment}
                disabled={checkingPayment}
                className="flex-1"
              >
                {checkingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Já paguei'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

