import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Scissors, User } from 'lucide-react';
import { DynamicLogo } from '@/components/DynamicLogo';

interface BarberLayoutProps {
  children: React.ReactNode;
  professionalName: string;
}

export function BarberLayout({ children, professionalName }: BarberLayoutProps) {
  const { signOut, tenant } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <DynamicLogo logoUrl={tenant?.logo_url || null} businessName={tenant?.nome || 'Barbearia'} size="sm" />
            <div className="hidden md:block">
              <span className="text-sm text-muted-foreground">|</span>
              <span className="ml-3 text-sm font-medium">Painel do Barbeiro</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="hidden md:inline">{professionalName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
