import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfessionalForm } from '@/components/admin/ProfessionalForm';
import { ProfessionalScheduleForm } from '@/components/admin/ProfessionalScheduleForm';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { mockProfessionals, mockDateBlocks, Professional, ProfessionalSchedule, DateBlock } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, Phone, User, Calendar } from 'lucide-react';
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
  const [professionals, setProfessionals] = useState<Professional[]>(mockProfessionals);
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>(mockDateBlocks);
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

  const confirmDelete = () => {
    if (deletingId) {
      setProfessionals(professionals.filter(p => p.id !== deletingId));
      toast.success('Profissional removido com sucesso');
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSave = (data: Omit<Professional, 'id' | 'tenant_id'>) => {
    if (editingProfessional) {
      setProfessionals(professionals.map(p => 
        p.id === editingProfessional.id 
          ? { ...p, ...data }
          : p
      ));
      toast.success('Profissional atualizado com sucesso');
    } else {
      const newProfessional: Professional = {
        id: String(Date.now()),
        tenant_id: '1',
        ...data,
      };
      setProfessionals([...professionals, newProfessional]);
      toast.success('Profissional adicionado com sucesso');
    }
  };

  const handleSaveSchedule = (schedule: ProfessionalSchedule) => {
    if (schedulingProfessional) {
      setProfessionals(professionals.map(p => 
        p.id === schedulingProfessional.id 
          ? { ...p, schedule }
          : p
      ));
      toast.success('Agenda configurada com sucesso');
    }
  };

  const handleAddBlock = (block: Omit<DateBlock, 'id'>) => {
    const newBlock: DateBlock = {
      ...block,
      id: String(Date.now()),
    };
    setDateBlocks([...dateBlocks, newBlock]);
    toast.success('Folga adicionada');
  };

  const handleRemoveBlock = (id: string) => {
    setDateBlocks(dateBlocks.filter(b => b.id !== id));
    toast.success('Folga removida');
  };

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
        {isDesktop ? (
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
                      <TableCell>{professional.telefone}</TableCell>
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
        ) : (
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
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                          <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="truncate">{professional.telefone}</span>
                        </div>
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
        )}

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
      />

      {/* Schedule Form */}
      <ProfessionalScheduleForm
        open={scheduleFormOpen}
        onOpenChange={setScheduleFormOpen}
        professional={schedulingProfessional}
        dateBlocks={dateBlocks}
        onSave={handleSaveSchedule}
        onAddBlock={handleAddBlock}
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
