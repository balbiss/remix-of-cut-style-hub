import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicLogo } from '@/components/DynamicLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Gift, Loader2, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientLoyalty } from '@/hooks/useClientLoyalty';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  nome: string;
  logo_url: string | null;
  slug: string;
}

const MeusPontos = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const { loyaltyData, rewards, clientName, isLoading, redeemReward } = useClientLoyalty(
    tenant?.id || null,
    submittedPhone
  );

  // Buscar tenant pelo slug (multi-tenant)
  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) {
        setNotFound(true);
        setIsLoadingTenant(false);
        return;
      }

      try {
        // Buscar tenant pelo slug (identificador único da barbearia)
        const { data: tenantData, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error || !tenantData) {
          setNotFound(true);
          setIsLoadingTenant(false);
          return;
        }

        setTenant(tenantData);
      } catch (error) {
        console.error('Error fetching tenant:', error);
        setNotFound(true);
      } finally {
        setIsLoadingTenant(false);
      }
    };

    fetchTenant();
  }, [slug]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers;
  };

  const handlePhoneSubmit = () => {
    const formattedPhone = formatPhoneNumber(phone);
    
    if (formattedPhone.length < 10) {
      toast.error('Por favor, informe um número de telefone válido.');
      return;
    }

    setSubmittedPhone(formattedPhone);
  };

  const handleRedeem = async (rewardId: string, pointsRequired: number) => {
    const success = await redeemReward(rewardId, pointsRequired);
    if (success) {
      // Recarregar dados após resgate
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getRewardDescription = (reward: any) => {
    switch (reward.reward_type) {
      case 'service':
        return 'Serviço grátis';
      case 'discount':
        return `Desconto de ${formatCurrency(reward.reward_value)}`;
      case 'custom':
        return reward.descricao || 'Recompensa personalizada';
      default:
        return '';
    }
  };

  if (isLoadingTenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (notFound || !tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-2">Barbearia não encontrada.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Verifique se o link está correto ou entre em contato com a barbearia.
            </p>
            {slug && (
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => navigate(`/b/${slug}`)}
              >
                Voltar para agendamento
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/b/${tenant.slug}`)}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <DynamicLogo
            logoUrl={tenant.logo_url}
            businessName={tenant.nome}
            size="md"
          />
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 pb-20">
        {!submittedPhone ? (
          /* Formulário de entrada */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-8"
          >
            <Card variant="elevated">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gold" />
                </div>
                <CardTitle className="text-2xl">Meus Pontos</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Digite seu número de WhatsApp para ver seus pontos de fidelidade
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Número do WhatsApp
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="559192724395"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePhoneSubmit();
                      }
                    }}
                    maxLength={15}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: código do país + DDD + número (ex: 559192724395)
                  </p>
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handlePhoneSubmit}
                  disabled={phone.length < 10}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ver Meus Pontos
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Exibição de pontos e recompensas */
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                {/* Card de Pontos */}
                <Card variant="elevated" className="bg-gradient-to-br from-gold/10 to-gold/5">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      {clientName && (
                        <div>
                          <p className="text-sm text-muted-foreground">Olá,</p>
                          <h2 className="text-2xl font-bold text-foreground">{clientName}</h2>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-8 h-8 text-gold fill-gold" />
                          <span className="text-5xl font-bold gold-text">
                            {loyaltyData?.pontos || 0}
                          </span>
                        </div>
                        <p className="text-muted-foreground">pontos disponíveis</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-sm text-muted-foreground">Total ganho</p>
                          <p className="text-lg font-semibold text-foreground">
                            {loyaltyData?.total_earned || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total resgatado</p>
                          <p className="text-lg font-semibold text-foreground">
                            {loyaltyData?.total_redeemed || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recompensas Disponíveis */}
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-gold" />
                    Recompensas Disponíveis
                  </h3>

                  {rewards.length === 0 ? (
                    <Card variant="elevated">
                      <CardContent className="py-8 text-center">
                        <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Nenhuma recompensa disponível no momento
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {rewards.map((reward) => {
                        const canRedeem = (loyaltyData?.pontos || 0) >= reward.points_required;
                        const isRedeeming = false; // Poderia adicionar estado para controlar resgates em andamento

                        return (
                          <motion.div
                            key={reward.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative"
                          >
                            <Card
                              variant="elevated"
                              className={`transition-all ${
                                canRedeem
                                  ? 'border-gold/30 hover:border-gold/50'
                                  : 'opacity-60'
                              }`}
                            >
                              <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                                        <Gift className="w-6 h-6 text-gold" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-foreground mb-1">
                                          {reward.nome}
                                        </h4>
                                        {reward.descricao && (
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {reward.descricao}
                                          </p>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          {getRewardDescription(reward)}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                      <div className="flex items-center gap-1 justify-end">
                                        <Star className="w-4 h-4 text-gold" />
                                        <span className="text-xl font-bold gold-text">
                                          {reward.points_required}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">pontos</p>
                                    </div>
                                    <Button
                                      variant={canRedeem ? 'gold' : 'outline'}
                                      disabled={!canRedeem || isRedeeming}
                                      onClick={() => handleRedeem(reward.id, reward.points_required)}
                                      className="min-w-[120px]"
                                    >
                                      {isRedeeming ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Resgatando...
                                        </>
                                      ) : canRedeem ? (
                                        <>
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Resgatar
                                        </>
                                      ) : (
                                        'Pontos insuficientes'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Botão para voltar */}
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSubmittedPhone(null);
                      setPhone('');
                    }}
                  >
                    Verificar outro número
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1"
                    onClick={() => navigate(`/b/${tenant.slug}`)}
                  >
                    Agendar novo serviço
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default MeusPontos;

