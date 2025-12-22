import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Phone, Star, Search, UserPlus, Gift, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useClients, ClientWithPoints } from '@/hooks/useClients';
import { useLoyaltyRewards } from '@/hooks/useLoyaltyRewards';
import { useLoyaltyConfig } from '@/hooks/useLoyaltyConfig';
import { RedeemRewardDialog } from '@/components/admin/RedeemRewardDialog';

const AdminClientes = () => {
  const { isDesktop } = useResponsive();
  const { clients, isLoading, addClient, redeemPoints } = useClients();
  const { activeRewards } = useLoyaltyRewards();
  const { config: loyaltyConfig } = useLoyaltyConfig();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithPoints | null>(null);
  
  // New client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const filteredClients = clients.filter(
    (client) =>
      client.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.telefone.includes(searchQuery)
  );

  const totalPoints = clients.reduce((sum, c) => sum + c.pontos, 0);
  const totalVisits = clients.reduce((sum, c) => sum + c.visits, 0);

  // Check if client can redeem any reward
  const canRedeem = (points: number) => {
    return activeRewards.some(r => r.points_required <= points);
  };

  const handleAddClient = async () => {
    if (!newClientName.trim() || !newClientPhone.trim()) return;
    
    await addClient({
      nome: newClientName,
      telefone: newClientPhone,
      email: newClientEmail || undefined,
    });

    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setIsAddDialogOpen(false);
  };

  const handleOpenRedeem = (client: ClientWithPoints) => {
    setSelectedClient(client);
    setIsRedeemDialogOpen(true);
  };

  const handleRedeem = async (clientId: string, rewardId: string, points: number) => {
    await redeemPoints(clientId, rewardId, points);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            <Button variant="gold" onClick={() => setIsAddDialogOpen(true)}>
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
                <p className="text-3xl font-bold text-foreground">{totalVisits}</p>
                <p className="text-sm text-muted-foreground">Visitas</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card variant="bento">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Pontos</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Loyalty Program Status */}
        {loyaltyConfig && !loyaltyConfig.enabled && (
          <Card variant="elevated" className="border-gold/30 bg-gold/5">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-gold" />
                <p className="text-sm text-muted-foreground">
                  Programa de fidelidade está <span className="text-foreground font-medium">desativado</span>
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/admin/configuracoes">Ativar</a>
              </Button>
            </CardContent>
          </Card>
        )}

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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </div>
              ) : isDesktop ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-center">Visitas</TableHead>
                      <TableHead className="text-center">Pontos</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                              <span className="text-gold font-semibold">
                                {client.nome.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">{client.nome}</span>
                              {client.email && (
                                <p className="text-xs text-muted-foreground">{client.email}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{client.telefone}</TableCell>
                        <TableCell className="text-center font-semibold">{client.visits}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-gold" />
                            <span className="font-semibold text-gold">{client.pontos}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {canRedeem(client.pontos) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRedeem(client)}
                              className="border-gold/30 text-gold hover:bg-gold/10"
                            >
                              <Gift className="w-4 h-4 mr-1" />
                              Resgatar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="space-y-3">
                  {filteredClients.map((client, index) => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                          <span className="text-gold font-semibold">
                            {client.nome.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.nome}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{client.telefone}</span>
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
                          <p className="font-semibold text-gold">{client.pontos}</p>
                        </div>
                        {canRedeem(client.pontos) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenRedeem(client)}
                            className="text-gold"
                          >
                            <Gift className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Adicione um novo cliente ao seu sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gold"
              onClick={handleAddClient}
              disabled={!newClientName.trim() || !newClientPhone.trim()}
            >
              Adicionar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <RedeemRewardDialog
        open={isRedeemDialogOpen}
        onOpenChange={setIsRedeemDialogOpen}
        client={selectedClient}
        onRedeem={handleRedeem}
      />
    </AdminLayout>
  );
};

export default AdminClientes;
