import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
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
import { supabase } from '@/integrations/supabase/client';
import { mockBusinessHours, mockBreakTime, BusinessHours, BreakTime, DateBlock } from '@/lib/mock-data';
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
  Loader2,
  Copy,
  ExternalLink,
  Download,
  QrCode,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { toast } = useToast();
  const { tenant, refreshTenant } = useAuth();
  const { dateBlocks, addDateBlock, deleteDateBlock } = useDateBlocks();
  
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logo_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [businessName, setBusinessName] = useState(tenant?.nome || '');
  const [businessSlug, setBusinessSlug] = useState(tenant?.slug || '');
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionToken, setEvolutionToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Update local state when tenant changes
  useEffect(() => {
    if (tenant) {
      setLogoPreview(tenant.logo_url || null);
      setBusinessName(tenant.nome || '');
      setBusinessSlug(tenant.slug || '');
    }
  }, [tenant]);

  // Schedule states - using mock-data types
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(mockBusinessHours);
  const [breakTime, setBreakTime] = useState<BreakTime>(mockBreakTime);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo permitido é 2MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setLogoFile(file);
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
    if (!tenant) return;
    
    setIsUploadingLogo(true);
    try {
      let logoUrl = tenant.logo_url;
      
      // Upload new logo if file was selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${tenant.id}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }
      
      // Update tenant record with logo, name, and slug
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ 
          logo_url: logoUrl,
          nome: businessName,
          slug: businessSlug,
        })
        .eq('id', tenant.id);
      
      if (updateError) throw updateError;
      
      // Refresh tenant data in context
      await refreshTenant();
      setLogoFile(null);
      
      toast({
        title: 'Aparência atualizada!',
        description: 'As configurações foram salvas com sucesso.',
      });
    } catch (error: any) {
      console.error('Error saving appearance:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message?.includes('slug') 
          ? 'Este slug já está sendo usado por outra barbearia.' 
          : 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
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

  const handleAddDateBlock = async (block: Omit<DateBlock, 'id'>) => {
    await addDateBlock({
      date: block.date,
      description: block.description,
      all_day: block.allDay,
      start_time: block.startTime,
      end_time: block.endTime,
      professional_id: block.professionalId || null,
    });
  };

  const handleRemoveDateBlock = async (id: string) => {
    await deleteDateBlock(id);
  };

  // Convert Supabase dateBlocks to mock-data DateBlock format
  const convertedDateBlocks: DateBlock[] = dateBlocks.map(b => ({
    id: b.id,
    date: b.date,
    description: b.description,
    allDay: b.all_day ?? true,
    startTime: b.start_time ?? undefined,
    endTime: b.end_time ?? undefined,
    professionalId: b.professional_id ?? null,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6 w-full max-w-4xl overflow-hidden">
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
          <TabsList className="bg-secondary/50 p-1 w-full grid grid-cols-2 sm:flex sm:flex-row gap-1 h-auto">
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
                dateBlocks={convertedDateBlocks}
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
              className="space-y-6"
            >
              {/* Public Link Card */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Link2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Link Público</CardTitle>
                      <CardDescription>
                        Compartilhe este link com seus clientes para agendamentos
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 p-3 bg-secondary rounded-lg font-mono text-xs sm:text-sm break-all">
                      {`${window.location.origin}/b/${businessSlug}`}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/b/${businessSlug}`);
                          toast({
                            title: 'Link copiado!',
                            description: 'O link foi copiado para sua área de transferência.',
                          });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => window.open(`/b/${businessSlug}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* QR Code Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                    <div className="bg-white p-3 rounded-lg">
                      <QRCodeSVG
                        id="qr-code"
                        value={`${window.location.origin}/b/${businessSlug}`}
                        size={120}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        <span className="font-medium">QR Code de Agendamento</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Imprima ou compartilhe este QR Code para que seus clientes acessem a página de agendamento rapidamente.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const svg = document.getElementById('qr-code');
                          if (svg) {
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = new window.Image();
                            img.onload = () => {
                              canvas.width = 400;
                              canvas.height = 400;
                              ctx?.fillRect(0, 0, 400, 400);
                              ctx!.fillStyle = 'white';
                              ctx?.fillRect(0, 0, 400, 400);
                              ctx?.drawImage(img, 20, 20, 360, 360);
                              const pngFile = canvas.toDataURL('image/png');
                              const downloadLink = document.createElement('a');
                              downloadLink.download = `qrcode-${businessSlug}.png`;
                              downloadLink.href = pngFile;
                              downloadLink.click();
                            };
                            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar QR Code
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Slug (identificador único)
                    </label>
                    <Input
                      type="text"
                      placeholder="minha-barbearia"
                      value={businessSlug}
                      onChange={(e) => setBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use apenas letras minúsculas, números e hífens
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Business Name Card */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                      <SettingsIcon className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <CardTitle>Nome da Barbearia</CardTitle>
                      <CardDescription>
                        O nome será exibido na área pública de agendamento
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="Nome da sua barbearia"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Logo Card */}
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
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
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
