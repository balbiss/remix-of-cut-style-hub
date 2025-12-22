import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DateBlock } from '@/lib/mock-data';
import { CalendarX, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateBlockFormProps {
  dateBlocks: DateBlock[];
  onAddBlock: (block: Omit<DateBlock, 'id'>) => void;
  onRemoveBlock: (id: string) => void;
}

export function DateBlockForm({
  dateBlocks,
  onAddBlock,
  onRemoveBlock,
}: DateBlockFormProps) {
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Filter only general blocks (not professional-specific)
  const generalBlocks = dateBlocks.filter(b => !b.professionalId);

  const handleAdd = () => {
    if (!newDate || !newDescription) return;

    onAddBlock({
      date: newDate,
      description: newDescription,
      allDay,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      professionalId: null,
    });

    // Reset form
    setNewDate('');
    setNewDescription('');
    setAllDay(true);
    setStartTime('');
    setEndTime('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarX className="w-5 h-5 text-gold" />
          Bloqueios de Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Feriados, eventos ou datas que a barbearia não funciona
        </p>

        {/* Lista de bloqueios */}
        {generalBlocks.length > 0 && (
          <div className="space-y-2">
            {generalBlocks.map(block => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {format(new Date(block.date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    {' - '}
                    {block.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {block.allDay ? 'Dia inteiro' : `${block.startTime} - ${block.endTime}`}
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

        {/* Formulário para novo bloqueio */}
        <div className="space-y-4 pt-4 border-t border-border">
          <p className="text-sm font-medium">Adicionar bloqueio</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Feriado de Natal"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="blockAllDay"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked as boolean)}
            />
            <Label htmlFor="blockAllDay">Dia inteiro</Label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={!newDate || !newDescription}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Bloqueio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
