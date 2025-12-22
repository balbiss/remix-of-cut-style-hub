import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, ChevronLeft, ChevronRight, Filter, Plus, Check, X, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/use-responsive';
import { AppointmentForm } from '@/components/admin/AppointmentForm';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

interface Appointment {
  id: string;
  time: string;
  client: string;
  service: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  professional: string;
  clientZap?: string;
}

const initialAppointments: Appointment[] = [
  { id: '1', time: '09:00', client: 'Lucas Mendes', service: 'Corte + Barba', duration: 45, status: 'confirmed', professional: 'Carlos', clientZap: '11999998888' },
  { id: '2', time: '10:00', client: 'Rafael Costa', service: 'Corte Degradê', duration: 40, status: 'confirmed', professional: 'João', clientZap: '11999997777' },
  { id: '3', time: '11:00', client: 'André Souza', service: 'Corte Tradicional', duration: 30, status: 'pending', professional: 'Carlos', clientZap: '11999996666' },
  { id: '4', time: '14:30', client: 'Bruno Lima', service: 'Barba Completa', duration: 25, status: 'confirmed', professional: 'Pedro', clientZap: '11999995555' },
  { id: '5', time: '16:00', client: 'Carlos Silva', service: 'Corte + Barba', duration: 45, status: 'confirmed', professional: 'João', clientZap: '11999994444' },
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const AdminAgenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { isDesktop } = useResponsive();

  const today = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getAppointmentForTime = (time: string) => {
    return appointments.find((apt) => apt.time === time && apt.status !== 'cancelled');
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

  const handleConfirm = (id: string) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status: 'confirmed' } : apt
    ));
    toast.success('Agendamento confirmado!');
  };

  const handleCancel = (id: string) => {
    setCancellingId(id);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (cancellingId) {
      setAppointments(appointments.map(apt => 
        apt.id === cancellingId ? { ...apt, status: 'cancelled' } : apt
      ));
      toast.success('Agendamento cancelado');
    }
    setCancelDialogOpen(false);
    setCancellingId(null);
  };

  const handleSaveAppointment = (data: {
    professional_id: string;
    service_id: string;
    data_hora: string;
    cliente_nome: string;
    cliente_zap: string;
    observacoes?: string;
    status: 'pending' | 'confirmed';
  }) => {
    const time = data.data_hora.split('T')[1]?.substring(0, 5) || '09:00';
    const newAppointment: Appointment = {
      id: String(Date.now()),
      time,
      client: data.cliente_nome,
      service: 'Serviço',
      duration: 30,
      status: data.status,
      professional: 'Profissional',
      clientZap: data.cliente_zap,
    };
    setAppointments([...appointments, newAppointment]);
    toast.success('Agendamento criado com sucesso!');
  };

  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const availableCount = timeSlots.length - appointments.filter(a => a.status !== 'cancelled').length;

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
              <Button variant="outline" size="icon-sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="min-w-[80px] text-xs sm:text-sm">
                Hoje
              </Button>
              <Button variant="outline" size="icon-sm">
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
                    const hasAppointments = index % 2 === 0;
                    
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
                        {hasAppointments && !isSelected && (
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary mt-0.5 sm:mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-primary">{confirmedCount + pendingCount}</p>
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
                              <p className="font-medium text-foreground text-sm sm:text-base truncate">{appointment.client}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {appointment.service} • {appointment.duration} min
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="hidden lg:block text-xs sm:text-sm text-primary">
                                {appointment.professional}
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
    </AdminLayout>
  );
};

export default AdminAgenda;
