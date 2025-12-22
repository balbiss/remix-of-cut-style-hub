import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Users, Scissors, Clock, AlertTriangle } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  link: string;
  icon: React.ElementType;
}

interface SetupChecklistProps {
  hasProfessionals: boolean;
  hasServices: boolean;
  hasBusinessHours: boolean;
}

export function SetupChecklist({ hasProfessionals, hasServices, hasBusinessHours }: SetupChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: 'professionals',
      label: 'Cadastrar profissionais',
      description: 'Adicione pelo menos um profissional ativo',
      completed: hasProfessionals,
      link: '/admin/profissionais',
      icon: Users,
    },
    {
      id: 'services',
      label: 'Cadastrar serviços',
      description: 'Adicione os serviços oferecidos',
      completed: hasServices,
      link: '/admin/servicos',
      icon: Scissors,
    },
    {
      id: 'hours',
      label: 'Configurar horários',
      description: 'Defina os dias e horários de funcionamento',
      completed: hasBusinessHours,
      link: '/admin/configuracoes',
      icon: Clock,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const allCompleted = completedCount === items.length;

  // Don't show if all items are completed
  if (allCompleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <CardTitle className="text-sm sm:text-base">Configure sua barbearia</CardTitle>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete os passos abaixo para liberar o agendamento online
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3">
            {items.map((item, index) => (
              <Link
                key={item.id}
                to={item.link}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg transition-colors ${
                    item.completed
                      ? 'bg-green-500/10 hover:bg-green-500/20'
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        item.completed ? 'text-green-500 line-through' : 'text-foreground'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <item.icon className={`w-4 h-4 shrink-0 ${
                    item.completed ? 'text-green-500' : 'text-primary'
                  }`} />
                </motion.div>
              </Link>
            ))}
          </div>
          
          {/* Progress indicator */}
          <div className="mt-3 sm:mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>{completedCount}/{items.length}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / items.length) * 100}%` }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
