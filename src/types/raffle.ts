export type TicketStatus = 'available' | 'reserved' | 'partial' | 'paid' | 'blocked';

export type ReservationStatus = TicketStatus | 'cancelled';

export type PaymentMethod = 'cash' | 'transfer' | 'deposit' | 'other';

export type PaymentStatus = 'confirmed' | 'reversed';

export type PrizePosition = 1 | 2 | 3;

export interface RaffleSettings {
  id: string;
  name: string;
  ticket_price: number;
  currency: string;
  currency_symbol: string;
  total_tickets: number;
  status: 'active' | 'closed' | 'drawn';
  closing_date: string;
  prize_1_title: string;
  prize_1_desc: string;
  prize_1_img: string;
  prize_2_title: string;
  prize_2_desc: string;
  prize_2_img: string;
  prize_3_title: string;
  prize_3_desc: string;
  prize_3_img: string;
  rules: string;
  reservation_timeout_hours: number;
  prevent_duplicate_winner: boolean;
  contact_phone: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  number: number; // 1 to 300
  formatted_number: string; // "001" to "300"
  status: TicketStatus;
  reservation_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  ticket_id: string;
  ticket_number: number;
  participant_id: string;
  participant?: Participant;
  total_price: number;
  status: ReservationStatus;
  reserved_at: string;
  expires_at?: string | null;
  notes?: string;
  created_by: string;
  cancelled_at?: string | null;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
  total_paid: number;
  balance_due: number;
}

export interface Payment {
  id: string;
  reservation_id: string;
  ticket_number?: number;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  received_at: string;
  recorded_by: string;
  created_at: string;
  reversal_reason?: string;
  reversed_at?: string;
}

export interface RaffleWinner {
  id: string;
  ticket_id: string;
  ticket_number: number;
  participant_name: string;
  prize_position: PrizePosition;
  prize_title: string;
  draw_date: string;
  selection_method: string;
  confirmed_at: string;
  confirmed_by: string;
  verification_code: string;
}

export interface RaffleDraw {
  id: string;
  prize_position: PrizePosition;
  eligible_ticket_ids: number[];
  winning_ticket_id: number;
  selection_method: string;
  drawn_at: string;
  drawn_by: string;
  status: 'draft' | 'confirmed';
  verification_data: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface FinancialStats {
  totalTickets: number; // 300
  availableTickets: number;
  reservedPendingTickets: number;
  partialPaymentTickets: number;
  fullyPaidTickets: number;
  blockedTickets: number;
  occupiedTickets: number; // 300 - available - blocked
  occupancyPercentage: number;
  registeredParticipantsCount: number;
  totalPotentialGross: number; // e.g. 300 * 200 = RD$ 60,000
  totalCommittedActive: number; // sum of total_price of active reservations
  totalConfirmedRevenue: number; // sum of confirmed payments
  totalPendingBalance: number; // sum of balances due on active reservations
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia bancaria',
  deposit: 'Depósito',
  other: 'Otro'
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  available: 'Disponible',
  reserved: 'Pendiente de pago',
  partial: 'Abono parcial',
  paid: 'Pagado',
  blocked: 'Bloqueado'
};

export const STATUS_COLORS: Record<TicketStatus, { bg: string; border: string; text: string; dot: string; glow: string }> = {
  available: {
    bg: 'bg-emerald-950/30 hover:bg-emerald-900/40',
    border: 'border-emerald-600/50 hover:border-emerald-500',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]'
  },
  reserved: {
    bg: 'bg-amber-950/30 hover:bg-amber-900/40',
    border: 'border-amber-600/50 hover:border-amber-500',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]'
  },
  partial: {
    bg: 'bg-orange-950/30 hover:bg-orange-900/40',
    border: 'border-orange-600/60 hover:border-orange-500',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
    glow: 'shadow-[0_0_12px_rgba(234,88,12,0.2)]'
  },
  paid: {
    bg: 'bg-slate-900/70 hover:bg-slate-800/80',
    border: 'border-slate-600/50 hover:border-slate-500',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    glow: 'shadow-[0_0_12px_rgba(148,163,184,0.15)]'
  },
  blocked: {
    bg: 'bg-neutral-900/40',
    border: 'border-neutral-800',
    text: 'text-neutral-500',
    dot: 'bg-neutral-600',
    glow: ''
  }
};
