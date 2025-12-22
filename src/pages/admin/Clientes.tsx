import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Phone, Star, Search, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/use-responsive';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const clients = [
  { name: 'Lucas Mendes', phone: '(11) 99999-8888', visits: 12, points: 120, lastVisit: '22/12/2024' },
  { name: 'Rafael Costa', phone: '(11) 99999-7777', visits: 8, points: 80, lastVisit: '21/12/2024' },
  { name: 'André Souza', phone: '(11) 99999-6666', visits: 15, points: 150, lastVisit: '20/12/2024' },
  { name: 'Bruno Lima', phone: '(11) 99999-5555', visits: 5, points: 50, lastVisit: '19/12/2024' },
  { name: 'Carlos Silva', phone: '(11) 99999-4444', visits: 20, points: 200, lastVisit: '18/12/2024' },
  { name: 'Diego Santos', phone: '(11) 99999-3333', visits: 3, points: 30, lastVisit: '17/12/2024' },
];

const AdminClientes = () => {
  const { isDesktop } = useResponsive();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-gold" />
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e programa de fidelidade
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDesktop && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar cliente..."
                  className="pl-9 bg-secondary/50"
                />
              </div>
            )}
            <Button variant="gold">
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Cliente</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card variant="bento">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-gold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card variant="bento">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">
                  {clients.reduce((sum, c) => sum + c.visits, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Visitas</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card variant="bento">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">
                  {clients.reduce((sum, c) => sum + c.points, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Pontos</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Clients List/Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {isDesktop ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Última Visita</TableHead>
                      <TableHead className="text-center">Visitas</TableHead>
                      <TableHead className="text-center">Pontos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client, index) => (
                      <TableRow key={client.phone} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                              <span className="text-gold font-semibold">
                                {client.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium">{client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                        <TableCell className="text-muted-foreground">{client.lastVisit}</TableCell>
                        <TableCell className="text-center font-semibold">{client.visits}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-gold" />
                            <span className="font-semibold text-gold">{client.points}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="space-y-3">
                  {clients.map((client, index) => (
                    <motion.div
                      key={client.phone}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                          <span className="text-gold font-semibold">
                            {client.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-muted-foreground">Visitas</p>
                          <p className="font-semibold text-foreground">{client.visits}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-3 h-3 text-gold" />
                            <span>Pontos</span>
                          </div>
                          <p className="font-semibold text-gold">{client.points}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminClientes;
