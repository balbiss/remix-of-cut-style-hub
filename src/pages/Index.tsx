import { useState, useEffect } from 'react';
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
import { Link } from 'react-router-dom';
import { sendTextMessage, checkWhatsAppUser } from '@/lib/whatsapp-api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  slug?: string;
}

interface LoyaltyConfig {
  enabled: boolean;
  points_type: 'visit' | 'amount';
  points_per_visit: number;
  points_per_real: number;
  min_amount_for_points: number;
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

interface AppointmentForCalendar {
  data_hora: string;
  service_duration: number;
}

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data from Supabase
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([]);
  const [professionalAppointments, setProfessionalAppointments] = useState<AppointmentForCalendar[]>([]);

  // Booking state
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'local'>('local');

  // Points earned after booking
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get tenant_id from URL query string or fetch first tenant
        const urlParams = new URLSearchParams(window.location.search);
        const tenantIdFromUrl = urlParams.get('tenant');

        let tenantData;

        if (tenantIdFromUrl) {
          // Fetch specific tenant by ID
          const { data } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantIdFromUrl)
            .single();
          tenantData = data;
        } else {
          // Fetch first active tenant (fallback for development)
          const { data } = await supabase
            .from('tenants')
            .select('*')
            .limit(1)
            .single();
          tenantData = data;
        }

        if (tenantData) {
          setTenant(tenantData);

          // Fetch professionals with schedule
          const { data: prosData } = await supabase
            .from('professionals')
            .select('id, nome, especialidade, avatar_url, schedule')
            .eq('tenant_id', tenantData.id)
            .eq('ativo', true);

          setProfessionals((prosData || []).map(p => ({
            ...p,
            schedule: p.schedule as unknown as ProfessionalSchedule | null
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
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch appointments when professional is selected
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!tenant?.id || !selectedProfessional) {
        setProfessionalAppointments([]);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('data_hora, service_id')
        .eq('tenant_id', tenant.id)
        .eq('professional_id', selectedProfessional)
        .gte('data_hora', today.toISOString())
        .in('status', ['pending', 'confirmed']);

      if (appointmentsData) {
        // Map appointments with service duration
        const mappedAppointments = appointmentsData.map(apt => {
          const service = services.find(s => s.id === apt.service_id);
          return {
            data_hora: apt.data_hora,
            service_duration: service?.duracao || 30
          };
        });
        setProfessionalAppointments(mappedAppointments);
      }
    };

    fetchAppointments();
  }, [tenant?.id, selectedProfessional, services]);

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
    console.log('💳 handlePayment called with method:', method);
    if (!tenant || !selectedProfessional || !selectedDate || !selectedTime) {
      console.warn('⚠️ handlePayment: missing required selection data', { tenant: !!tenant, professional: !!selectedProfessional, date: !!selectedDate, time: !!selectedTime });
      return;
    }

    setPaymentMethod(method);

    if (method === 'online') {
      console.log('🔗 [DEBUG] Selected Online (PIX) payment. Setting paymentMethod and showPixDialog=true');
      setShowPixDialog(true);
      return;
    }

    // Se for pagamento local, criar agendamento diretamente
    console.log('📍 Selected Local payment. Creating appointment...');
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
    }
  };

  // Função para enviar notificações WhatsApp quando pagamento/agendamento é confirmado
  const sendPaymentConfirmationNotifications = async (
    tenantId: string,
    professionalId: string,
    appointmentDateTime: Date,
    clientName: string,
    clientPhone: string,
    serviceId: string,
    paymentMethod: 'online' | 'local' = 'online'
  ) => {
    try {
      console.log('📱 [DEBUG] Enviando notificações WhatsApp de confirmação...', { tenantId, professionalId, clientName, clientPhone, paymentMethod });

      // Buscar conexão WhatsApp do tenant
      const { data: connection, error: connError } = await supabase
        .from('connections' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'online')
        .maybeSingle() as any;

      if (connError) {
        console.error('❌ Erro ao buscar conexão WhatsApp (confirmação):', connError);
        return;
      }

      if (!connection) {
        console.log('⚠️ WhatsApp não conectado para este tenant (confirmação)');
        return;
      }

      console.log('✅ Conexão WhatsApp encontrada para confirmação:', connection.instance_name);

      // Buscar nomes para a mensagem
      const { data: professional } = await supabase
        .from('professionals')
        .select('nome, telefone')
        .eq('id', professionalId)
        .single();

      const { data: service } = await supabase
        .from('services')
        .select('nome')
        .eq('id', serviceId)
        .single();

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', tenantId)
        .single();

      const barbershopName = tenantData?.nome || 'Barbearia';
      const serviceName = service?.nome || 'Serviço';
      const professionalName = professional?.nome || 'Profissional';

      // Formatar data e hora
      const formattedDate = format(appointmentDateTime, "dd 'de' MMMM", { locale: ptBR });
      const formattedTime = format(appointmentDateTime, "HH:mm");

      const paymentText = paymentMethod === 'online' ? 'PIX (Online)' : 'No local';

      // Notificar Barbeiro
      if (professional?.telefone) {
        const barberMessage = `*${barbershopName}*\n\n` +
          `Olá ${professionalName}! 👋\n\n` +
          `✅ *Novo agendamento confirmado!*\n\n` +
          `📅 *Data:* ${formattedDate}\n` +
          `🕐 *Horário:* ${formattedTime}\n` +
          `👤 *Cliente:* ${clientName}\n` +
          `💇 *Serviço:* ${serviceName}\n` +
          `💰 *Pagamento:* ${paymentText}\n\n` +
          `Agendamento confirmado com sucesso!`;

        await sendTextMessage(
          connection.instance_name,
          professional.telefone.replace(/\D/g, ''),
          barberMessage,
          connection.api_instance_token
        );
      }

      // Notificar Cliente
      const clientMessage = `*${barbershopName}*\n\n` +
        `Olá ${clientName}! 👋\n\n` +
        `✅ *Agendamento Confirmado!*\n\n` +
        `Seu horário foi reservado com sucesso:\n\n` +
        `📅 *Data:* ${formattedDate}\n` +
        `🕐 *Horário:* ${formattedTime}\n` +
        `💇 *Serviço:* ${serviceName}\n` +
        `👨‍💼 *Profissional:* ${professionalName}\n` +
        `💰 *Pagamento:* ${paymentText}\n\n` +
        `Agradecemos a preferência! 🙏`;

      await sendTextMessage(
        connection.instance_name,
        clientPhone.replace(/\D/g, ''),
        clientMessage,
        connection.api_instance_token
      );

      console.log('✅ [DEBUG] Notificações enviadas com sucesso');
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao enviar notificações:', error);
    }
  };

  const createAppointment = async (method: 'online' | 'local', pixId?: string) => {
    console.log('📝 createAppointment called:', { method, pixId });
    if (!tenant || !selectedProfessional || !selectedDate || !selectedTime) {
      console.warn('⚠️ createAppointment: missing required selection data');
      return;
    }

    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Generate confirmation code for online payments
      let code: string | null = null;
      let prepaidAmount = 0;

      if (method === 'online') {
        if (!pixId) {
          throw new Error('Pagamento PIX não confirmado');
        }
        code = Math.floor(1000 + Math.random() * 9000).toString();
        prepaidAmount = totalPrice * 0.5;
      }

      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: tenant.id,
          professional_id: selectedProfessional,
          service_id: selectedServices[0],
          cliente_nome: clientName,
          cliente_zap: clientPhone,
          data_hora: appointmentDateTime.toISOString(),
          status: 'confirmed',
          confirmation_code: code,
          prepaid_amount: prepaidAmount,
          pix_payment_id: pixId,
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create notification for admin panel
      if (method === 'online') {
        await createPaymentNotification(tenant.id, newAppointment.id, clientName, prepaidAmount);
      }

      // Send WhatsApp notifications
      await sendPaymentConfirmationNotifications(
        tenant.id,
        selectedProfessional,
        appointmentDateTime,
        clientName,
        clientPhone,
        selectedServices[0],
        method
      );

      // Loyalty points logic
      const pointsToAdd = calculatePoints();
      setEarnedPoints(pointsToAdd);

      const { data: existingPoints } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('cliente_zap', clientPhone)
        .maybeSingle();

      setTotalPoints(existingPoints?.pontos || 0);

      // Ensure client exists
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

  if (isSuccess) {
    return (
      <SuccessScreen
        clientName={clientName}
        loyaltyPoints={totalPoints}
        earnedPoints={earnedPoints}
        loyaltyEnabled={loyaltyConfig?.enabled || false}
        confirmationCode={null} // Will be updated if needed
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
          {!showWizard ? (
            <a
              href="/admin"
              className="text-sm text-gold hover:text-gold-light transition-colors font-medium"
            >
              Entrar
            </a>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!showWizard ? (
          /* Hero Section */
          <motion.main
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-80px)]"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center max-w-md"
            >
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Seu estilo,{' '}
                <span className="gold-text">no seu tempo</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Agende seu horário em segundos e chegue no estilo que você merece.
              </p>
              <div className="space-y-3 w-full max-w-xs mx-auto">
                <Button
                  variant="gold"
                  size="xl"
                  onClick={() => setShowWizard(true)}
                  className="w-full animate-glow"
                  disabled={professionals.length === 0 || services.length === 0}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Agendar Agora
                </Button>
                {loyaltyConfig?.enabled && (
                  <Link to={tenant?.slug ? `/pontos/${tenant.slug}` : '/meus-pontos'}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Ver Meus Pontos
                    </Button>
                  </Link>
                )}
              </div>
              {(professionals.length === 0 || services.length === 0) && (
                <p className="text-sm text-muted-foreground mt-4">
                  Em breve disponível para agendamentos
                </p>
              )}
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4 mt-16 max-w-sm mx-auto"
            >
              {[
                { label: 'Rápido', desc: '30 seg' },
                { label: 'Fácil', desc: '5 passos' },
                { label: 'Seguro', desc: '100%' },
              ].map((feat, i) => (
                <div key={feat.label} className="text-center">
                  <p className="text-2xl font-bold gold-text">{feat.desc}</p>
                  <p className="text-sm text-muted-foreground">{feat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.main>
        ) : (
          /* Booking Wizard */
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
                      professionalSchedule={professionals.find(p => p.id === selectedProfessional)?.schedule}
                      businessHours={businessHours}
                      dateBlocks={dateBlocks}
                      professionalId={selectedProfessional}
                      appointments={professionalAppointments}
                      serviceDuration={selectedServices.reduce((sum, id) => {
                        const service = services.find(s => s.id === id);
                        return sum + (service?.duracao || 30);
                      }, 0) || 30}
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

            {/* Sticky Footer */}
            {currentStep < 5 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border px-3 py-3 safe-area-inset-bottom"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold gold-text">{formatPrice(totalPrice)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedServices.length} serviço(s)
                    </p>
                  </div>
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  disabled={!canProceed()}
                  onClick={handleNext}
                >
                  Continuar
                </Button>
              </motion.div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {tenant && selectedProfessional && selectedDate && selectedTime && (
        <PixPaymentDialog
          open={showPixDialog}
          onOpenChange={setShowPixDialog}
          amount={totalPrice * 0.5}
          description={services
            .filter((s) => selectedServices.includes(s.id))
            .map((s) => s.nome)
            .join(', ')}
          tenantId={tenant.id}
          barbershopName={tenant.nome}
          professionalId={selectedProfessional}
          serviceId={selectedServices[0]}
          appointmentDateTime={(() => {
            const dt = new Date(selectedDate);
            const [h, m] = selectedTime.split(':');
            dt.setHours(parseInt(h), parseInt(m));
            return dt;
          })()}
          payerName={clientName}
          payerPhone={clientPhone}
          onPaymentSuccess={async (paymentId: string) => {
            console.log('✅ Pagamento confirmado, atualizando agendamento...', paymentId);
            await createAppointment('online', paymentId);
            setShowPixDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default Index;
