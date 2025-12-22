// Mock tenant data for demonstration
export interface Tenant {
  id: string;
  nome: string;
  logo_url: string | null;
  evolution_api_url: string | null;
  evolution_api_token: string | null;
  mp_public_key: string | null;
}

// Horário de funcionamento por dia da semana
export interface BusinessHours {
  dayOfWeek: number; // 0=Dom, 1=Seg, ... 6=Sáb
  isOpen: boolean;
  periods: { start: string; end: string }[];
}

// Intervalo (ex: almoço)
export interface BreakTime {
  enabled: boolean;
  start: string;
  end: string;
}

// Bloqueio de data
export interface DateBlock {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  professionalId?: string | null; // null = toda barbearia
}

// Configuração de agenda do profissional
export interface ProfessionalSchedule {
  workDays: number[]; // [1, 2, 3, 4, 5] = Seg a Sex
  workHours: {
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
  };
  useBusinessHours: boolean; // Se true, usa os horários da barbearia
}

export interface Professional {
  id: string;
  tenant_id: string;
  nome: string;
  avatar_url: string | null;
  telefone: string;
  especialidade: string;
  ativo: boolean;
  schedule?: ProfessionalSchedule;
}

export interface Service {
  id: string;
  tenant_id: string;
  nome: string;
  preco: number;
  duracao: number; // in minutes
  descricao: string;
  ativo: boolean;
}

export interface Appointment {
  id: string;
  professional_id: string;
  service_id: string;
  data_hora: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  cliente_nome: string;
  cliente_zap: string;
  observacoes?: string;
}

export interface LoyaltyPoints {
  id: string;
  cliente_zap: string;
  pontos: number;
}

// Mock data
export const mockTenant: Tenant = {
  id: '1',
  nome: 'Barber Kings',
  logo_url: null,
  evolution_api_url: null,
  evolution_api_token: null,
  mp_public_key: null,
};

// Horários de funcionamento padrão da barbearia
export const mockBusinessHours: BusinessHours[] = [
  { dayOfWeek: 0, isOpen: false, periods: [] }, // Domingo
  { dayOfWeek: 1, isOpen: true, periods: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '19:00' }] },
  { dayOfWeek: 2, isOpen: true, periods: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '19:00' }] },
  { dayOfWeek: 3, isOpen: true, periods: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '19:00' }] },
  { dayOfWeek: 4, isOpen: true, periods: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '19:00' }] },
  { dayOfWeek: 5, isOpen: true, periods: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '19:00' }] },
  { dayOfWeek: 6, isOpen: true, periods: [{ start: '09:00', end: '17:00' }] }, // Sábado
];

// Intervalo padrão (almoço)
export const mockBreakTime: BreakTime = {
  enabled: true,
  start: '12:00',
  end: '14:00',
};

// Bloqueios de data
export const mockDateBlocks: DateBlock[] = [
  { id: '1', date: '2024-12-25', description: 'Natal', allDay: true, professionalId: null },
  { id: '2', date: '2025-01-01', description: 'Ano Novo', allDay: true, professionalId: null },
];

export const mockProfessionals: Professional[] = [
  { 
    id: '1', 
    tenant_id: '1', 
    nome: 'Carlos Silva', 
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg', 
    telefone: '11999991111', 
    especialidade: 'Cortes clássicos', 
    ativo: true,
    schedule: {
      useBusinessHours: true,
      workDays: [1, 2, 3, 4, 5, 6],
      workHours: {}
    }
  },
  { 
    id: '2', 
    tenant_id: '1', 
    nome: 'João Santos', 
    avatar_url: 'https://randomuser.me/api/portraits/men/45.jpg', 
    telefone: '11999992222', 
    especialidade: 'Degradê e Fade', 
    ativo: true,
    schedule: {
      useBusinessHours: false,
      workDays: [1, 2, 3, 4, 5],
      workHours: {
        morningStart: '10:00',
        morningEnd: '12:00',
        afternoonStart: '14:00',
        afternoonEnd: '18:00'
      }
    }
  },
  { 
    id: '3', 
    tenant_id: '1', 
    nome: 'Pedro Lima', 
    avatar_url: 'https://randomuser.me/api/portraits/men/67.jpg', 
    telefone: '11999993333', 
    especialidade: 'Barba e Bigode', 
    ativo: true,
    schedule: {
      useBusinessHours: true,
      workDays: [2, 3, 4, 5, 6],
      workHours: {}
    }
  },
];

export const mockServices: Service[] = [
  { id: '1', tenant_id: '1', nome: 'Corte Tradicional', preco: 35, duracao: 30, descricao: 'Corte clássico com tesoura e máquina', ativo: true },
  { id: '2', tenant_id: '1', nome: 'Corte + Barba', preco: 55, duracao: 45, descricao: 'Combo completo corte e barba', ativo: true },
  { id: '3', tenant_id: '1', nome: 'Barba Completa', preco: 30, duracao: 25, descricao: 'Aparar, desenhar e hidratar', ativo: true },
  { id: '4', tenant_id: '1', nome: 'Corte Degradê', preco: 45, duracao: 40, descricao: 'Degradê com acabamento perfeito', ativo: true },
  { id: '5', tenant_id: '1', nome: 'Hidratação', preco: 25, duracao: 20, descricao: 'Hidratação profunda para cabelo', ativo: true },
];

export const mockAppointments: Appointment[] = [
  { id: '1', professional_id: '1', service_id: '1', data_hora: '2024-01-15T10:00:00', status: 'confirmed', cliente_nome: 'Lucas Mendes', cliente_zap: '11999998888' },
  { id: '2', professional_id: '2', service_id: '2', data_hora: '2024-01-15T11:00:00', status: 'pending', cliente_nome: 'Rafael Costa', cliente_zap: '11999997777' },
  { id: '3', professional_id: '1', service_id: '4', data_hora: '2024-01-15T14:30:00', status: 'completed', cliente_nome: 'André Souza', cliente_zap: '11999996666' },
];
