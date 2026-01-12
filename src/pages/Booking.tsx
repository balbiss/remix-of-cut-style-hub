import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicLogo } from '@/components/DynamicLogo';
import { StepIndicator } from '@/components/booking/StepIndicator';
import { ProfessionalSelect } from '@/components/booking/ProfessionalSelect';
import { ServiceSelect } from '@/components/booking/ServiceSelect';
import { DateTimeSelect } from '@/components/booking/DateTimeSelect';
import { ClientInfoForm } from '@/components/booking/ClientInfoForm';
import { PaymentStep } from '@/components/booking/PaymentStep';
import { SuccessScreen } from '@/components/booking/SuccessScreen';
import { PixPaymentDialog } from '@/components/booking/PixPaymentDialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Sparkles, Loader2, Star } from 'lucide-react';
import { sendTextMessage, checkWhatsAppUser } from '@/lib/whatsapp-api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper function to extract video ID and generate embed URL
const extractVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Limpar a URL
  const cleanUrl = url.trim();
  
  // YouTube - múltiplos formatos (ordem importa - mais específicos primeiro)
  const youtubePatterns = [
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/, // youtube.com/v/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/, // youtu.be/VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/, // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/, // youtube.com/...?v=VIDEO_ID ou &v=VIDEO_ID
    /^([a-zA-Z0-9_-]{11})$/, // Apenas o ID (11 caracteres)
  ];
  
  for (const pattern of youtubePatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  // Vimeo
  const vimeoPatterns = [
    /(?:player\.vimeo\.com\/video\/)(\d+)/, // player.vimeo.com/video/123456
    /(?:vimeo\.com\/)(\d+)/, // vimeo.com/123456
    /^(\d+)$/, // Apenas o ID numérico
  ];
  
  for (const pattern of vimeoPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

const getVideoEmbedUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  const videoId = extractVideoId(url);
  if (!videoId) {
    console.warn('Não foi possível extrair o ID do vídeo da URL:', url);
    return null;
  }

  // Detectar se é YouTube ou Vimeo
  const cleanUrl = url.trim().toLowerCase();
  const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || videoId.length === 11;
  const isVimeo = cleanUrl.includes('vimeo.com') || /^\d+$/.test(videoId);

  if (isYouTube && !isVimeo) {
    // YouTube embed - tentar primeiro com o domínio padrão
    // Se não funcionar, o vídeo pode não permitir embed
    return `https://www.youtube.com/embed/${videoId}?modestbranding=1&playsinline=1&enablejsapi=1&autoplay=0&controls=1&rel=0&fs=1&cc_load_policy=0&iv_load_policy=3&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`;
  }
  
  if (isVimeo) {
    // Vimeo embed
    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&badge=0`;
  }

  console.warn('Tipo de vídeo não reconhecido:', url);
  return null;
};

const stepLabels = [
  'Profissional',
  'Serviços',
  'Data/Hora',
  'Dados',
  'Pagamento',
];

interface ProfessionalSchedule {
  useBusinessHours: boolean;
  workDays: number[];
  workHours: {
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
  };
}

interface Professional {
  id: string;
  nome: string;
  especialidade: string | null;
  avatar_url: string | null;
  schedule: ProfessionalSchedule | null;
}

interface BusinessHour {
  day_of_week: number;
  is_open: boolean;
  periods: {
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
  } | null;
}

interface DateBlock {
  date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  professional_id: string | null;
}

interface Appointment {
  data_hora: string;
  service_duration: number;
}

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  descricao: string | null;
}

interface Tenant {
  id: string;
  nome: string;
  logo_url: string | null;
  slug: string;
  mp_public_key?: string | null;
  hero_image_url?: string | null;
  hero_video_url?: string | null;
  gallery_images?: string[];
  hero_title?: string | null;
  hero_subtitle?: string | null;
}

interface LoyaltyConfig {
  enabled: boolean;
  points_type: 'visit' | 'amount';
  points_per_visit: number;
  points_per_real: number;
  min_amount_for_points: number;
}

const Booking = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Data from Supabase
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Booking state
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Points earned after booking
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // Gallery carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Confirmation code for online payments
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'local'>('local');
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);

  // Fetch tenant by slug
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch tenant by slug
        const { data: tenantData, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error || !tenantData) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setTenant(tenantData);

        // Fetch professionals with schedule
        const { data: prosData } = await supabase
          .from('professionals')
          .select('id, nome, especialidade, avatar_url, schedule')
          .eq('tenant_id', tenantData.id)
          .eq('ativo', true);

        setProfessionals((prosData || []).map(p => ({
          ...p,
          schedule: (p.schedule as unknown as ProfessionalSchedule) || null
        })));

        // Fetch business hours
        const { data: businessHoursData } = await supabase
          .from('business_hours')
          .select('day_of_week, is_open, periods')
          .eq('tenant_id', tenantData.id);

        setBusinessHours((businessHoursData || []).map(bh => ({
          day_of_week: bh.day_of_week,
          is_open: bh.is_open ?? false,
          periods: bh.periods as BusinessHour['periods']
        })));

        // Fetch date blocks
        const { data: dateBlocksData } = await supabase
          .from('date_blocks')
          .select('date, all_day, start_time, end_time, professional_id')
          .eq('tenant_id', tenantData.id)
          .gte('date', new Date().toISOString().split('T')[0]);

        setDateBlocks((dateBlocksData || []).map(db => ({
          date: db.date,
          all_day: db.all_day ?? true,
          start_time: db.start_time,
          end_time: db.end_time,
          professional_id: db.professional_id
        })));

        // Fetch services
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, nome, preco, duracao, descricao')
          .eq('tenant_id', tenantData.id)
          .eq('ativo', true);

        setServices(servicesData || []);

        // Fetch loyalty config
        const { data: loyaltyData } = await supabase
          .from('loyalty_config')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .maybeSingle();

        if (loyaltyData) {
          setLoyaltyConfig(loyaltyData as LoyaltyConfig);
        }

        // Tenant data already includes hero_image_url, hero_video_url, gallery_images, hero_title, hero_subtitle
      } catch (error) {
        console.error('Error fetching data:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Auto-play carousel effect
  useEffect(() => {
    if (!tenant?.gallery_images || tenant.gallery_images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % tenant.gallery_images.length
      );
    }, 4000); // Muda a cada 4 segundos

    return () => clearInterval(interval);
  }, [tenant?.gallery_images]);

  // Fetch appointments when professional is selected
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!tenant?.id || !selectedProfessional) {
        setAppointments([]);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

        // Buscar agendamentos, incluindo pending_payment que ainda não expiraram
        const now = new Date();
        
        // Buscar todos os agendamentos relevantes
        const { data: allAppointments } = await supabase
          .from('appointments')
          .select('data_hora, service_id, status, tolerance_expires_at')
          .eq('tenant_id', tenant.id)
          .eq('professional_id', selectedProfessional)
          .gte('data_hora', today.toISOString())
          .in('status', ['pending', 'confirmed', 'pending_payment']);
        
        // Filtrar no código: incluir pending_payment apenas se não expiraram
        const appointmentsData = allAppointments?.filter((apt: any) => {
          if (apt.status === 'pending_payment' && apt.tolerance_expires_at) {
            const expiresAt = new Date(apt.tolerance_expires_at);
            const isValid = now <= expiresAt;
            if (!isValid) {
              console.log('⏰ Agendamento pending_payment expirado, excluindo:', apt.data_hora);
            }
            return isValid; // Incluir apenas se não expirou
          }
          return true; // Incluir todos os outros status
        });
        
        console.log('📅 Agendamentos encontrados:', {
          total: allAppointments?.length || 0,
          filtrados: appointmentsData?.length || 0,
          pending_payment_total: allAppointments?.filter((a: any) => a.status === 'pending_payment').length || 0,
          pending_payment_validos: appointmentsData?.filter((a: any) => a.status === 'pending_payment').length || 0,
          detalhes: appointmentsData?.filter((a: any) => a.status === 'pending_payment').map((a: any) => ({
            data_hora: a.data_hora,
            expires_at: a.tolerance_expires_at,
            agora: new Date().toISOString(),
            valido: a.tolerance_expires_at ? new Date() <= new Date(a.tolerance_expires_at) : true,
          })) || [],
        });

      if (appointmentsData && appointmentsData.length > 0) {
        // Map appointments with service duration e dados completos
        const mappedAppointments = appointmentsData.map((apt: any) => {
          const service = services.find(s => s.id === apt.service_id);
          const mapped = {
            data_hora: apt.data_hora,
            service_duration: service?.duracao || 30,
            status: apt.status,
            tolerance_expires_at: apt.tolerance_expires_at,
          };
          
          // Log para debug
          if (apt.status === 'pending_payment') {
            console.log('🔒 Mapeando agendamento pending_payment:', {
              data_hora: mapped.data_hora,
              expires_at: mapped.tolerance_expires_at,
              agora: new Date().toISOString(),
              valido: mapped.tolerance_expires_at ? new Date() <= new Date(mapped.tolerance_expires_at) : false,
            });
          }
          
          return mapped;
        });
        setAppointments(mappedAppointments);
      } else {
        // Se não há agendamentos, limpar a lista
        setAppointments([]);
      }
    };

    fetchAppointments();
    
    // Recarregar agendamentos quando o dialog PIX abrir/fechar para atualizar horários
    const interval = setInterval(() => {
      if (selectedProfessional) {
        fetchAppointments();
      }
    }, 5000); // Verificar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [tenant?.id, selectedProfessional, services, showPixDialog]);

  const totalPrice = selectedServices.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.preco || 0);
  }, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedProfessional !== null;
      case 2:
        return selectedServices.length > 0;
      case 3:
        return selectedDate !== null && selectedTime !== null;
      case 4:
        return clientName.trim().length > 2 && clientPhone.length >= 14;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setShowWizard(false);
    }
  };

  const handleServiceToggle = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const calculatePoints = () => {
    if (!loyaltyConfig || !loyaltyConfig.enabled) return 0;

    if (loyaltyConfig.points_type === 'visit') {
      return loyaltyConfig.points_per_visit;
    } else {
      if (totalPrice >= loyaltyConfig.min_amount_for_points) {
        return Math.floor(totalPrice * loyaltyConfig.points_per_real);
      }
      return 0;
    }
  };

  const handlePayment = async (method: 'online' | 'local') => {
    if (!tenant || !selectedProfessional || !selectedDate || !selectedTime) return;

    setPaymentMethod(method);

    if (method === 'online') {
      // Verificar se o tenant tem Mercado Pago configurado (Access Token é necessário para gerar PIX)
      const mpAccessToken = (tenant as any).mp_access_token;
      if (!mpAccessToken) {
        alert('Mercado Pago Access Token não configurado. Por favor, configure o Access Token nas configurações do sistema (Integrações > Mercado Pago).');
        return;
      }

      // Abrir diálogo do PIX
      setShowPixDialog(true);
      return;
    }

    // Se for pagamento local, criar agendamento diretamente
    await createAppointment('local');
  };

  // Função para criar notificação no painel admin quando pagamento é confirmado
  const createPaymentNotification = async (
    tenantId: string,
    appointmentId: string,
    clientName: string,
    amount: number
  ) => {
    try {
      await supabase
        .from('notifications' as any)
        .insert({
          tenant_id: tenantId,
          type: 'payment_confirmed',
          title: 'Pagamento Confirmado',
          message: `Pagamento de R$ ${amount.toFixed(2)} confirmado para o agendamento de ${clientName}`,
          appointment_id: appointmentId,
          read: false,
        });
      
      console.log('✅ Notificação criada no painel admin');
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      // Não bloquear o fluxo se houver erro
    }
  };

  // Função para enviar notificações WhatsApp quando pagamento é confirmado
  const sendPaymentConfirmationNotifications = async (
    tenantId: string,
    professionalId: string,
    appointmentDateTime: Date,
    clientName: string,
    clientPhone: string,
    serviceId: string
  ) => {
    try {
      console.log('📱 Enviando notificações WhatsApp de confirmação de pagamento...');
      
      // Buscar conexão WhatsApp do tenant
      const { data: connection } = await supabase
        .from('connections' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'online')
        .maybeSingle() as any;

      if (!connection || !connection.api_instance_token) {
        console.log('⚠️ WhatsApp não conectado, notificações não enviadas');
        return;
      }

      // Buscar dados do profissional (barbeiro)
      const { data: professional } = await supabase
        .from('professionals')
        .select('nome, telefone')
        .eq('id', professionalId)
        .single();

      if (!professional) {
        console.error('❌ Profissional não encontrado');
        return;
      }

      // Buscar dados do serviço
      const { data: service } = await supabase
        .from('services')
        .select('nome')
        .eq('id', serviceId)
        .single();

      // Buscar nome da barbearia
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', tenantId)
        .single();

      const barbershopName = tenantData?.nome || 'Barbearia';
      const serviceName = service?.nome || 'Serviço';
      
      // Formatar data e hora
      const formattedDate = format(appointmentDateTime, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = format(appointmentDateTime, "HH:mm");

      // MENSAGEM PARA O BARBEIRO
      if (professional.telefone) {
        const barberPhone = professional.telefone.replace(/\D/g, '');
        
        // Adicionar código do país se necessário
        const cleanBarberPhone = barberPhone.length === 11 && !barberPhone.startsWith('55')
          ? '55' + barberPhone
          : barberPhone;

        // Verificar se o número tem WhatsApp
        const checkResult = await checkWhatsAppUser(connection.api_instance_token, cleanBarberPhone);
        
        if (checkResult.success && checkResult.exists) {
          const barberMessage = `*${barbershopName}*\n\n` +
            `Olá ${professional.nome}! 👋\n\n` +
            `✅ *Novo agendamento confirmado!*\n\n` +
            `📅 *Data:* ${formattedDate}\n` +
            `🕐 *Horário:* ${formattedTime}\n` +
            `👤 *Cliente:* ${clientName}\n` +
            `💇 *Serviço:* ${serviceName}\n` +
            `💰 *Pagamento:* PIX (50% pago)\n\n` +
            `O cliente já realizou o pagamento e o agendamento está confirmado!`;

          const barberResult = await sendTextMessage(
            connection.instance_name,
            checkResult.formattedPhone || cleanBarberPhone,
            barberMessage,
            connection.api_instance_token
          );

          if (barberResult.success) {
            console.log('✅ Notificação enviada para o barbeiro');
          } else {
            console.error('❌ Erro ao enviar notificação para o barbeiro:', barberResult.error);
          }
        } else {
          console.log('⚠️ Barbeiro não possui WhatsApp ou número inválido');
        }
      }

      // MENSAGEM PARA O CLIENTE
      if (clientPhone) {
        const cleanClientPhone = clientPhone.replace(/\D/g, '');
        
        // Adicionar código do país se necessário
        const formattedClientPhone = cleanClientPhone.length === 11 && !cleanClientPhone.startsWith('55')
          ? '55' + cleanClientPhone
          : cleanClientPhone;

        // Verificar se o número tem WhatsApp
        const checkClientResult = await checkWhatsAppUser(connection.api_instance_token, formattedClientPhone);
        
        if (checkClientResult.success && checkClientResult.exists) {
          const clientMessage = `*${barbershopName}*\n\n` +
            `Olá ${clientName}! 👋\n\n` +
            `✅ *Pagamento confirmado com sucesso!*\n\n` +
            `Seu agendamento foi confirmado:\n\n` +
            `📅 *Data:* ${formattedDate}\n` +
            `🕐 *Horário:* ${formattedTime}\n` +
            `💇 *Serviço:* ${serviceName}\n` +
            `👨‍💼 *Profissional:* ${professional.nome}\n\n` +
            `Nos vemos em breve! 🙏`;

          const clientResult = await sendTextMessage(
            connection.instance_name,
            checkClientResult.formattedPhone || formattedClientPhone,
            clientMessage,
            connection.api_instance_token
          );

          if (clientResult.success) {
            console.log('✅ Notificação enviada para o cliente');
          } else {
            console.error('❌ Erro ao enviar notificação para o cliente:', clientResult.error);
          }
        } else {
          console.log('⚠️ Cliente não possui WhatsApp ou número inválido');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificações WhatsApp:', error);
      // Não bloquear o fluxo se houver erro nas notificações
    }
  };

  const createAppointment = async (method: 'online' | 'local', pixId?: string) => {
    if (!tenant || !selectedProfessional || !selectedDate || !selectedTime) return;

    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Generate confirmation code for online payments
      let code: string | null = null;
      let prepaidAmount = 0;
      let toleranceExpiresAt: string | null = null;

      if (method === 'online') {
        // Verificar se temos pixId (pagamento confirmado)
        if (!pixId) {
          console.error('❌ Tentativa de criar agendamento online sem pixId (pagamento não confirmado)');
          throw new Error('Pagamento PIX não confirmado. Aguarde a confirmação do pagamento.');
        }
        
        code = Math.floor(1000 + Math.random() * 9000).toString();
        prepaidAmount = totalPrice * 0.5;
        
        // Buscar agendamento temporário existente para atualizar
        const appointmentDateTimeStr = appointmentDateTime.toISOString();
        let tempAppointment: { id: string; tolerance_expires_at: string | null } | null = null;
        
        try {
          const tempApptResult = await supabase
            .from('appointments')
            .select('id, tolerance_expires_at')
            .eq('tenant_id', tenant.id)
            .eq('professional_id', selectedProfessional)
            .eq('data_hora', appointmentDateTimeStr)
            .eq('status', 'pending_payment')
            .eq('pix_payment_id', pixId)
            .limit(1);
          
          if (tempApptResult.data && tempApptResult.data.length > 0) {
            tempAppointment = tempApptResult.data[0] as { id: string; tolerance_expires_at: string | null };
          }
        } catch (err) {
          console.error('Erro ao buscar agendamento temporário:', err);
        }

        // Se existe agendamento temporário, atualizar para confirmed
        if (tempAppointment) {
          // Verificar se ainda não expirou
          const expiresAt = new Date(tempAppointment.tolerance_expires_at || 0);
          const now = new Date();
          
          if (now > expiresAt) {
            // Agendamento expirado, cancelar e criar novo
            await supabase
              .from('appointments')
              .update({ status: 'cancelled' })
              .eq('id', tempAppointment.id);
            
            throw new Error('Tempo de pagamento expirado. O horário foi liberado. Por favor, selecione outro horário.');
          }
          
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              status: 'confirmed',
              confirmation_code: code,
              tolerance_expires_at: null, // Remover expiração após confirmação
            })
            .eq('id', tempAppointment.id);

          if (updateError) throw updateError;
          
          console.log('✅ Agendamento temporário atualizado para confirmed:', tempAppointment.id);
          
          // Criar notificação no painel admin
          await createPaymentNotification(
            tenant.id,
            tempAppointment.id,
            clientName,
            totalPrice * 0.5
          );
          
          // Enviar notificações WhatsApp para barbeiro e cliente
          await sendPaymentConfirmationNotifications(
            tenant.id,
            selectedProfessional,
            appointmentDateTime,
            clientName,
            clientPhone,
            selectedServices[0]
          );
          
          // Calcular pontos que serão ganhos (mas NÃO lançar ainda)
          // Os pontos serão lançados automaticamente quando o barbeiro marcar como concluído
          const pointsToAdd = calculatePoints();
          setEarnedPoints(pointsToAdd);

          // Buscar pontos atuais do cliente para exibir na tela de sucesso
          if (pointsToAdd > 0) {
            const { data: existingPoints } = await supabase
              .from('loyalty_points')
              .select('*')
              .eq('tenant_id', tenant.id)
              .eq('cliente_zap', clientPhone)
              .maybeSingle();

            if (existingPoints) {
              setTotalPoints(existingPoints.pontos || 0);
            } else {
              setTotalPoints(0);
            }

            // Garantir que o cliente existe na tabela clients
            const { data: existingClient } = await supabase
              .from('clients')
              .select('id')
              .eq('tenant_id', tenant.id)
              .eq('telefone', clientPhone)
              .maybeSingle();

            if (!existingClient) {
              await supabase.from('clients').insert({
                tenant_id: tenant.id,
                nome: clientName,
                telefone: clientPhone,
              });
            }
          } else {
            // Buscar pontos atuais mesmo sem ganhar novos
            const { data: existingPoints } = await supabase
              .from('loyalty_points')
              .select('*')
              .eq('tenant_id', tenant.id)
              .eq('cliente_zap', clientPhone)
              .maybeSingle();

            setTotalPoints(existingPoints?.pontos || 0);
          }

          setConfirmationCode(code);
          setPaymentMethod(method);
          setIsSuccess(true);
          return; // Retornar aqui, não precisa criar novo agendamento
        }
        
        // Se não encontrou agendamento temporário, criar novo (fallback)
        toleranceExpiresAt = null; // Não precisa mais de expiração após pagamento confirmado
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: tenant.id,
          professional_id: selectedProfessional,
          service_id: selectedServices[0],
          cliente_nome: clientName,
          cliente_zap: clientPhone,
          data_hora: appointmentDateTime.toISOString(),
          status: method === 'online' ? 'confirmed' : 'pending',
          confirmation_code: code,
          prepaid_amount: prepaidAmount,
          payment_method: method,
          tolerance_expires_at: toleranceExpiresAt,
          pix_payment_id: pixId || null,
        });

      if (appointmentError) throw appointmentError;

      // Calcular pontos que serão ganhos (mas NÃO lançar ainda)
      // Os pontos serão lançados automaticamente quando o barbeiro marcar como concluído
      const pointsToAdd = calculatePoints();
      setEarnedPoints(pointsToAdd);

      // Buscar pontos atuais do cliente para exibir na tela de sucesso
      if (pointsToAdd > 0) {
        const { data: existingPoints } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('cliente_zap', clientPhone)
          .maybeSingle();

        if (existingPoints) {
          setTotalPoints(existingPoints.pontos || 0);
        } else {
          setTotalPoints(0);
        }

        // Garantir que o cliente existe na tabela clients
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('telefone', clientPhone)
          .maybeSingle();

        if (!existingClient) {
          await supabase.from('clients').insert({
            tenant_id: tenant.id,
            nome: clientName,
            telefone: clientPhone,
          });
        }
      } else {
        // Buscar pontos atuais mesmo sem ganhar novos
        const { data: existingPoints } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('cliente_zap', clientPhone)
          .maybeSingle();

        setTotalPoints(existingPoints?.pontos || 0);
      }

      setConfirmationCode(code);
      setPaymentMethod(method);
      setIsSuccess(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Barbearia não encontrada
        </h1>
        <p className="text-muted-foreground mb-6">
          O link que você acessou não existe ou foi removido.
        </p>
        <Button variant="gold" onClick={() => navigate('/')}>
          Voltar ao início
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <SuccessScreen
        clientName={clientName}
        loyaltyPoints={totalPoints}
        earnedPoints={earnedPoints}
        loyaltyEnabled={loyaltyConfig?.enabled || false}
        confirmationCode={confirmationCode}
        paymentMethod={paymentMethod}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 px-4 py-4">
        <div className="flex items-center justify-between">
          {showWizard ? (
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-muted-foreground" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <DynamicLogo
            logoUrl={tenant?.logo_url || null}
            businessName={tenant?.nome || 'Barbearia'}
            size="md"
          />
          {tenant?.slug && loyaltyConfig?.enabled ? (
            <Link to={`/pontos/${tenant.slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gold hover:text-gold-light hover:bg-gold/10"
                title="Ver meus pontos"
              >
                <Star className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!showWizard ? (
          <motion.main
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col min-h-[calc(100vh-80px)]"
          >
            {/* Hero Media Section */}
            {(tenant?.hero_video_url || tenant?.hero_image_url) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full relative"
              >
                {tenant.hero_video_url ? (
                  <div 
                    className="relative w-full aspect-video bg-black overflow-hidden"
                    style={{ 
                      isolation: 'isolate',
                      WebkitTransform: 'translateZ(0)',
                      transform: 'translateZ(0)'
                    }}
                  >
                    {getVideoEmbedUrl(tenant.hero_video_url) ? (
                      <iframe
                        src={getVideoEmbedUrl(tenant.hero_video_url) || ''}
                        className="w-full h-full absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        frameBorder="0"
                        title="Vídeo promocional"
                        loading="lazy"
                        style={{ 
                          pointerEvents: 'auto',
                          border: 'none',
                          display: 'block',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white p-4">
                        <div className="text-center max-w-md">
                          <p className="text-lg font-semibold mb-2">URL do vídeo inválida</p>
                          <p className="text-sm text-muted-foreground">
                            Por favor, verifique se é um link completo do YouTube ou Vimeo.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : tenant.hero_image_url ? (
                  <div className="relative w-full h-[40vh] min-h-[250px] max-h-[400px]">
                    <img
                      src={tenant.hero_image_url}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* Content Section - Compacto */}
            <div className="flex flex-col items-center px-4 py-6 sm:py-8 flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center max-w-md w-full"
              >
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 leading-tight">
                  {tenant?.hero_title || (
                    <>
                      Seu estilo,{' '}
                      <span className="gold-text">no seu tempo</span>
                    </>
                  )}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base mb-6">
                  {tenant?.hero_subtitle || 'Agende seu horário em segundos e chegue no estilo que você merece.'}
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs mx-auto mb-6">
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={() => setShowWizard(true)}
                    className="w-full animate-glow"
                    disabled={professionals.length === 0 || services.length === 0}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Agendar Agora
                  </Button>
                  {tenant?.slug && loyaltyConfig?.enabled && (
                    <Link to={`/pontos/${tenant.slug}`} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Star className="w-3.5 h-3.5 mr-2" />
                        Ver Meus Pontos
                      </Button>
                    </Link>
                  )}
                </div>
                {(professionals.length === 0 || services.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    Em breve disponível para agendamentos
                  </p>
                )}
              </motion.div>

              {/* Gallery Section - Carrossel Automático */}
              {tenant?.gallery_images && tenant.gallery_images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-4xl mt-6 px-4"
                >
                  <h2 className="text-xl font-bold text-foreground mb-4 text-center">
                    Nossa Galeria
                  </h2>
                  
                  {/* Carrossel Container */}
                  <div className="relative w-full overflow-hidden rounded-lg">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{
                        transform: `translateX(-${currentImageIndex * 100}%)`,
                      }}
                    >
                      {tenant.gallery_images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="min-w-full aspect-video sm:aspect-[16/9] flex-shrink-0"
                        >
                          <img
                            src={imageUrl}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Indicadores de posição */}
                    {tenant.gallery_images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {tenant.gallery_images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === currentImageIndex
                                ? 'w-8 bg-gold'
                                : 'w-2 bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Ir para imagem ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Features Section - Compacta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 max-w-sm mx-auto px-4 pb-6"
            >
              {[
                { label: 'Rápido', desc: '30 seg' },
                { label: 'Fácil', desc: '5 passos' },
                { label: 'Seguro', desc: '100%' },
              ].map((feat) => (
                <div key={feat.label} className="text-center">
                  <p className="text-xl sm:text-2xl font-bold gold-text">{feat.desc}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.main>
        ) : (
          <motion.main
            key="wizard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col min-h-[calc(100vh-80px)]"
          >
            <StepIndicator
              currentStep={currentStep}
              totalSteps={5}
              labels={stepLabels}
            />

            <div className="flex-1 px-3 py-3 pb-28 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ProfessionalSelect
                      professionals={professionals}
                      selectedId={selectedProfessional}
                      onSelect={setSelectedProfessional}
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ServiceSelect
                      services={services}
                      selectedIds={selectedServices}
                      onToggle={handleServiceToggle}
                    />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <DateTimeSelect
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onDateSelect={setSelectedDate}
                      onTimeSelect={setSelectedTime}
                      professionalSchedule={professionals.find(p => p.id === selectedProfessional)?.schedule || null}
                      businessHours={businessHours}
                      dateBlocks={dateBlocks}
                      professionalId={selectedProfessional}
                      appointments={appointments}
                      serviceDuration={selectedServices.length > 0 
                        ? services.find(s => selectedServices.includes(s.id))?.duracao || 30
                        : 30}
                    />
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ClientInfoForm
                      name={clientName}
                      phone={clientPhone}
                      onNameChange={setClientName}
                      onPhoneChange={setClientPhone}
                    />
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <PaymentStep
                      professional={professionals.find((p) => p.id === selectedProfessional)}
                      services={services.filter((s) => selectedServices.includes(s.id))}
                      date={selectedDate}
                      time={selectedTime}
                      clientName={clientName}
                      onPaymentSelect={handlePayment}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {currentStep < 5 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold gold-text">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <Button
                  variant="gold"
                  size="xl"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full"
                >
                  Continuar
                </Button>
              </motion.div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* PIX Payment Dialog */}
      {tenant && selectedProfessional && selectedDate && selectedTime && (
        <PixPaymentDialog
          open={showPixDialog}
          onOpenChange={setShowPixDialog}
          amount={totalPrice * 0.5}
          description={`Agendamento - ${services.find(s => selectedServices.includes(s.id))?.nome || 'Serviço'}`}
          tenantId={tenant.id}
          payerName={clientName}
          payerPhone={clientPhone} // Passar número do cliente para WhatsApp
          payerEmail={undefined}
          externalReference={undefined}
          professionalId={selectedProfessional}
          serviceId={selectedServices[0]}
          appointmentDateTime={(() => {
            if (!selectedDate || !selectedTime) return undefined;
            const dt = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':');
            dt.setHours(parseInt(hours), parseInt(minutes));
            return dt;
          })()}
          totalPrice={totalPrice}
          onPaymentSuccess={async (paymentId: string) => {
            // Atualizar agendamento temporário para confirmed após pagamento confirmado
            console.log('✅ Pagamento confirmado, atualizando agendamento...', paymentId);
            await createAppointment('online', paymentId);
            setShowPixDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default Booking;
