import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BusinessHours, BreakTime } from '@/lib/mock-data';
import { Clock, Coffee, Plus, Trash2 } from 'lucide-react';

interface BusinessHoursFormProps {
  businessHours: BusinessHours[];
  breakTime: BreakTime;
  onBusinessHoursChange: (hours: BusinessHours[]) => void;
  onBreakTimeChange: (breakTime: BreakTime) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export function BusinessHoursForm({
  businessHours,
  breakTime,
  onBusinessHoursChange,
  onBreakTimeChange,
}: BusinessHoursFormProps) {
  const toggleDay = (dayOfWeek: number) => {
    const updated = businessHours.map(h => 
      h.dayOfWeek === dayOfWeek 
        ? { ...h, isOpen: !h.isOpen }
        : h
    );
    onBusinessHoursChange(updated);
  };

  const updatePeriod = (dayOfWeek: number, periodIndex: number, field: 'start' | 'end', value: string) => {
    const updated = businessHours.map(h => {
      if (h.dayOfWeek === dayOfWeek) {
        const newPeriods = [...h.periods];
        newPeriods[periodIndex] = { ...newPeriods[periodIndex], [field]: value };
        return { ...h, periods: newPeriods };
      }
      return h;
    });
    onBusinessHoursChange(updated);
  };

  const addPeriod = (dayOfWeek: number) => {
    const updated = businessHours.map(h => {
      if (h.dayOfWeek === dayOfWeek) {
        return { ...h, periods: [...h.periods, { start: '14:00', end: '19:00' }] };
      }
      return h;
    });
    onBusinessHoursChange(updated);
  };

  const removePeriod = (dayOfWeek: number, periodIndex: number) => {
    const updated = businessHours.map(h => {
      if (h.dayOfWeek === dayOfWeek) {
        const newPeriods = h.periods.filter((_, i) => i !== periodIndex);
        return { ...h, periods: newPeriods };
      }
      return h;
    });
    onBusinessHoursChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Horários de funcionamento */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {businessHours.map(day => {
            const dayInfo = DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek);
            return (
              <div key={day.dayOfWeek} className="space-y-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Switch
                      checked={day.isOpen}
                      onCheckedChange={() => toggleDay(day.dayOfWeek)}
                      size="sm"
                    />
                    <span className={`font-medium text-sm truncate ${!day.isOpen ? 'text-muted-foreground' : ''}`}>
                      {dayInfo?.label}
                    </span>
                  </div>
                  {!day.isOpen && (
                    <span className="text-xs text-muted-foreground shrink-0">Fechado</span>
                  )}
                </div>

                {day.isOpen && (
                  <div className="space-y-2 pl-0 sm:pl-10">
                    {day.periods.map((period, periodIndex) => (
                      <div key={periodIndex} className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                        <Input
                          type="time"
                          value={period.start}
                          onChange={(e) => updatePeriod(day.dayOfWeek, periodIndex, 'start', e.target.value)}
                          className="w-[5.5rem] h-9 text-sm px-2"
                          inputSize="sm"
                        />
                        <span className="text-muted-foreground text-xs px-1">até</span>
                        <Input
                          type="time"
                          value={period.end}
                          onChange={(e) => updatePeriod(day.dayOfWeek, periodIndex, 'end', e.target.value)}
                          className="w-[5.5rem] h-9 text-sm px-2"
                          inputSize="sm"
                        />
                        <div className="flex items-center gap-0.5 ml-auto sm:ml-1">
                          {day.periods.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removePeriod(day.dayOfWeek, periodIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {periodIndex === day.periods.length - 1 && day.periods.length < 3 && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => addPeriod(day.dayOfWeek)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Intervalo / Almoço */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coffee className="w-5 h-5 text-primary" />
            Intervalo (Almoço)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-sm font-medium">Ativar intervalo</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Horário que a barbearia fecha para almoço
              </p>
            </div>
            <Switch
              checked={breakTime.enabled}
              onCheckedChange={(enabled) => onBreakTimeChange({ ...breakTime, enabled })}
              size="sm"
            />
          </div>

          {breakTime.enabled && (
            <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input
                  type="time"
                  value={breakTime.start}
                  onChange={(e) => onBreakTimeChange({ ...breakTime, start: e.target.value })}
                  className="w-[5.5rem] h-9 text-sm px-2"
                  inputSize="sm"
                />
              </div>
              <span className="text-muted-foreground text-xs pb-2.5">até</span>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fim</Label>
                <Input
                  type="time"
                  value={breakTime.end}
                  onChange={(e) => onBreakTimeChange({ ...breakTime, end: e.target.value })}
                  className="w-[5.5rem] h-9 text-sm px-2"
                  inputSize="sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
