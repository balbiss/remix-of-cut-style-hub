import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trophy, Save, Check } from 'lucide-react';
import { useLoyaltyConfig, LoyaltyConfig } from '@/hooks/useLoyaltyConfig';

export function LoyaltyConfigForm() {
  const { config, isLoading, saveConfig } = useLoyaltyConfig();
  const [isSaving, setIsSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [pointsType, setPointsType] = useState<'visit' | 'amount'>('visit');
  const [pointsPerVisit, setPointsPerVisit] = useState(10);
  const [pointsPerReal, setPointsPerReal] = useState(1);
  const [minAmount, setMinAmount] = useState(0);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setPointsType(config.points_type);
      setPointsPerVisit(config.points_per_visit);
      setPointsPerReal(config.points_per_real);
      setMinAmount(config.min_amount_for_points);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveConfig({
      enabled,
      points_type: pointsType,
      points_per_visit: pointsPerVisit,
      points_per_real: pointsPerReal,
      min_amount_for_points: minAmount,
    });
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <div>
            <CardTitle>Programa de Fidelidade</CardTitle>
            <CardDescription>
              Configure como seus clientes acumulam pontos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
          <div>
            <Label className="text-base font-medium">Ativar Programa</Label>
            <p className="text-sm text-muted-foreground">
              Habilite para seus clientes começarem a acumular pontos
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            {/* Points Type */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Como os pontos são ganhos?</Label>
              <RadioGroup value={pointsType} onValueChange={(v) => setPointsType(v as 'visit' | 'amount')}>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
                  <RadioGroupItem value="visit" id="visit" />
                  <Label htmlFor="visit" className="flex-1 cursor-pointer">
                    <span className="font-medium">Por visita</span>
                    <p className="text-sm text-muted-foreground">
                      Cliente ganha pontos fixos a cada agendamento
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
                  <RadioGroupItem value="amount" id="amount" />
                  <Label htmlFor="amount" className="flex-1 cursor-pointer">
                    <span className="font-medium">Por valor gasto</span>
                    <p className="text-sm text-muted-foreground">
                      Cliente ganha pontos proporcional ao valor
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Points Configuration */}
            {pointsType === 'visit' ? (
              <div className="space-y-2">
                <Label htmlFor="pointsPerVisit">Pontos por visita</Label>
                <Input
                  id="pointsPerVisit"
                  type="number"
                  min="1"
                  value={pointsPerVisit}
                  onChange={(e) => setPointsPerVisit(Number(e.target.value))}
                  className="bg-secondary/50"
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade de pontos ganhos a cada agendamento
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerReal">Pontos por R$ gasto</Label>
                  <Input
                    id="pointsPerReal"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={pointsPerReal}
                    onChange={(e) => setPointsPerReal(Number(e.target.value))}
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: 1 ponto a cada R$ 10 gastos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Valor mínimo para ganhar pontos</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    min="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(Number(e.target.value))}
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe 0 para sem mínimo
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            variant="gold"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Save className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
