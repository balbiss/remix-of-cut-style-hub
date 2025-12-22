import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, CreditCard, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/use-responsive';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const transactions = [
  { date: '22/12', client: 'Lucas Mendes', service: 'Corte + Barba', value: 55, status: 'paid', method: 'pix' },
  { date: '22/12', client: 'Rafael Costa', service: 'Corte Degradê', value: 45, status: 'paid', method: 'card' },
  { date: '21/12', client: 'André Souza', service: 'Corte Tradicional', value: 35, status: 'paid', method: 'cash' },
  { date: '21/12', client: 'Bruno Lima', service: 'Barba Completa', value: 30, status: 'pending', method: 'pix' },
  { date: '20/12', client: 'Carlos Silva', service: 'Corte + Barba', value: 55, status: 'paid', method: 'card' },
  { date: '20/12', client: 'Diego Santos', service: 'Corte Degradê', value: 45, status: 'paid', method: 'pix' },
  { date: '19/12', client: 'Eduardo Lima', service: 'Corte Tradicional', value: 35, status: 'paid', method: 'cash' },
];

const weeklyRevenue = [
  { day: 'Seg', value: 450 },
  { day: 'Ter', value: 380 },
  { day: 'Qua', value: 520 },
  { day: 'Qui', value: 410 },
  { day: 'Sex', value: 680 },
  { day: 'Sáb', value: 890 },
  { day: 'Dom', value: 0 },
];

const maxRevenue = Math.max(...weeklyRevenue.map(d => d.value));

const AdminFinanceiro = () => {
  const { isDesktop } = useResponsive();
  const totalRevenue = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.value, 0);
  const pendingRevenue = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.value, 0);
  const pixTotal = transactions.filter(t => t.method === 'pix' && t.status === 'paid').reduce((sum, t) => sum + t.value, 0);
  const cardTotal = transactions.filter(t => t.method === 'card' && t.status === 'paid').reduce((sum, t) => sum + t.value, 0);
  const cashTotal = transactions.filter(t => t.method === 'cash' && t.status === 'paid').reduce((sum, t) => sum + t.value, 0);

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
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold gold-text truncate">
                      R$ {totalRevenue.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-success shrink-0" />
                      <span className="text-xs sm:text-sm text-success">+15%</span>
                    </div>
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
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                      R$ {pendingRevenue.toFixed(2)}
                    </p>
                    <span className="text-xs sm:text-sm text-muted-foreground">1 transação</span>
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
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                      R$ {pixTotal.toFixed(2)}
                    </p>
                    <span className="text-xs sm:text-sm text-muted-foreground">3 transações</span>
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
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                      R$ {cardTotal.toFixed(2)}
                    </p>
                    <span className="text-xs sm:text-sm text-muted-foreground">2 transações</span>
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
                        {item.value > 0 ? `R$${item.value}` : '-'}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.value / maxRevenue) * 100}%` }}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                        className={`w-full rounded-t-md ${
                          item.value === maxRevenue ? 'gold-gradient' : 
                          item.value > 0 ? 'bg-primary/50' : 
                          'bg-secondary'
                        }`}
                        style={{ minHeight: item.value > 0 ? '8px' : '4px' }}
                      />
                      <span className="text-[9px] sm:text-xs text-muted-foreground">{item.day}</span>
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
                {isDesktop ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                          <TableCell className="font-medium">{tx.client}</TableCell>
                          <TableCell className="text-muted-foreground">{tx.service}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.method === 'pix' && <DollarSign className="w-4 h-4 text-emerald-500" />}
                              {tx.method === 'card' && <CreditCard className="w-4 h-4 text-blue-500" />}
                              {tx.method === 'cash' && <Banknote className="w-4 h-4 text-primary" />}
                              <span className="capitalize">{tx.method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.status === 'paid'
                                ? 'bg-success/20 text-success'
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            R$ {tx.value.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {transactions.map((tx, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 gap-2"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="text-xs text-muted-foreground shrink-0 w-10">
                            {tx.date}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{tx.client}</p>
                            <p className="text-xs text-muted-foreground truncate">{tx.service}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            tx.status === 'paid'
                              ? 'bg-success/20 text-success'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                          <span className="font-bold text-foreground text-sm">
                            R$ {tx.value.toFixed(2)}
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
