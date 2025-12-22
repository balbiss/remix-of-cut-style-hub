import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Professional, ProfessionalSchedule, DateBlock } from '@/lib/mock-data';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessionalScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: Professional | null;
  dateBlocks: DateBlock[];
  onSave: (schedule: ProfessionalSchedule) => void;
  onAddBlock: (block: Omit<DateBlock, 'id'>) => void;
  onRemoveBlock: (id: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function ProfessionalScheduleForm({
  open,
  onOpenChange,
  professional,
  dateBlocks,
  onSave,
  onAddBlock,
  onRemoveBlock,
}: ProfessionalScheduleFormProps) {
  const [useBusinessHours, setUseBusinessHours] = useState(true);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [morningStart, setMorningStart] = useState('09:00');
  const [morningEnd, setMorningEnd] = useState('12:00');
  const [afternoonStart, setAfternoonStart] = useState('14:00');
  const [afternoonEnd, setAfternoonEnd] = useState('18:00');

  // New block form
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockDescription, setNewBlockDescription] = useState('');
  const [newBlockAllDay, setNewBlockAllDay] = useState(true);
  const [newBlockStart, setNewBlockStart] = useState('');
  const [newBlockEnd, setNewBlockEnd] = useState('');

  // Filter blocks for this professional
  const professionalBlocks = dateBlocks.filter(
    b => b.professionalId === professional?.id
  );

  useEffect(() => {
    if (professional?.schedule) {
      setUseBusinessHours(professional.schedule.useBusinessHours);
      setWorkDays(professional.schedule.workDays);
      setMorningStart(professional.schedule.workHours.morningStart || '09:00');
      setMorningEnd(professional.schedule.workHours.morningEnd || '12:00');
      setAfternoonStart(professional.schedule.workHours.afternoonStart || '14:00');
      setAfternoonEnd(professional.schedule.workHours.afternoonEnd || '18:00');
    } else {
      setUseBusinessHours(true);
      setWorkDays([1, 2, 3, 4, 5]);
      setMorningStart('09:00');
      setMorningEnd('12:00');
      setAfternoonStart('14:00');
      setAfternoonEnd('18:00');
    }
  }, [professional, open]);

  const toggleDay = (day: number) => {
    if (workDays.includes(day)) {
      setWorkDays(workDays.filter(d => d !== day));
    } else {
      setWorkDays([...workDays, day].sort());
    }
  };

  const handleSave = () => {
    const schedule: ProfessionalSchedule = {
      useBusinessHours,
      workDays,
      workHours: useBusinessHours ? {} : {
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
      },
    };
    onSave(schedule);
    onOpenChange(false);
  };

  const handleAddBlock = () => {
    if (!newBlockDate || !newBlockDescription) return;
    
    onAddBlock({
      date: newBlockDate,
      description: newBlockDescription,
      allDay: newBlockAllDay,
      startTime: newBlockAllDay ? undefined : newBlockStart,
      endTime: newBlockAllDay ? undefined : newBlockEnd,
      professionalId: professional?.id || null,
    });

    // Reset form
    setNewBlockDate('');
    setNewBlockDescription('');
    setNewBlockAllDay(true);
    setNewBlockStart('');
    setNewBlockEnd('');
  };

  if (!professional) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            Agenda de {professional.nome}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Usar horários da barbearia */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Usar horários da barbearia</Label>
                  <p className="text-sm text-muted-foreground">
                    Seguir os mesmos horários configurados para a barbearia
                  </p>
                </div>
                <Switch
                  checked={useBusinessHours}
                  onCheckedChange={setUseBusinessHours}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dias de trabalho */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                Dias de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      workDays.includes(day.value)
                        ? 'bg-gold text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Horários personalizados */}
          {!useBusinessHours && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Horário de Atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Manhã - Início</Label>
                    <Input
                      type="time"
                      value={morningStart}
                      onChange={(e) => setMorningStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Manhã - Fim</Label>
                    <Input
                      type="time"
                      value={morningEnd}
                      onChange={(e) => setMorningEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Tarde - Início</Label>
                    <Input
                      type="time"
                      value={afternoonStart}
                      onChange={(e) => setAfternoonStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Tarde - Fim</Label>
                    <Input
                      type="time"
                      value={afternoonEnd}
                      onChange={(e) => setAfternoonEnd(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Folgas e Bloqueios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                Folgas e Bloqueios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de bloqueios existentes */}
              {professionalBlocks.length > 0 && (
                <div className="space-y-2">
                  {professionalBlocks.map(block => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(block.date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {block.description}
                          {!block.allDay && ` (${block.startTime} - ${block.endTime})`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveBlock(block.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para nova folga */}
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-sm font-medium">Adicionar folga</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Data</Label>
                    <Input
                      type="date"
                      value={newBlockDate}
                      onChange={(e) => setNewBlockDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Motivo</Label>
                    <Input
                      placeholder="Ex: Consulta médica"
                      value={newBlockDescription}
                      onChange={(e) => setNewBlockDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allDay"
                    checked={newBlockAllDay}
                    onCheckedChange={(checked) => setNewBlockAllDay(checked as boolean)}
                  />
                  <Label htmlFor="allDay" className="text-sm">Dia inteiro</Label>
                </div>

                {!newBlockAllDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Início</Label>
                      <Input
                        type="time"
                        value={newBlockStart}
                        onChange={(e) => setNewBlockStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fim</Label>
                      <Input
                        type="time"
                        value={newBlockEnd}
                        onChange={(e) => setNewBlockEnd(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBlock}
                  disabled={!newBlockDate || !newBlockDescription}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Folga
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Salvar Configuração
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
