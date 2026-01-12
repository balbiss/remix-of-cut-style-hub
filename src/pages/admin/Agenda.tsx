import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, ChevronLeft, ChevronRight, Filter, Plus, Check, X, MoreVertical, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/use-responsive';
import { AppointmentForm } from '@/components/admin/AppointmentForm';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useAppointments } from '@/hooks/useAppointments';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const AdminAgenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { appointments, loading, addAppointment, updateAppointmentStatus, refetch } = useAppointments({ date: selectedDate });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const { isDesktop } = useResponsive();

  const today = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const appointmentsByTime = useMemo(() => {
    const map: Record<string, typeof appointments[0]> = {};
    appointments.forEach((apt) => {
      if (apt.status !== 'cancelled') {
        const time = format(parseISO(apt.data_hora), 'HH:mm');
        map[time] = apt;
      }
    });
    return map;
  }, [appointments]);

  const getAppointmentForTime = (time: string) => {
    return appointmentsByTime[time];
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const handleNewAppointment = (time?: string) => {
    setSelectedTime(time);
    setFormOpen(true);
  };

  const handleConfirm = async (id: string) => {
    const success = await updateAppointmentStatus(id, 'confirmed');
    if (success) {
      toast.success('Agendamento confirmado!');
    }
  };

  const handleCancel = (id: string) => {
    setCancellingId(id);
    setCancelDialogOpen(true);
  };

  const handleRefund = (id: string) => {
    setRefundingId(id);
    setRefundDialogOpen(true);
  };

  const confirmRefund = async () => {
    if (!refundingId) return;

    setProcessingRefund(true);
    try {
      // Buscar dados do agendamento
      const appointment = appointments.find(a => a.id === refundingId);
      if (!appointment || !appointment.pix_payment_id) {
        toast.error('Agendamento não encontrado ou sem pagamento PIX');
        setRefundDialogOpen(false);
        setRefundingId(null);
        setRefundReason('');
        return;
      }

      // Chamar Edge Function para estorno
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/refund-pix-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            payment_id: appointment.pix_payment_id,
            appointment_id: refundingId,
            tenant_id: appointment.tenant_id,
            reason: refundReason || 'Estorno solicitado pelo administrador',
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Atualizar agendamento
        await updateAppointmentStatus(refundingId, 'cancelled');
        
        // Criar notificação
        await supabase
          .from('notifications' as any)
          .insert({
            tenant_id: appointment.tenant_id,
            type: 'refund_processed',
            title: 'Estorno Processado',
            message: `Estorno de R$ ${((appointment as any).prepaid_amount || 0).toFixed(2)} processado para o agendamento de ${appointment.cliente_nome}. Motivo: ${refundReason || 'Não informado'}`,
            appointment_id: refundingId,
            read: false,
          });

        toast.success('Estorno processado com sucesso!');
        setRefundDialogOpen(false);
        setRefundingId(null);
        setRefundReason('');
        refetch();
      } else {
        toast.error(result.error || 'Erro ao processar estorno');
      }
    } catch (error: any) {
      console.error('Erro ao processar estorno:', error);
      toast.error('Erro ao processar estorno. Tente novamente.');
    } finally {
      setProcessingRefund(false);
    }
  };

  const confirmCancel = async () => {
    if (cancellingId) {
      const success = await updateAppointmentStatus(cancellingId, 'cancelled');
      if (success) {
        toast.success('Agendamento cancelado');
      }
    }
    setCancelDialogOpen(false);
    setCancellingId(null);
  };

  const handleSaveAppointment = async (data: {
    professional_id: string;
    service_id: string;
    data_hora: string;
    cliente_nome: string;
    cliente_zap: string;
    observacoes?: string;
    status: 'pending' | 'confirmed';
  }) => {
    const result = await addAppointment(data);
    if (result) {
      toast.success('Agendamento criado com sucesso!');
    }
  };

  const activeAppointments = appointments.filter(a => a.status !== 'cancelled');
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const availableCount = timeSlots.length - activeAppointments.length;

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
        {/* Page Header */}
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
              Agenda
            </h1>
            <p className="text-muted-foreground mt-1 capitalize text-sm sm:text-base truncate">{today}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
              }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="min-w-[80px] text-xs sm:text-sm" onClick={() => setSelectedDate(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                setSelectedDate(newDate);
              }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {isDesktop && (
              <>
                <Button variant="outline" size="sm" className="ml-2">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button onClick={() => handleNewAppointment()} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Agendamento
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Add Button */}
        {!isDesktop && (
          <Button onClick={() => handleNewAppointment()} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        )}

        {/* Desktop Layout: Week View + Schedule Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Week Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-4"
          >
            <Card variant="elevated">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Semana</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {weekDates.map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center p-1.5 sm:p-2 lg:p-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : isToday
                            ? 'bg-primary/20 text-primary'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <span className="text-[10px] sm:text-xs font-medium">{weekDays[index]}</span>
                        <span className={`text-sm sm:text-lg lg:text-xl font-bold ${isSelected ? '' : 'text-foreground'}`}>
                          {date.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-primary">{activeAppointments.length}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Agendados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-success">{confirmedCount}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Confirmados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{availableCount}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Disponíveis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Schedule Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8"
          >
            <Card variant="elevated">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Horários do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                  {timeSlots.map((time, index) => {
                    const appointment = getAppointmentForTime(time);
                    
                    return (
                      <motion.div
                        key={time}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 lg:p-4 rounded-lg transition-colors ${
                          appointment
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-secondary/30 hover:bg-secondary/50 cursor-pointer'
                        }`}
                        onClick={() => !appointment && handleNewAppointment(time)}
                      >
                        <div className="w-12 sm:w-16 text-center shrink-0">
                          <span className={`font-semibold text-sm sm:text-base ${
                            appointment ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {time}
                          </span>
                        </div>
                        
                        {appointment ? (
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 min-w-0">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm sm:text-base truncate">{appointment.cliente_nome}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {appointment.service?.nome || 'Serviço'} • {appointment.service?.duracao || 30} min
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="hidden lg:block text-xs sm:text-sm text-primary">
                                {appointment.professional?.nome || 'Profissional'}
                              </span>
                              <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                                appointment.status === 'confirmed'
                                  ? 'bg-success/20 text-success'
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                              </span>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 sm:h-8 sm:w-8">
                                    <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {appointment.status === 'pending' && (
                                    <DropdownMenuItem onClick={() => handleConfirm(appointment.id)}>
                                      <Check className="w-4 h-4 mr-2 text-success" />
                                      Confirmar
                                    </DropdownMenuItem>
                                  )}
                                  {(() => {
                                    // Debug: verificar condições
                                    const hasPixPayment = !!appointment.pix_payment_id;
                                    const isConfirmed = appointment.status === 'confirmed';
                                    const notRefunded = !appointment.refunded;
                                    const shouldShow = isConfirmed && hasPixPayment && notRefunded;
                                    
                                    // Log para debug (remover depois)
                                    if (isConfirmed) {
                                      console.log('🔍 Agendamento confirmado:', {
                                        id: appointment.id,
                                        cliente: appointment.cliente_nome,
                                        status: appointment.status,
                                        hasPixPayment,
                                        pix_payment_id: appointment.pix_payment_id,
                                        refunded: appointment.refunded,
                                        shouldShow,
                                      });
                                    }
                                    
                                    return shouldShow ? (
                                      <DropdownMenuItem onClick={() => handleRefund(appointment.id)}>
                                        <RotateCcw className="w-4 h-4 mr-2 text-amber-600" />
                                        Estornar Pagamento
                                      </DropdownMenuItem>
                                    ) : null;
                                  })()}
                                  <DropdownMenuItem onClick={() => handleCancel(appointment.id)}>
                                    <X className="w-4 h-4 mr-2 text-destructive" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="text-muted-foreground text-xs sm:text-sm">Horário disponível</span>
                            <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSave={handleSaveAppointment}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancelar agendamento"
        description="Tem certeza que deseja cancelar este agendamento? O cliente será notificado."
        onConfirm={confirmCancel}
        confirmText="Cancelar Agendamento"
        variant="destructive"
      />

      {/* Dialog de Estorno */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar Pagamento PIX</DialogTitle>
            <DialogDescription>
              O estorno será processado e o valor será devolvido ao cliente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="refund-reason">Motivo do estorno *</Label>
              <Textarea
                id="refund-reason"
                placeholder="Ex: Cliente cancelou o agendamento, erro no pagamento, etc."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRefundDialogOpen(false);
                setRefundReason('');
                setRefundingId(null);
              }}
              disabled={processingRefund}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRefund}
              disabled={processingRefund || !refundReason.trim()}
            >
              {processingRefund ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Estorno'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAgenda;
