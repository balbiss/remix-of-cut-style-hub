import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useServices, Service } from '@/hooks/useServices';
import { motion } from 'framer-motion';
import { Scissors, Plus, Pencil, Trash2, Clock, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminServicos = () => {
  const { services, loading, addService, updateService, deleteService } = useServices();
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      const success = await deleteService(deletingId);
      if (success) {
        toast.success('Serviço removido com sucesso');
      }
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSave = async (data: Omit<Service, 'id' | 'tenant_id'>) => {
    if (editingService) {
      const success = await updateService(editingService.id, data);
      if (success) {
        toast.success('Serviço atualizado com sucesso');
      }
    } else {
      const result = await addService(data);
      if (result) {
        toast.success('Serviço adicionado com sucesso');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
              Serviços
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie os serviços e preços da sua barbearia
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            Novo Serviço
          </Button>
        </div>

        {/* Services Grid */}
        {services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="elevated" className="h-full">
                  <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                            {service.nome}
                          </h3>
                          <Badge variant={service.ativo ? 'default' : 'secondary'} size="sm">
                            {service.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {service.descricao && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-2">
                        {service.descricao}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-primary">
                          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-bold text-base sm:text-lg">
                            R$ {service.preco.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">{service.duracao} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {services.length === 0 && (
          <Card variant="elevated">
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
              <Scissors className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-base sm:text-lg">Nenhum serviço</h3>
              <p className="text-muted-foreground text-center mt-1 text-sm">
                Adicione o primeiro serviço da sua barbearia
              </p>
              <Button onClick={handleAdd} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Serviço
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover serviço"
        description="Tem certeza que deseja remover este serviço? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        confirmText="Remover"
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default AdminServicos;
