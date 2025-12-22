import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Check, Share, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DynamicLogo } from '@/components/DynamicLogo';
import { mockTenant } from '@/lib/mock-data';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 px-4 py-4">
        <div className="flex items-center justify-center">
          <DynamicLogo
            logoUrl={mockTenant.logo_url}
            businessName={mockTenant.nome}
            size="md"
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto w-24 h-24 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/20"
          >
            <Smartphone className="w-12 h-12 text-background" />
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Instale o App
            </h1>
            <p className="text-muted-foreground">
              Tenha acesso rápido ao BarberPro direto da tela inicial do seu celular
            </p>
          </div>

          {/* Install Button or Instructions */}
          {isInstalled ? (
            <Card variant="elevated" className="border-success/30 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">App Instalado!</p>
                    <p className="text-sm text-muted-foreground">
                      Acesse pela tela inicial
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Button
              variant="gold"
              size="xl"
              onClick={handleInstall}
              className="w-full animate-glow"
            >
              <Download className="w-5 h-5 mr-2" />
              Instalar Agora
            </Button>
          ) : isIOS ? (
            <Card variant="elevated">
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para instalar no iPhone/iPad:
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-semibold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground flex items-center gap-2">
                        Toque em <Share className="w-4 h-4 text-gold" /> Compartilhar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-semibold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        Selecione "Adicionar à Tela de Início"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-semibold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        Toque em "Adicionar"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card variant="elevated">
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para instalar no Android:
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-semibold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground flex items-center gap-2">
                        Toque em <MoreVertical className="w-4 h-4 text-gold" /> Menu do navegador
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-semibold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        Selecione "Instalar app" ou "Adicionar à tela inicial"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Offline', desc: 'Funciona sem internet' },
              { label: 'Rápido', desc: 'Acesso instantâneo' },
              { label: 'Notificações', desc: 'Lembretes' },
            ].map((feat) => (
              <div key={feat.label} className="text-center">
                <p className="text-sm font-semibold text-gold">{feat.label}</p>
                <p className="text-xs text-muted-foreground">{feat.desc}</p>
              </div>
            ))}
          </div>

          {/* Back Link */}
          <Link to="/" className="block">
            <Button variant="ghost" className="text-muted-foreground">
              Voltar ao Site
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default Install;
