import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateTimeSelectProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

export function DateTimeSelect({ selectedDate, selectedTime, onDateSelect, onTimeSelect }: DateTimeSelectProps) {
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

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < today || date.getDay() === 0; // Disable past dates and Sundays
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
        </motion.div>
      )}
    </div>
  );
}
