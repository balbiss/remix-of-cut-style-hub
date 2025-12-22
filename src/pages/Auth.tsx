import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Scissors, Mail, Lock, User, Building2, ArrowLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { LoadingSpinner, GoogleLoadingSpinner } from '@/components/auth/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  barbeariaNome: z.string().min(2, 'Nome da barbearia deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotFormData = z.infer<typeof forgotSchema>;

type AuthMode = 'login' | 'signup' | 'forgot';

// Helper function to check user role and redirect accordingly
const checkRoleAndRedirect = async (userId: string, navigate: ReturnType<typeof useNavigate>) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'barber')
      .maybeSingle();

    if (error) {
      console.error('Error checking user role:', error);
      navigate('/admin');
      return;
    }

    // If user has barber role, redirect to barber area
    if (data) {
      navigate('/barbeiro');
    } else {
      navigate('/admin');
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    navigate('/admin');
  }
};

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const forgotForm = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  useEffect(() => {
    if (user) {
      checkRoleAndRedirect(user.id, navigate);
    }
  }, [user, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error, data: authData } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      let message = 'Erro ao fazer login';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Confirme seu email antes de fazer login';
      }
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Bem-vindo!',
      description: 'Login realizado com sucesso',
    });
    
    // Redirect based on user role
    if (authData?.user) {
      await checkRoleAndRedirect(authData.user.id, navigate);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.nome, data.barbeariaNome);
    setIsLoading(false);

    if (error) {
      let message = 'Erro ao criar conta';
      if (error.message.includes('User already registered')) {
        message = 'Este email já está cadastrado';
      } else if (error.message.includes('duplicate key')) {
        message = 'Este email já está cadastrado';
      }
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Conta criada!',
      description: 'Verifique seu email para confirmar o cadastro. Ou desative a confirmação de email nas configurações do Supabase para testes.',
    });
    setMode('login');
  };

  const handleForgotPassword = async (data: ForgotFormData) => {
    setIsLoading(true);
    const { error } = await resetPassword(data.email);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar email de recuperação',
        variant: 'destructive',
      });
      return;
    }

    setEmailSent(true);
    toast({
      title: 'Email enviado!',
      description: 'Verifique sua caixa de entrada para redefinir sua senha',
    });
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao conectar com Google',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-copper/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <NavLink to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </NavLink>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-copper mb-3">
              <Scissors className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">BarberPro</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === 'login' && 'Entre na sua conta'}
              {mode === 'signup' && 'Crie sua conta'}
              {mode === 'forgot' && 'Recupere sua senha'}
            </p>
          </div>

          {/* Form container */}
          <div className="glass-premium rounded-2xl p-6">
            {mode !== 'forgot' && (
              <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-gold text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'signup'
                      ? 'bg-gold text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cadastrar
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-xs text-muted-foreground">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                        {...loginForm.register('password')}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-gold hover:underline"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-10 bg-gradient-to-r from-gold to-copper text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    {isLoading ? (
                      <LoadingSpinner variant="dots" size="sm" />
                    ) : (
                      'Entrar'
                    )}
                  </Button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || isGoogleLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full h-10 border-border hover:bg-secondary text-sm"
                  >
                    {isGoogleLoading ? (
                      <GoogleLoadingSpinner />
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continuar com Google
                      </>
                    )}
                  </Button>
                </motion.form>
              )}

              {mode === 'signup' && (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={signupForm.handleSubmit(handleSignup)}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <Label htmlFor="signup-nome" className="text-xs text-muted-foreground">Seu nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-nome"
                        type="text"
                        placeholder="João Silva"
                        className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                        {...signupForm.register('nome')}
                      />
                    </div>
                    {signupForm.formState.errors.nome && (
                      <p className="text-xs text-destructive">{signupForm.formState.errors.nome.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-barbearia" className="text-xs text-muted-foreground">Nome da barbearia</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-barbearia"
                        type="text"
                        placeholder="Barbearia do João"
                        className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                        {...signupForm.register('barbeariaNome')}
                      />
                    </div>
                    {signupForm.formState.errors.barbeariaNome && (
                      <p className="text-xs text-destructive">{signupForm.formState.errors.barbeariaNome.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                        {...signupForm.register('email')}
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs text-muted-foreground">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                        {...signupForm.register('password')}
                      />
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-confirm" className="text-xs text-muted-foreground">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                        {...signupForm.register('confirmPassword')}
                      />
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-10 bg-gradient-to-r from-gold to-copper text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    {isLoading ? (
                      <LoadingSpinner variant="dots" size="sm" />
                    ) : (
                      'Criar conta'
                    )}
                  </Button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || isGoogleLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full h-10 border-border hover:bg-secondary text-sm"
                  >
                    {isGoogleLoading ? (
                      <GoogleLoadingSpinner />
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continuar com Google
                      </>
                    )}
                  </Button>
                </motion.form>
              )}

              {mode === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {emailSent ? (
                    <div className="text-center py-3">
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-6 h-6 text-green-500" />
                      </div>
                      <h3 className="text-base font-medium text-foreground mb-1">Email enviado!</h3>
                      <p className="text-muted-foreground text-xs mb-4">
                        Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => { setMode('login'); setEmailSent(false); }}
                        className="w-full h-10 text-sm"
                      >
                        Voltar ao login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="forgot-email" className="text-xs text-muted-foreground">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-9 h-10 bg-secondary border-border focus:border-gold text-sm"
                            {...forgotForm.register('email')}
                          />
                        </div>
                        {forgotForm.formState.errors.email && (
                          <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-10 bg-gradient-to-r from-gold to-copper text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm"
                      >
                        {isLoading ? (
                          <LoadingSpinner variant="bars" size="sm" />
                        ) : (
                          'Enviar link de recuperação'
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMode('login')}
                        className="w-full h-10 text-sm"
                      >
                        Voltar ao login
                      </Button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
