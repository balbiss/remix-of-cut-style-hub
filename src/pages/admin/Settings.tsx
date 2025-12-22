import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessHoursForm } from '@/components/admin/BusinessHoursForm';
import { DateBlockForm } from '@/components/admin/DateBlockForm';
import { LoyaltyConfigForm } from '@/components/admin/LoyaltyConfigForm';
import { LoyaltyRewardsForm } from '@/components/admin/LoyaltyRewardsForm';
import { useAuth } from '@/contexts/AuthContext';
import { useDateBlocks } from '@/hooks/useDateBlocks';
import {
  Settings as SettingsIcon,
  Link2,
  Palette,
  Upload,
  Save,
  Check,
  Image,
  MessageSquare,
  CreditCard,
  Clock,
  Trophy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessHours {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BreakTime {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const defaultBusinessHours: BusinessHours[] = [
  { day: 0, isOpen: false, openTime: '09:00', closeTime: '18:00' },
  { day: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 6, isOpen: true, openTime: '09:00', closeTime: '12:00' },
];

const defaultBreakTime: BreakTime = {
  enabled: true,
  startTime: '12:00',
  endTime: '13:00',
};

const AdminSettings = () => {
  const { toast } = useToast();
  const { tenant } = useAuth();
  const { dateBlocks, addDateBlock, deleteDateBlock } = useDateBlocks();
  
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logo_url || null);
  const [evolutionUrl, setEvolutionUrl] = useState(tenant?.evolution_api_url || '');
  const [evolutionToken, setEvolutionToken] = useState(tenant?.evolution_api_token || '');
  const [mpPublicKey, setMpPublicKey] = useState(tenant?.mp_public_key || '');
  const [isSaving, setIsSaving] = useState(false);

  // Schedule states
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(defaultBusinessHours);
  const [breakTime, setBreakTime] = useState<BreakTime>(defaultBreakTime);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveIntegrations = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Configurações salvas!',
      description: 'Suas integrações foram atualizadas com sucesso.',
    });
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Aparência atualizada!',
      description: 'A logomarca foi salva com sucesso.',
    });
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Horários salvos!',
      description: 'Os horários de funcionamento foram atualizados.',
    });
  };

  const handleAddDateBlock = async (block: { date: string; description: string; all_day: boolean; start_time?: string; end_time?: string }) => {
    await addDateBlock(block);
  };

  const handleRemoveDateBlock = async (id: string) => {
    await deleteDateBlock(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl overflow-hidden">
        {/* Page Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie as configurações e integrações da sua barbearia
          </p>
        </div>

        <Tabs defaultValue="schedule" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-secondary/50 p-1 w-full flex overflow-x-auto">
            <TabsTrigger
              value="schedule"
              className="flex-1 min-w-0 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">Horários</span>
            </TabsTrigger>
            <TabsTrigger
              value="loyalty"
              className="flex-1 min-w-0 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">Fidelidade</span>
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="flex-1 min-w-0 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">Integrações</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex-1 min-w-0 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">Aparência</span>
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <BusinessHoursForm
                businessHours={businessHours}
                breakTime={breakTime}
                onBusinessHoursChange={setBusinessHours}
                onBreakTimeChange={setBreakTime}
              />

              <DateBlockForm
                dateBlocks={dateBlocks.map(b => ({
                  id: b.id,
                  date: b.date,
                  description: b.description,
                  all_day: b.all_day ?? true,
                  start_time: b.start_time ?? undefined,
                  end_time: b.end_time ?? undefined,
                }))}
                onAddBlock={handleAddDateBlock}
                onRemoveBlock={handleRemoveDateBlock}
              />

              <div className="flex justify-end pt-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Save className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Salvar Horários
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <LoyaltyConfigForm />
              <LoyaltyRewardsForm />
            </motion.div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Evolution API */}
              <Card variant="elevated" className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle>Evolution API</CardTitle>
                      <CardDescription>
                        Integração para envio de mensagens via WhatsApp
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      URL da API
                    </label>
                    <Input
                      type="url"
                      placeholder="https://sua-evolution-api.com"
                      value={evolutionUrl}
                      onChange={(e) => setEvolutionUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Token de Acesso
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={evolutionToken}
                      onChange={(e) => setEvolutionToken(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mercado Pago */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle>Mercado Pago</CardTitle>
                      <CardDescription>
                        Integração para pagamentos online
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Public Key
                    </label>
                    <Input
                      type="text"
                      placeholder="APP_USR-XXXXXXXX-XXXX-XXXX"
                      value={mpPublicKey}
                      onChange={(e) => setMpPublicKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre sua Public Key no painel do Mercado Pago
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleSaveIntegrations}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Save className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Salvar Integrações
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Image className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <CardTitle>Logomarca</CardTitle>
                      <CardDescription>
                        A logo será exibida na área pública e no painel administrativo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Preview */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-border bg-secondary/50 flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Nenhuma logo enviada
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="flex gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Enviar Logo
                          </span>
                        </Button>
                      </label>
                      {logoPreview && (
                        <Button
                          variant="ghost"
                          onClick={() => setLogoPreview(null)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remover
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                      Recomendamos imagens em formato PNG ou SVG com fundo transparente.
                      Tamanho máximo: 2MB
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleSaveAppearance}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Save className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Salvar Aparência
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
