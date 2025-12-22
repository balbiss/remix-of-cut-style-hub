import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, CreditCard, Banknote, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/use-responsive';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const AdminFinanceiro = () => {
  const { isDesktop } = useResponsive();
  const { tenant } = useAuth();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id
  });

  // Calculate stats from real data
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const pendingCount = transactions.filter(t => t.type === 'pending').length;
  const pendingRevenue = transactions
    .filter(t => t.type === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pixTransactions = transactions.filter(t => t.method === 'pix' && t.type === 'income');
  const pixTotal = pixTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const cardTransactions = transactions.filter(t => t.method === 'card' && t.type === 'income');
  const cardTotal = cardTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const cashTransactions = transactions.filter(t => t.method === 'cash' && t.type === 'income');
  const cashTotal = cashTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate weekly revenue
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyRevenue = weekDays.map(day => {
    const dayTransactions = transactions.filter(t => {
      if (!t.created_at || t.type !== 'income') return false;
      const txDate = new Date(t.created_at);
      return format(txDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    return {
      day: format(day, 'EEE', { locale: ptBR }).slice(0, 3),
      value: dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    };
  });

  const maxRevenue = Math.max(...weeklyRevenue.map(d => d.value), 1);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM', { locale: ptBR });
  };

  const getMethodIcon = (method: string | null) => {
    switch (method) {
      case 'pix': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-500" />;
      default: return <Banknote className="w-4 h-4 text-primary" />;
    }
  };

  const getMethodLabel = (method: string | null) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'card': return 'Cartão';
      default: return 'Dinheiro';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        {/* Page Header */}
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            Financeiro
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Acompanhe suas receitas e transações</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card variant="bento">
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Receita Total</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold gold-text truncate">
                        R$ {totalRevenue.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card variant="bento">
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Pendente</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                          R$ {pendingRevenue.toFixed(2)}
                        </p>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {pendingCount} {pendingCount === 1 ? 'transação' : 'transações'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card variant="bento">
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">PIX</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                          R$ {pixTotal.toFixed(2)}
                        </p>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {pixTransactions.length} {pixTransactions.length === 1 ? 'transação' : 'transações'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card variant="bento">
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Cartão</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                          R$ {cardTotal.toFixed(2)}
                        </p>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {cardTransactions.length} {cardTransactions.length === 1 ? 'transação' : 'transações'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chart + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <Card variant="elevated" className="h-full">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Receita Semanal
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="flex items-end justify-between h-36 sm:h-48 gap-1 sm:gap-2">
                  {weeklyRevenue.map((item, index) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                      <span className="text-[9px] sm:text-xs text-muted-foreground">
                        {item.value > 0 ? `R$${item.value.toFixed(0)}` : '-'}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: item.value > 0 ? `${(item.value / maxRevenue) * 100}%` : '4px' }}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                        className={`w-full rounded-t-md ${
                          item.value === maxRevenue && item.value > 0 ? 'gold-gradient' : 
                          item.value > 0 ? 'bg-primary/50' : 
                          'bg-secondary'
                        }`}
                        style={{ minHeight: item.value > 0 ? '8px' : '4px' }}
                      />
                      <span className="text-[9px] sm:text-xs text-muted-foreground capitalize">{item.day}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Methods Summary */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs sm:text-sm text-muted-foreground">PIX</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">R$ {pixTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Cartão</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">R$ {cardTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Dinheiro</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">R$ {cashTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transactions Table/List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card variant="elevated">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Últimas Transações</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Receipt className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma transação</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      As transações aparecerão aqui quando você começar a receber pagamentos.
                    </p>
                  </div>
                ) : isDesktop ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground">{formatDate(tx.created_at)}</TableCell>
                          <TableCell className="font-medium">{tx.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMethodIcon(tx.method)}
                              <span>{getMethodLabel(tx.method)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.type === 'income'
                                ? 'bg-success/20 text-success'
                                : tx.type === 'expense'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {tx.type === 'income' ? 'Entrada' : tx.type === 'expense' ? 'Saída' : 'Pendente'}
                            </span>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            tx.type === 'expense' ? 'text-destructive' : 'text-foreground'
                          }`}>
                            {tx.type === 'expense' ? '-' : ''}R$ {Number(tx.amount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {transactions.map((tx, index) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 gap-2"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="text-xs text-muted-foreground shrink-0 w-10">
                            {formatDate(tx.created_at)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{tx.description || '-'}</p>
                            <p className="text-xs text-muted-foreground truncate">{getMethodLabel(tx.method)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            tx.type === 'income'
                              ? 'bg-success/20 text-success'
                              : tx.type === 'expense'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {tx.type === 'income' ? 'Entrada' : tx.type === 'expense' ? 'Saída' : 'Pendente'}
                          </span>
                          <span className={`font-bold text-sm ${
                            tx.type === 'expense' ? 'text-destructive' : 'text-foreground'
                          }`}>
                            R$ {Number(tx.amount).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;