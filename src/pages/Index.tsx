import { useState } from 'react';
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
import { mockTenant, mockProfessionals, mockServices } from '@/lib/mock-data';
import { ChevronLeft, Sparkles } from 'lucide-react';

const stepLabels = [
  'Profissional',
  'Serviços',
  'Data/Hora',
  'Dados',
  'Pagamento',
];

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // Booking state
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const totalPrice = selectedServices.reduce((sum, id) => {
    const service = mockServices.find((s) => s.id === id);
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

  const handlePayment = (method: 'online' | 'local') => {
    // Simulate payment processing
    setIsSuccess(true);
  };

  if (isSuccess) {
    return <SuccessScreen clientName={clientName} loyaltyPoints={150} />;
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
            logoUrl={mockTenant.logo_url}
            businessName={mockTenant.nome}
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
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Agendar Agora
              </Button>
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
                      professionals={mockProfessionals}
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
                      services={mockServices}
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
                      professional={mockProfessionals.find((p) => p.id === selectedProfessional)}
                      services={mockServices.filter((s) => selectedServices.includes(s.id))}
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
