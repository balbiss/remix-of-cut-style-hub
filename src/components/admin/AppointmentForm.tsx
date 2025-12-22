import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProfessionals, mockServices, Professional, Service } from '@/lib/mock-data';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  selectedTime?: string;
  onSave: (appointment: {
    professional_id: string;
    service_id: string;
    data_hora: string;
    cliente_nome: string;
    cliente_zap: string;
    observacoes?: string;
    status: 'pending' | 'confirmed';
  }) => void;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

export function AppointmentForm({
  open,
  onOpenChange,
  selectedDate: initialDate,
  selectedTime: initialTime,
  onSave,
}: AppointmentFormProps) {
  const [professionalId, setProfessionalId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(initialTime || '');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteZap, setClienteZap] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed'>('confirmed');

  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setTime(initialTime || '');
      setProfessionalId('');
      setServiceId('');
      setClienteNome('');
      setClienteZap('');
      setObservacoes('');
      setStatus('confirmed');
    }
  }, [open, initialDate, initialTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dataHora = `${dateStr}T${time}:00`;

    onSave({
      professional_id: professionalId,
      service_id: serviceId,
      data_hora: dataHora,
      cliente_nome: clienteNome,
      cliente_zap: clienteZap,
      observacoes: observacoes || undefined,
      status,
    });
    onOpenChange(false);
  };

  const selectedService = mockServices.find(s => s.id === serviceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profissional */}
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {mockProfessionals.filter(p => p.ativo).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select value={serviceId} onValueChange={setServiceId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {mockServices.filter(s => s.ativo).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome} - R$ {s.preco.toFixed(2)} ({s.duracao} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Select value={time} onValueChange={setTime} required>
                <SelectTrigger>
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="space-y-2">
            <Label htmlFor="clienteNome">Nome do cliente</Label>
            <Input
              id="clienteNome"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clienteZap">WhatsApp</Label>
            <Input
              id="clienteZap"
              value={clienteZap}
              onChange={(e) => setClienteZap(e.target.value)}
              placeholder="11999999999"
              required
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Alguma observação..."
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status inicial</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'pending' | 'confirmed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumo */}
          {selectedService && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Resumo</p>
              <p className="font-medium">{selectedService.nome}</p>
              <p className="text-gold font-bold">R$ {selectedService.preco.toFixed(2)}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Agendar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
