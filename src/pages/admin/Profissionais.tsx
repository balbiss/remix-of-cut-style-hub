import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfessionalForm } from '@/components/admin/ProfessionalForm';
import { ProfessionalScheduleForm } from '@/components/admin/ProfessionalScheduleForm';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useProfessionals, Professional } from '@/hooks/useProfessionals';
import { useDateBlocks, DateBlock } from '@/hooks/useDateBlocks';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, Phone, User, Calendar, Loader2 } from 'lucide-react';
import { useResponsive } from '@/hooks/use-responsive';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const AdminProfissionais = () => {
  const { professionals, loading, addProfessional, updateProfessional, deleteProfessional, createBarberUser } = useProfessionals();
  const { dateBlocks, addDateBlock, deleteDateBlock } = useDateBlocks();
  const [formOpen, setFormOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [schedulingProfessional, setSchedulingProfessional] = useState<Professional | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { isDesktop } = useResponsive();

  const handleAdd = () => {
    setEditingProfessional(null);
    setFormOpen(true);
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormOpen(true);
  };

  const handleSchedule = (professional: Professional) => {
    setSchedulingProfessional(professional);
    setScheduleFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      const success = await deleteProfessional(deletingId);
      if (success) {
        toast.success('Profissional removido com sucesso');
      }
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSave = async (data: Omit<Professional, 'id' | 'tenant_id'>) => {
    if (editingProfessional) {
      const success = await updateProfessional(editingProfessional.id, data);
      if (success) {
        toast.success('Profissional atualizado com sucesso');
      }
    } else {
      const result = await addProfessional(data);
      if (result) {
        toast.success('Profissional adicionado com sucesso');
      }
    }
  };

  const handleSaveSchedule = async (schedule: Professional['schedule']) => {
    if (schedulingProfessional && schedule) {
      const success = await updateProfessional(schedulingProfessional.id, { schedule });
      if (success) {
        toast.success('Agenda configurada com sucesso');
      }
    }
  };

  const handleAddBlock = async (block: Omit<DateBlock, 'id' | 'tenant_id'>) => {
    const result = await addDateBlock(block);
    if (result) {
      toast.success('Folga adicionada');
    }
  };

  const handleRemoveBlock = async (id: string) => {
    const success = await deleteDateBlock(id);
    if (success) {
      toast.success('Folga removida');
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
      <div className="space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
              Equipe
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie os profissionais da sua barbearia
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2 shrink-0 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Novo Profissional
          </Button>
        </div>

        {/* Desktop Table View */}
        {isDesktop && professionals.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card variant="elevated">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={professional.avatar_url || undefined} />
                          <AvatarFallback className="bg-secondary text-gold">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{professional.nome}</TableCell>
                      <TableCell>{professional.telefone || '-'}</TableCell>
                      <TableCell>{professional.especialidade || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={professional.ativo ? 'default' : 'secondary'}>
                          {professional.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSchedule(professional)}
                            title="Configurar Agenda"
                          >
                            <Calendar className="w-4 h-4 text-gold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(professional)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(professional.id)}
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        ) : !isDesktop && professionals.length > 0 ? (
          /* Mobile Cards View */
          <div className="space-y-3">
            {professionals.map((professional, index) => (
              <motion.div
                key={professional.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="elevated">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 sm:w-14 sm:h-14 shrink-0">
                        <AvatarImage src={professional.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary text-primary">
                          <User className="w-5 h-5 sm:w-6 sm:h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                            {professional.nome}
                          </h3>
                          <Badge variant={professional.ativo ? 'default' : 'secondary'} size="sm" className="shrink-0">
                            {professional.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {professional.especialidade && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                            {professional.especialidade}
                          </p>
                        )}
                        {professional.telefone && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="truncate">{professional.telefone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleSchedule(professional)}
                        >
                          <Calendar className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(professional)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(professional.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : null}

        {/* Empty State */}
        {professionals.length === 0 && (
          <Card variant="elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Nenhum profissional</h3>
              <p className="text-muted-foreground text-center mt-1">
                Adicione o primeiro profissional da sua equipe
              </p>
              <Button onClick={handleAdd} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Profissional
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Modal */}
      <ProfessionalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        professional={editingProfessional}
        onSave={handleSave}
        onCreateLogin={createBarberUser}
      />

      {/* Schedule Form */}
      <ProfessionalScheduleForm
        open={scheduleFormOpen}
        onOpenChange={setScheduleFormOpen}
        professional={schedulingProfessional}
        dateBlocks={dateBlocks.map(b => ({
          id: b.id,
          date: b.date,
          description: b.description,
          allDay: b.all_day,
          startTime: b.start_time || undefined,
          endTime: b.end_time || undefined,
          professionalId: b.professional_id,
        }))}
        onSave={handleSaveSchedule}
        onAddBlock={(block) => handleAddBlock({
          date: block.date,
          description: block.description,
          all_day: block.allDay,
          start_time: block.startTime || null,
          end_time: block.endTime || null,
          professional_id: block.professionalId || null,
        })}
        onRemoveBlock={handleRemoveBlock}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover profissional"
        description="Tem certeza que deseja remover este profissional? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        confirmText="Remover"
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default AdminProfissionais;
