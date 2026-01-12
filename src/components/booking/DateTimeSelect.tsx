import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ProfessionalSchedule {
  useBusinessHours: boolean;
  workDays: number[];
  workHours: {
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
  };
}

interface BusinessHour {
  day_of_week: number;
  is_open: boolean;
  periods: {
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
  } | null;
}

interface DateBlock {
  date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  professional_id: string | null;
}

interface Appointment {
  data_hora: string;
  service_duration: number;
  status?: string;
  tolerance_expires_at?: string | null;
}

interface DateTimeSelectProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  professionalSchedule?: ProfessionalSchedule | null;
  businessHours?: BusinessHour[];
  dateBlocks?: DateBlock[];
  professionalId?: string | null;
  appointments?: Appointment[];
  serviceDuration?: number;
}

export function DateTimeSelect({ 
  selectedDate, 
  selectedTime, 
  onDateSelect, 
  onTimeSelect,
  professionalSchedule,
  businessHours = [],
  dateBlocks = [],
  professionalId,
  appointments = [],
  serviceDuration = 30
}: DateTimeSelectProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get working days based on professional schedule or business hours
  const getWorkingDays = (): number[] => {
    if (professionalSchedule) {
      if (professionalSchedule.useBusinessHours && businessHours.length > 0) {
        return businessHours
          .filter(bh => bh.is_open)
          .map(bh => bh.day_of_week);
      }
      // If workDays is defined and not empty, use it
      if (professionalSchedule.workDays && professionalSchedule.workDays.length > 0) {
        return professionalSchedule.workDays;
      }
    }
    
    // Default: Mon-Sat (if no schedule or empty workDays)
    return [1, 2, 3, 4, 5, 6];
  };

  const workingDays = getWorkingDays();

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Past dates
    if (date < today) return true;
    
    // Check if this day is a working day
    if (!workingDays.includes(dayOfWeek)) return true;
    
    // Check for all-day blocks
    const hasAllDayBlock = dateBlocks.some(block => 
      block.date === dateStr && 
      block.all_day && 
      (block.professional_id === professionalId || block.professional_id === null)
    );
    if (hasAllDayBlock) return true;
    
    return false;
  };

  const isSameDay = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Generate time slots based on professional schedule or business hours
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    let periods: { morningStart?: string; morningEnd?: string; afternoonStart?: string; afternoonEnd?: string } | null = null;
    
    // Get periods from schedule
    if (professionalSchedule) {
      if (professionalSchedule.useBusinessHours && businessHours.length > 0) {
        const businessDay = businessHours.find(bh => bh.day_of_week === dayOfWeek);
        periods = businessDay?.periods || null;
      } else {
        periods = professionalSchedule.workHours || null;
      }
    } else if (businessHours.length > 0) {
      const businessDay = businessHours.find(bh => bh.day_of_week === dayOfWeek);
      periods = businessDay?.periods || null;
    }
    
    // Default hours if nothing configured
    if (!periods) {
      periods = {
        morningStart: '09:00',
        morningEnd: '12:00',
        afternoonStart: '14:00',
        afternoonEnd: '19:00'
      };
    }
    
    const slots: string[] = [];
    
    // Generate morning slots
    if (periods.morningStart && periods.morningEnd) {
      const [startH, startM] = periods.morningStart.split(':').map(Number);
      const [endH, endM] = periods.morningEnd.split(':').map(Number);
      
      let currentH = startH;
      let currentM = startM;
      
      while (currentH < endH || (currentH === endH && currentM < endM)) {
        slots.push(`${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
        currentM += 30;
        if (currentM >= 60) {
          currentH += 1;
          currentM = 0;
        }
      }
    }
    
    // Generate afternoon slots
    if (periods.afternoonStart && periods.afternoonEnd) {
      const [startH, startM] = periods.afternoonStart.split(':').map(Number);
      const [endH, endM] = periods.afternoonEnd.split(':').map(Number);
      
      let currentH = startH;
      let currentM = startM;
      
      while (currentH < endH || (currentH === endH && currentM < endM)) {
        slots.push(`${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
        currentM += 30;
        if (currentM >= 60) {
          currentH += 1;
          currentM = 0;
        }
      }
    }
    
    // Filter out blocked time slots
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const blocksForDay = dateBlocks.filter(block => 
      block.date === dateStr && 
      !block.all_day &&
      (block.professional_id === professionalId || block.professional_id === null)
    );
    
    // Helper to convert time string to minutes
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    
    // Filter appointments for this date
    // Excluir agendamentos expirados (pending_payment com tolerance_expires_at no passado)
    const now = new Date();
    const appointmentsForDay = appointments.filter(apt => {
      const aptDate = new Date(apt.data_hora);
      const isSameDate = format(aptDate, 'yyyy-MM-dd') === dateStr;
      
      if (!isSameDate) return false;
      
      // Se for agendamento pending_payment, verificar se não expirou
      const aptStatus = (apt as any).status;
      const aptToleranceExpiresAt = (apt as any).tolerance_expires_at;
      
      if (aptStatus === 'pending_payment') {
        if (aptToleranceExpiresAt) {
          const expiresAt = new Date(aptToleranceExpiresAt);
          const isValid = now <= expiresAt;
          
          if (!isValid) {
            console.log('⏰ Agendamento pending_payment expirado, não bloqueando horário:', {
              data_hora: apt.data_hora,
              expiresAt: expiresAt.toISOString(),
              now: now.toISOString(),
            });
            return false; // Agendamento expirado, não bloquear horário
          }
          
          console.log('🔒 Agendamento pending_payment válido, bloqueando horário:', {
            data_hora: apt.data_hora,
            expiresAt: expiresAt.toISOString(),
            now: now.toISOString(),
          });
        } else {
          // Se não tem tolerance_expires_at, considerar como válido (não deve acontecer, mas por segurança)
          console.warn('⚠️ Agendamento pending_payment sem tolerance_expires_at:', apt.data_hora);
        }
      }
      
      return true; // Incluir agendamento (confirmed, pending, ou pending_payment válido)
    });
    
    console.log('📅 Agendamentos para o dia', dateStr, ':', {
      total: appointments.length,
      filtrados: appointmentsForDay.length,
      pending_payment: appointmentsForDay.filter((a: any) => (a as any).status === 'pending_payment').length,
    });
    
    return slots.filter(slot => {
      const slotTime = slot;
      const slotMinutes = timeToMinutes(slotTime);
      
      // Check if blocked by date block
      const isBlocked = blocksForDay.some(block => {
        if (!block.start_time || !block.end_time) return false;
        return slotTime >= block.start_time && slotTime < block.end_time;
      });
      if (isBlocked) return false;
      
      // Check if occupied by existing appointment
      const isOccupied = appointmentsForDay.some(apt => {
        const aptDate = new Date(apt.data_hora);
        const aptTime = `${String(aptDate.getHours()).padStart(2, '0')}:${String(aptDate.getMinutes()).padStart(2, '0')}`;
        const aptMinutes = timeToMinutes(aptTime);
        const aptDuration = apt.service_duration || 30;
        
        // Check if the slot falls within an existing appointment's time range
        // Slot is occupied if: slot starts during appointment OR appointment starts during slot's duration
        const slotEndMinutes = slotMinutes + serviceDuration;
        const aptEndMinutes = aptMinutes + aptDuration;
        
        // Overlap check: slots overlap if one starts before the other ends
        return (slotMinutes < aptEndMinutes && slotEndMinutes > aptMinutes);
      });
      
      return !isOccupied;
    });
  }, [selectedDate, professionalSchedule, businessHours, dateBlocks, professionalId, appointments, serviceDuration]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-center text-foreground">
        Escolha Data e Horário
      </h2>
      
      {/* Calendar */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gold" />
            <span className="font-semibold text-foreground">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const disabled = isDateDisabled(day);
            const selected = isSameDay(day);
            
            return (
              <motion.button
                key={day}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                onClick={() => {
                  if (!disabled) {
                    onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                  }
                }}
                disabled={disabled}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  disabled
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : selected
                    ? 'bg-gold text-primary-foreground shadow-gold'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {day}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-sm text-muted-foreground text-center">
            Horários disponíveis
          </p>
          {timeSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <motion.button
                  key={time}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTimeSelect(time)}
                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === time
                      ? 'bg-gold text-primary-foreground shadow-gold'
                      : 'bg-secondary text-foreground hover:bg-muted'
                  }`}
                >
                  {time}
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum horário disponível para esta data
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
