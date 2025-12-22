import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Professional {
  id: string;
  nome: string;
  commission_percent: number;
}

interface ReportData {
  professionalId: string;
  professionalName: string;
  totalServices: number;
  totalValue: number;
  commission: number;
  commissionPercent: number;
}

export default function AdminRelatorios() {
  const { tenant } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, [tenant?.id]);

  useEffect(() => {
    if (tenant?.id) {
      generateReport();
    }
  }, [tenant?.id, selectedProfessional, dateRange]);

  const fetchProfessionals = async () => {
    if (!tenant?.id) return;

    const { data, error } = await supabase
      .from('professionals')
      .select('id, nome, commission_percent')
      .eq('tenant_id', tenant.id)
      .order('nome');

    if (error) {
      console.error('Error fetching professionals:', error);
      return;
    }

    setProfessionals(data || []);
  };

  const generateReport = async () => {
    if (!tenant?.id) return;
    setLoading(true);

    try {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          professional_id,
          status,
          professionals!inner(id, nome, commission_percent),
          services:service_id(preco)
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'completed')
        .gte('data_hora', dateRange.from.toISOString())
        .lte('data_hora', dateRange.to.toISOString());

      if (selectedProfessional !== 'all') {
        query = query.eq('professional_id', selectedProfessional);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error generating report:', error);
        toast.error('Erro ao gerar relatório');
        return;
      }

      // Group by professional
      const grouped = new Map<string, ReportData>();

      (data || []).forEach((apt: any) => {
        const profId = apt.professional_id;
        const profName = apt.professionals?.nome || 'Desconhecido';
        const commissionPercent = apt.professionals?.commission_percent || 50;
        const serviceValue = apt.services?.preco || 0;
        const commission = (serviceValue * commissionPercent) / 100;

        if (grouped.has(profId)) {
          const existing = grouped.get(profId)!;
          existing.totalServices++;
          existing.totalValue += serviceValue;
          existing.commission += commission;
        } else {
          grouped.set(profId, {
            professionalId: profId,
            professionalName: profName,
            totalServices: 1,
            totalValue: serviceValue,
            commission: commission,
            commissionPercent: commissionPercent,
          });
        }
      });

      setReportData(Array.from(grouped.values()));
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Profissional', 'Serviços Realizados', 'Valor Total', 'Comissão (%)', 'Valor Comissão'];
    const rows = reportData.map((row) => [
      row.professionalName,
      row.totalServices.toString(),
      row.totalValue.toFixed(2),
      row.commissionPercent.toString(),
      row.commission.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Relatório exportado!');
  };

  const setPresetRange = (preset: 'week' | 'month') => {
    const today = new Date();
    if (preset === 'week') {
      setDateRange({
        from: startOfWeek(today, { locale: ptBR }),
        to: endOfWeek(today, { locale: ptBR }),
      });
    } else {
      setDateRange({
        from: startOfMonth(today),
        to: endOfMonth(today),
      });
    }
  };

  const totals = reportData.reduce(
    (acc, row) => ({
      services: acc.services + row.totalServices,
      value: acc.value + row.totalValue,
      commission: acc.commission + row.commission,
    }),
    { services: 0, value: 0, commission: 0 }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe os serviços e comissões dos barbeiros
            </p>
          </div>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Professional Filter */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Profissional</label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          format(dateRange.from, "dd/MM/yyyy")
                        ) : (
                          <span>Data inicial</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? (
                          format(dateRange.to, "dd/MM/yyyy")
                        ) : (
                          <span>Data final</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-2 items-end">
                <Button variant="outline" size="sm" onClick={() => setPresetRange('week')}>
                  Esta Semana
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange('month')}>
                  Este Mês
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : reportData.length === 0 ? (
              <p className="text-muted-foreground">Nenhum serviço encontrado no período selecionado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-center">Serviços</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Comissão (%)</TableHead>
                    <TableHead className="text-right">Valor a Pagar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row) => (
                    <TableRow key={row.professionalId}>
                      <TableCell className="font-medium">{row.professionalName}</TableCell>
                      <TableCell className="text-center">{row.totalServices}</TableCell>
                      <TableCell className="text-right">R$ {row.totalValue.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{row.commissionPercent}%</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        R$ {row.commission.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{totals.services}</TableCell>
                    <TableCell className="text-right">R$ {totals.value.toFixed(2)}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right text-primary">
                      R$ {totals.commission.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
