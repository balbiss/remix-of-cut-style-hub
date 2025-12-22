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
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';

const stepLabels = [
  'Profissional',
  'Serviços',
  'Data/Hora',
  'Dados',
  'Pagamento',
];


interface Professional {
  id: string;
  nome: string;
  especialidade: string | null;
  avatar_url: string | null;
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
}

interface LoyaltyConfig {
  enabled: boolean;
  points_type: 'visit' | 'amount';
  points_per_visit: number;
  points_per_real: number;
  min_amount_for_points: number;
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

          // Fetch professionals
          const { data: prosData } = await supabase
            .from('professionals')
            .select('id, nome, especialidade, avatar_url')
            .eq('tenant_id', tenantData.id)
            .eq('ativo', true);

          setProfessionals(prosData || []);

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
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

    try {
      // Create appointment
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: tenant.id,
          professional_id: selectedProfessional,
          service_id: selectedServices[0], // Primary service
          cliente_nome: clientName,
          cliente_zap: clientPhone,
          data_hora: appointmentDateTime.toISOString(),
          status: 'confirmed',
        });

      if (appointmentError) throw appointmentError;

      // Calculate and add loyalty points
      const pointsToAdd = calculatePoints();
      setEarnedPoints(pointsToAdd);

      if (pointsToAdd > 0) {
        // Check if client already has points
        const { data: existingPoints } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('cliente_zap', clientPhone)
          .maybeSingle();

        if (existingPoints) {
          const newTotal = (existingPoints.pontos || 0) + pointsToAdd;
          setTotalPoints(newTotal);

          await supabase
            .from('loyalty_points')
            .update({
              pontos: newTotal,
              total_earned: ((existingPoints as any).total_earned || 0) + pointsToAdd,
            })
            .eq('id', existingPoints.id);
        } else {
          setTotalPoints(pointsToAdd);

          await supabase
            .from('loyalty_points')
            .insert({
              tenant_id: tenant.id,
              cliente_zap: clientPhone,
              pontos: pointsToAdd,
              total_earned: pointsToAdd,
              total_redeemed: 0,
            });
        }

        // Also ensure client exists in clients table
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
              <Button
                variant="gold"
                size="xl"
                onClick={() => setShowWizard(true)}
                className="w-full max-w-xs animate-glow"
                disabled={professionals.length === 0 || services.length === 0}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Agendar Agora
              </Button>
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
              className="grid grid-cols-3 gap-4 mt-16 max-w-sm"
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
    </div>
  );
};

export default Index;
