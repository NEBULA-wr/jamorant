import {
  AuditLog,
  FinancialStats,
  Participant,
  Payment,
  PaymentMethod,
  PrizePosition,
  RaffleDraw,
  RaffleSettings,
  RaffleWinner,
  Reservation,
  Ticket,
  TicketStatus
} from '../types/raffle';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY_SETTINGS = 'rifa_court_settings_v3';
const STORAGE_KEY_TICKETS = 'rifa_court_tickets_v3';
const STORAGE_KEY_PARTICIPANTS = 'rifa_court_participants_v3';
const STORAGE_KEY_RESERVATIONS = 'rifa_court_reservations_v3';
const STORAGE_KEY_PAYMENTS = 'rifa_court_payments_v3';
const STORAGE_KEY_WINNERS = 'rifa_court_winners_v3';
const STORAGE_KEY_DRAWS = 'rifa_court_draws_v3';
const STORAGE_KEY_AUDIT = 'rifa_court_audit_v3';

// Default initial settings matching requirements (RD$ 200 per ticket)
export const DEFAULT_SETTINGS: RaffleSettings = {
  id: 'court_raffle_2026',
  name: 'RIFA COURT — Gran Sorteo Deportivo',
  ticket_price: 200, // Standard RD$ 200
  currency: 'DOP',
  currency_symbol: 'RD$',
  total_tickets: 300,
  status: 'active',
  closing_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  prize_1_title: '1ER LUGAR • TENIS DE BASKET',
  prize_1_desc: 'Tenis deportivos profesionales de baloncesto edición especial tigre negro y naranja.',
  prize_1_img: '/images/tenis.png',
  prize_2_title: '2DO LUGAR • BALÓN OFICIAL',
  prize_2_desc: 'Balón oficial de baloncesto Molten BG4500 FIBA Approved de 12 paneles en piel compuesta.',
  prize_2_img: '/images/balon.png',
  prize_3_title: '3ER LUGAR • PAQUETE DE MEDIAS',
  prize_3_desc: 'Paquete de medias deportivas de compresión alta para baloncesto en blanco y negro.',
  prize_3_img: '/images/medias.png',
  rules: '1. Se emitirán exactamente 300 números (001-300).\n2. El sorteo se realizará mediante ruleta animada oficial.\n3. Solo participarán en la canasta los tickets 100% pagados.\n4. Cada ticket solo puede ganar un premio.\n5. Reclamaciones válidas durante 15 días posteriores al sorteo.',
  reservation_timeout_hours: 48,
  prevent_duplicate_winner: true,
  contact_phone: '+1 (829) 555-2478',
  contact_email: 'contacto@rifacourt.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Listeners for reactive updates
type DbListener = () => void;
const listeners = new Set<DbListener>();

export function subscribeToDatabase(listener: DbListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying DB listener:', e);
    }
  });
}

// Helper to format number as 001 - 300
export function formatTicketNumber(num: number): string {
  return String(num).padStart(3, '0');
}

// Generate default 300 clean available tickets
export function generateDefaultTickets(): Ticket[] {
  const tickets: Ticket[] = [];
  const now = new Date().toISOString();
  for (let i = 1; i <= 300; i++) {
    tickets.push({
      id: `ticket_${i}`,
      number: i,
      formatted_number: formatTicketNumber(i),
      status: 'available',
      reservation_id: null,
      created_at: now,
      updated_at: now
    });
  }
  return tickets;
}

// Local Storage Helper
class LocalDb {
  settings: RaffleSettings;
  tickets: Ticket[];
  participants: Participant[];
  reservations: Reservation[];
  payments: Payment[];
  winners: RaffleWinner[];
  draws: RaffleDraw[];
  auditLogs: AuditLog[];

  constructor() {
    this.settings = this.load(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
    let loadedTickets = this.load<Ticket[] | null>(STORAGE_KEY_TICKETS, null);
    let loadedParticipants = this.load<Participant[] | null>(STORAGE_KEY_PARTICIPANTS, null);
    let loadedReservations = this.load<Reservation[] | null>(STORAGE_KEY_RESERVATIONS, null);
    let loadedPayments = this.load<Payment[] | null>(STORAGE_KEY_PAYMENTS, null);
    let loadedAudit = this.load<AuditLog[] | null>(STORAGE_KEY_AUDIT, null);

    // If never initialized or empty, initialize strictly 300 available tickets without test data
    if (!loadedTickets || loadedTickets.length !== 300) {
      loadedTickets = generateDefaultTickets();
      loadedParticipants = [];
      loadedReservations = [];
      loadedPayments = [];
      loadedAudit = [
        {
          id: 'audit_init',
          user_id: 'admin',
          action: 'INITIALIZE_SYSTEM',
          entity_type: 'raffle',
          entity_id: 'court_raffle_2026',
          details: 'Inicialización limpia de los 300 números de RIFA COURT en estado DISPONIBLE.',
          created_at: new Date().toISOString()
        }
      ];
      this.save(STORAGE_KEY_TICKETS, loadedTickets);
      this.save(STORAGE_KEY_PARTICIPANTS, loadedParticipants);
      this.save(STORAGE_KEY_RESERVATIONS, loadedReservations);
      this.save(STORAGE_KEY_PAYMENTS, loadedPayments);
      this.save(STORAGE_KEY_AUDIT, loadedAudit);
    }

    this.tickets = loadedTickets;
    this.participants = loadedParticipants || [];
    this.reservations = loadedReservations || [];
    this.payments = loadedPayments || [];
    this.auditLogs = loadedAudit || [];
    this.winners = this.load(STORAGE_KEY_WINNERS, []);
    this.draws = this.load(STORAGE_KEY_DRAWS, []);

    // Link participants to reservations if any exist
    const partMap = new Map(this.participants.map(p => [p.id, p]));
    this.reservations.forEach(r => {
      if (!r.participant && partMap.has(r.participant_id)) {
        r.participant = partMap.get(r.participant_id);
      }
    });
  }

  private load<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  saveAll() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(this.tickets));
      localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(this.participants));
      localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(this.reservations));
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(this.payments));
      localStorage.setItem(STORAGE_KEY_WINNERS, JSON.stringify(this.winners));
      localStorage.setItem(STORAGE_KEY_DRAWS, JSON.stringify(this.draws));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
    } catch (e) {
      console.error('Error saving local DB to localStorage:', e);
    }
    notifyListeners();
  }

  resetToDefault() {
    this.clearAllData();
  }

  clearAllData() {
    this.settings = { ...DEFAULT_SETTINGS, updated_at: new Date().toISOString() };
    this.tickets = generateDefaultTickets();
    this.participants = [];
    this.reservations = [];
    this.payments = [];
    this.winners = [];
    this.draws = [];
    this.auditLogs = [
      {
        id: `audit_clear_${Date.now()}`,
        user_id: 'admin',
        action: 'CLEAR_DATA',
        entity_type: 'system',
        entity_id: 'all',
        details: 'Se limpiaron todas las reservas y pagos para iniciar una rifa desde cero (300 números disponibles).',
        created_at: new Date().toISOString()
      }
    ];

    // Also clear previous version keys if any existed
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove = [
          'rifa_court_tickets_v2', 'rifa_court_participants_v2',
          'rifa_court_reservations_v2', 'rifa_court_payments_v2',
          'rifa_court_winners_v2', 'rifa_court_draws_v2', 'rifa_court_audit_v2'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        // ignore
      }
    }

    this.saveAll();
  }

  private save<T>(key: string, data: T) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (err) {
        console.error(`Failed to save ${key}:`, err);
      }
    }
  }
}

const localDbInstance = new LocalDb();

// Public API Functions

export function getRaffleSettings(): RaffleSettings {
  return { ...localDbInstance.settings };
}

export function updateRaffleSettings(updates: Partial<RaffleSettings>): RaffleSettings {
  localDbInstance.settings = {
    ...localDbInstance.settings,
    ...updates,
    updated_at: new Date().toISOString()
  };
  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: 'admin',
    action: 'UPDATE_SETTINGS',
    entity_type: 'raffle_settings',
    entity_id: localDbInstance.settings.id,
    details: `Actualización de configuración: ${Object.keys(updates).join(', ')}`,
    created_at: new Date().toISOString()
  });
  localDbInstance.saveAll();
  return { ...localDbInstance.settings };
}

export function getAllTickets(): Ticket[] {
  return [...localDbInstance.tickets];
}

export function getTicketByNumber(number: number): {
  ticket: Ticket | null;
  reservation: Reservation | null;
  participant: Participant | null;
  payments: Payment[];
} {
  const ticket = localDbInstance.tickets.find(t => t.number === number) || null;
  if (!ticket || !ticket.reservation_id) {
    return { ticket, reservation: null, participant: null, payments: [] };
  }

  const reservation = localDbInstance.reservations.find(r => r.id === ticket.reservation_id) || null;
  const participant = reservation ? localDbInstance.participants.find(p => p.id === reservation.participant_id) || null : null;
  const payments = localDbInstance.payments.filter(p => p.reservation_id === ticket.reservation_id);

  return { ticket, reservation, participant, payments };
}

export function getAllReservations(): Reservation[] {
  const partMap = new Map(localDbInstance.participants.map(p => [p.id, p]));
  const payMap = new Map<string, Payment[]>();
  localDbInstance.payments.forEach(p => {
    const list = payMap.get(p.reservation_id) || [];
    list.push(p);
    payMap.set(p.reservation_id, list);
  });

  return localDbInstance.reservations.map(r => ({
    ...r,
    participant: r.participant || partMap.get(r.participant_id),
    payments: payMap.get(r.id) || []
  }));
}

export function getAllParticipants(): Participant[] {
  return [...localDbInstance.participants];
}

export function getAllPayments(): Payment[] {
  return [...localDbInstance.payments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getAllAuditLogs(): AuditLog[] {
  return [...localDbInstance.auditLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getRaffleWinners(): RaffleWinner[] {
  return [...localDbInstance.winners].sort((a, b) => a.prize_position - b.prize_position);
}

export function getRaffleDraws(): RaffleDraw[] {
  return [...localDbInstance.draws].sort(
    (a, b) => new Date(b.drawn_at).getTime() - new Date(a.drawn_at).getTime()
  );
}

// ATOMIC RESERVATION FUNCTION
export interface ReserveTicketParams {
  ticketNumber: number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  initialState: 'paid' | 'reserved' | 'partial' | 'blocked';
  initialAmountPaid: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  recordedBy?: string;
}

export async function reserveTicket(params: ReserveTicketParams): Promise<{
  success: boolean;
  message: string;
  reservation?: Reservation;
}> {
  const ticket = localDbInstance.tickets.find(t => t.number === params.ticketNumber);
  if (!ticket) {
    return { success: false, message: `El número ${params.ticketNumber} no existe en el sistema.` };
  }

  // ATOMIC CHECK: Ensure ticket is available
  if (ticket.status !== 'available') {
    return {
      success: false,
      message: `El número #${formatTicketNumber(params.ticketNumber)} ya no está disponible (Estado actual: ${ticket.status.toUpperCase()}). Por favor elija otro número.`
    };
  }

  const nameToUse = (params.fullName || `${params.firstName || ''} ${params.lastName || ''}`).trim();

  // Validate inputs
  if (params.initialState !== 'blocked') {
    if (!nameToUse) {
      return { success: false, message: 'El nombre del participante es obligatorio.' };
    }
  }

  const ticketPrice = localDbInstance.settings.ticket_price;
  let initialAmount = 0;
  let finalStatus: TicketStatus = params.initialState;

  if (params.initialState === 'paid') {
    initialAmount = ticketPrice;
  } else if (params.initialState === 'partial') {
    initialAmount = Number(params.initialAmountPaid) || 0;
    if (initialAmount <= 0) {
      return { success: false, message: 'Para un abono parcial, debe ingresar un monto mayor a RD$ 0.' };
    }
    if (initialAmount >= ticketPrice) {
      finalStatus = 'paid';
      initialAmount = ticketPrice;
    } else {
      finalStatus = 'partial';
    }
  } else if (params.initialState === 'reserved') {
    initialAmount = 0;
    finalStatus = 'reserved';
  } else if (params.initialState === 'blocked') {
    initialAmount = 0;
    finalStatus = 'blocked';
  }

  const now = new Date().toISOString();
  const recordedBy = params.recordedBy || 'Administrador';

  // 1. Participant lookup or create
  const nameParts = nameToUse.split(' ').filter(Boolean);
  const firstName = nameParts[0] || (params.initialState === 'blocked' ? 'Bloqueo' : 'Participante');
  const lastName = nameParts.slice(1).join(' ') || (params.initialState === 'blocked' ? 'Administrativo' : '');
  const phone = (params.phone || '').trim();

  let participant: Participant = {
    id: `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    first_name: firstName,
    last_name: lastName,
    phone: phone || '',
    created_at: now,
    updated_at: now
  };
  localDbInstance.participants.push(participant);

  // 2. Reservation creation
  const resId = `res_${params.ticketNumber}_${Date.now()}`;
  const reservation: Reservation = {
    id: resId,
    ticket_id: ticket.id,
    ticket_number: params.ticketNumber,
    participant_id: participant.id,
    participant,
    total_price: ticketPrice,
    status: finalStatus,
    reserved_at: now,
    expires_at:
      finalStatus === 'reserved'
        ? new Date(Date.now() + localDbInstance.settings.reservation_timeout_hours * 3600000).toISOString()
        : null,
    notes: params.notes?.trim() || undefined,
    created_by: recordedBy,
    created_at: now,
    updated_at: now,
    total_paid: initialAmount,
    balance_due: ticketPrice - initialAmount
  };

  // 3. Payment creation if amount > 0
  if (initialAmount > 0) {
    const payment: Payment = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      reservation_id: resId,
      ticket_number: params.ticketNumber,
      amount: initialAmount,
      payment_method: params.paymentMethod || 'cash',
      status: 'confirmed',
      reference: params.paymentReference?.trim() || undefined,
      notes: finalStatus === 'paid' ? 'Pago completo de reserva' : 'Abono inicial de reserva',
      received_at: now,
      recorded_by: recordedBy,
      created_at: now
    };
    localDbInstance.payments.push(payment);
  }

  // 4. Update ticket
  ticket.status = finalStatus;
  ticket.reservation_id = resId;
  ticket.updated_at = now;

  localDbInstance.reservations.push(reservation);

  // 5. Audit Log
  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: recordedBy,
    action: 'RESERVE_TICKET',
    entity_type: 'ticket',
    entity_id: String(params.ticketNumber),
    details: `Ticket #${formatTicketNumber(params.ticketNumber)} asignado a ${participant.first_name} ${participant.last_name}. Monto pagado: RD$ ${initialAmount}. Estado: ${finalStatus}.`,
    created_at: now
  });

  localDbInstance.saveAll();

  // If Supabase is connected, sync asynchronously
  syncReservationToSupabase(reservation, participant, initialAmount, params.paymentMethod, params.paymentReference);

  return {
    success: true,
    message: `¡Número #${formatTicketNumber(params.ticketNumber)} reservado exitosamente!`,
    reservation
  };
}

// REGISTER NEW PAYMENT (ABONO)
export interface AddPaymentParams {
  reservationId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedBy?: string;
}

export async function registerPayment(params: AddPaymentParams): Promise<{
  success: boolean;
  message: string;
  payment?: Payment;
  newStatus?: TicketStatus;
}> {
  const reservation = localDbInstance.reservations.find(r => r.id === params.reservationId);
  if (!reservation) {
    return { success: false, message: 'Reserva no encontrada.' };
  }

  if (reservation.status === 'cancelled') {
    return { success: false, message: 'No se pueden registrar pagos a una reserva cancelada.' };
  }

  const amt = Number(params.amount);
  if (isNaN(amt) || amt <= 0) {
    return { success: false, message: 'El importe del abono debe ser mayor a RD$ 0.' };
  }

  if (amt > reservation.balance_due) {
    return {
      success: false,
      message: `El monto ingresado (RD$ ${amt}) excede el saldo pendiente (RD$ ${reservation.balance_due}).`
    };
  }

  const now = new Date().toISOString();
  const recordedBy = params.recordedBy || 'Administrador';

  const payment: Payment = {
    id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    reservation_id: reservation.id,
    ticket_number: reservation.ticket_number,
    amount: amt,
    payment_method: params.paymentMethod,
    status: 'confirmed',
    reference: params.reference?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    received_at: now,
    recorded_by: recordedBy,
    created_at: now
  };

  localDbInstance.payments.push(payment);

  // Recalculate totals
  const allConfirmedPayments = localDbInstance.payments.filter(
    p => p.reservation_id === reservation.id && p.status === 'confirmed'
  );
  const totalPaid = allConfirmedPayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, reservation.total_price - totalPaid);

  let newStatus: TicketStatus = reservation.status;
  if (balanceDue === 0) {
    newStatus = 'paid';
  } else if (totalPaid > 0) {
    newStatus = 'partial';
  } else {
    newStatus = 'reserved';
  }

  reservation.total_paid = totalPaid;
  reservation.balance_due = balanceDue;
  reservation.status = newStatus;
  reservation.updated_at = now;

  // Update ticket
  const ticket = localDbInstance.tickets.find(t => t.id === reservation.ticket_id);
  if (ticket) {
    ticket.status = newStatus;
    ticket.updated_at = now;
  }

  // Audit
  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: recordedBy,
    action: 'REGISTER_PAYMENT',
    entity_type: 'payment',
    entity_id: payment.id,
    details: `Abono de RD$ ${amt} registrado para el ticket #${formatTicketNumber(reservation.ticket_number)} (${params.paymentMethod}). Nuevo saldo: RD$ ${balanceDue}. Estado: ${newStatus}.`,
    created_at: now
  });

  localDbInstance.saveAll();

  return {
    success: true,
    message: `Abono de RD$ ${amt} registrado exitosamente. Saldo restante: RD$ ${balanceDue}.`,
    payment,
    newStatus
  };
}

// REVERSE / ADJUST PAYMENT (AUDITED)
export async function reversePayment(paymentId: string, reason: string, recordedBy = 'Administrador'): Promise<{
  success: boolean;
  message: string;
}> {
  const payment = localDbInstance.payments.find(p => p.id === paymentId);
  if (!payment) {
    return { success: false, message: 'Pago no encontrado.' };
  }

  if (payment.status === 'reversed') {
    return { success: false, message: 'Este pago ya ha sido revertido previamente.' };
  }

  if (!reason.trim()) {
    return { success: false, message: 'Debe especificar el motivo de la reversión para el registro de auditoría.' };
  }

  const now = new Date().toISOString();
  payment.status = 'reversed';
  payment.reversal_reason = reason.trim();
  payment.reversed_at = now;

  // Recalculate reservation
  const reservation = localDbInstance.reservations.find(r => r.id === payment.reservation_id);
  if (reservation) {
    const allConfirmed = localDbInstance.payments.filter(
      p => p.reservation_id === reservation.id && p.status === 'confirmed'
    );
    const totalPaid = allConfirmed.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, reservation.total_price - totalPaid);

    let newStatus: TicketStatus = reservation.status === 'cancelled' ? 'reserved' : (reservation.status as TicketStatus);
    if (balanceDue === 0) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    } else {
      newStatus = 'reserved';
    }

    reservation.total_paid = totalPaid;
    reservation.balance_due = balanceDue;
    reservation.status = newStatus;
    reservation.updated_at = now;

    const ticket = localDbInstance.tickets.find(t => t.id === reservation.ticket_id);
    if (ticket) {
      ticket.status = newStatus;
      ticket.updated_at = now;
    }
  }

  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: recordedBy,
    action: 'REVERSE_PAYMENT',
    entity_type: 'payment',
    entity_id: payment.id,
    details: `Reversión de pago de RD$ ${payment.amount} (Ticket #${formatTicketNumber(payment.ticket_number || 0)}). Motivo: ${reason}`,
    created_at: now
  });

  localDbInstance.saveAll();

  return { success: true, message: 'Pago revertido y saldos recalculados correctamente.' };
}

// CANCEL RESERVATION
export async function cancelReservation(
  reservationId: string,
  reason: string,
  recordedBy = 'Administrador'
): Promise<{ success: boolean; message: string }> {
  const reservation = localDbInstance.reservations.find(r => r.id === reservationId);
  if (!reservation) {
    return { success: false, message: 'Reserva no encontrada.' };
  }

  if (reservation.status === 'cancelled') {
    return { success: false, message: 'Esta reserva ya está cancelada.' };
  }

  const now = new Date().toISOString();
  reservation.status = 'cancelled';
  reservation.cancelled_at = now;
  reservation.cancellation_reason = reason.trim() || 'Cancelación administrativa';
  reservation.updated_at = now;

  // Free ticket back to available
  const ticket = localDbInstance.tickets.find(t => t.id === reservation.ticket_id);
  if (ticket) {
    ticket.status = 'available';
    ticket.reservation_id = null;
    ticket.updated_at = now;
  }

  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: recordedBy,
    action: 'CANCEL_RESERVATION',
    entity_type: 'reservation',
    entity_id: reservation.id,
    details: `Cancelación de reserva #${formatTicketNumber(reservation.ticket_number)}. Ticket liberado a DISPONIBLE. Motivo: ${reason}`,
    created_at: now
  });

  localDbInstance.saveAll();

  return {
    success: true,
    message: `Reserva cancelada. El número #${formatTicketNumber(reservation.ticket_number)} ha vuelto a estar DISPONIBLE.`
  };
}

// DELETE / PURGE INDIVIDUAL TICKET (RESTORES TO AVAILABLE)
export async function deleteIndividualTicket(
  ticketNumber: number,
  recordedBy = 'Administrador'
): Promise<{ success: boolean; message: string }> {
  const ticket = localDbInstance.tickets.find(t => t.number === ticketNumber);
  if (!ticket) {
    return { success: false, message: 'Ticket no encontrado.' };
  }

  const reservationId = ticket.reservation_id;
  const now = new Date().toISOString();

  // 1. Reset ticket to available
  ticket.status = 'available';
  ticket.reservation_id = null;
  ticket.updated_at = now;

  // 2. Remove winner if it was registered for this ticket
  localDbInstance.winners = localDbInstance.winners.filter(w => w.ticket_number !== ticketNumber);

  // 3. Remove reservation & associated payments
  if (reservationId) {
    localDbInstance.payments = localDbInstance.payments.filter(
      p => p.reservation_id !== reservationId && p.ticket_number !== ticketNumber
    );
    localDbInstance.reservations = localDbInstance.reservations.filter(
      r => r.id !== reservationId && r.ticket_number !== ticketNumber
    );
  } else {
    localDbInstance.payments = localDbInstance.payments.filter(p => p.ticket_number !== ticketNumber);
    localDbInstance.reservations = localDbInstance.reservations.filter(r => r.ticket_number !== ticketNumber);
  }

  // 4. Audit Log
  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: recordedBy,
    action: 'DELETE_TICKET_INDIVIDUAL',
    entity_type: 'ticket',
    entity_id: String(ticketNumber),
    details: `Ticket #${formatTicketNumber(ticketNumber)} eliminado individualmente. Reservas y pagos borrados. Restaurado a DISPONIBLE.`,
    created_at: now
  });

  localDbInstance.saveAll();

  // 5. Supabase remote sync if active
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error: rpcError } = await client.rpc('delete_ticket_individual', {
        p_ticket_number: ticketNumber,
        p_user: recordedBy
      });
      if (rpcError) {
        if (reservationId) {
          await client.from('payments').delete().eq('reservation_id', reservationId);
          await client.from('reservations').delete().eq('id', reservationId);
        } else {
          await client.from('reservations').delete().eq('ticket_number', ticketNumber);
        }
        await client.from('raffle_winners').delete().eq('ticket_number', ticketNumber);
        await client.from('tickets').update({ status: 'available', reservation_id: null }).eq('number', ticketNumber);
      }
    } catch (err) {
      console.warn('Error syncing individual ticket delete to Supabase:', err);
    }
  }

  return {
    success: true,
    message: `Boleta #${formatTicketNumber(ticketNumber)} eliminada y restaurada a DISPONIBLE exitosamente.`
  };
}

// UPDATE PARTICIPANT DETAILS
export async function updateParticipant(
  participantId: string,
  firstName: string,
  lastName: string,
  phone: string,
  recordedBy = 'Administrador'
): Promise<{ success: boolean; message: string }> {
  const part = localDbInstance.participants.find(p => p.id === participantId);
  if (!part) {
    return { success: false, message: 'Participante no encontrado.' };
  }

  part.first_name = firstName.trim();
  part.last_name = lastName.trim();
  part.phone = phone.trim();
  part.updated_at = new Date().toISOString();

  // update cached inside reservations
  localDbInstance.reservations.forEach(r => {
    if (r.participant_id === participantId) {
      r.participant = part;
    }
  });

  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: recordedBy,
    action: 'UPDATE_PARTICIPANT',
    entity_type: 'participant',
    entity_id: participantId,
    details: `Datos actualizados: ${firstName} ${lastName} (${phone})`,
    created_at: new Date().toISOString()
  });

  localDbInstance.saveAll();
  return { success: true, message: 'Datos de participante actualizados.' };
}

// CALCULATE FINANCIAL STATISTICS ACCURATELY
export function getFinancialStats(): FinancialStats {
  const tickets = localDbInstance.tickets;
  const reservations = localDbInstance.reservations.filter(r => r.status !== 'cancelled');
  const payments = localDbInstance.payments.filter(p => p.status === 'confirmed');
  const participants = localDbInstance.participants;
  const ticketPrice = localDbInstance.settings.ticket_price;

  let availableCount = 0;
  let reservedCount = 0;
  let partialCount = 0;
  let paidCount = 0;
  let blockedCount = 0;

  tickets.forEach(t => {
    switch (t.status) {
      case 'available':
        availableCount++;
        break;
      case 'reserved':
        reservedCount++;
        break;
      case 'partial':
        partialCount++;
        break;
      case 'paid':
        paidCount++;
        break;
      case 'blocked':
        blockedCount++;
        break;
    }
  });

  const occupiedCount = 300 - availableCount - blockedCount;
  const occupancyPercentage = Math.round((occupiedCount / 300) * 100);

  // Exact revenues from confirmed payments only
  const totalConfirmedRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Committed active amounts
  const totalCommittedActive = reservations.reduce((sum, r) => sum + r.total_price, 0);

  // Pending balance due from active reservations
  const totalPendingBalance = reservations.reduce((sum, r) => sum + r.balance_due, 0);

  // Total Potential Gross (300 tickets * current price, e.g. 300 * 200 = RD$ 60,000)
  const totalPotentialGross = 300 * ticketPrice;

  return {
    totalTickets: 300,
    availableTickets: availableCount,
    reservedPendingTickets: reservedCount,
    partialPaymentTickets: partialCount,
    fullyPaidTickets: paidCount,
    blockedTickets: blockedCount,
    occupiedTickets: occupiedCount,
    occupancyPercentage,
    registeredParticipantsCount: participants.length,
    totalPotentialGross,
    totalCommittedActive,
    totalConfirmedRevenue,
    totalPendingBalance
  };
}

// RECORD RAFFLE DRAW & WINNER
export interface ConfirmDrawWinnerParams {
  prizePosition: PrizePosition;
  winningTicketNumber: number;
  selectionMethod: string;
  eligibleTicketNumbers: number[];
  confirmedBy?: string;
}

export async function confirmDrawWinner(params: ConfirmDrawWinnerParams): Promise<{
  success: boolean;
  message: string;
  winner?: RaffleWinner;
}> {
  const ticket = localDbInstance.tickets.find(t => t.number === params.winningTicketNumber);
  if (!ticket || !ticket.reservation_id) {
    return { success: false, message: 'El ticket ganador no tiene una reserva válida.' };
  }

  const reservation = localDbInstance.reservations.find(r => r.id === ticket.reservation_id);
  const participant = reservation
    ? localDbInstance.participants.find(p => p.id === reservation.participant_id)
    : null;

  const participantName = participant
    ? `${participant.first_name} ${participant.last_name}`
    : 'Participante RIFA COURT';

  const settings = localDbInstance.settings;
  const prizeTitle =
    params.prizePosition === 1
      ? settings.prize_1_title
      : params.prizePosition === 2
      ? settings.prize_2_title
      : settings.prize_3_title;

  const now = new Date().toISOString();
  const confirmedBy = params.confirmedBy || 'Administrador Oficial';
  const verificationCode = `WIN-${params.prizePosition}-${params.winningTicketNumber}-${Date.now().toString(36).toUpperCase()}`;

  // Check if position already drawn
  const existingWinnerIdx = localDbInstance.winners.findIndex(w => w.prize_position === params.prizePosition);

  const winner: RaffleWinner = {
    id: `winner_${params.prizePosition}_${Date.now()}`,
    ticket_id: ticket.id,
    ticket_number: params.winningTicketNumber,
    participant_name: participantName,
    prize_position: params.prizePosition,
    prize_title: prizeTitle,
    draw_date: now,
    selection_method: params.selectionMethod,
    confirmed_at: now,
    confirmed_by: confirmedBy,
    verification_code: verificationCode
  };

  if (existingWinnerIdx >= 0) {
    localDbInstance.winners[existingWinnerIdx] = winner;
  } else {
    localDbInstance.winners.push(winner);
  }

  const draw: RaffleDraw = {
    id: `draw_${Date.now()}`,
    prize_position: params.prizePosition,
    eligible_ticket_ids: params.eligibleTicketNumbers,
    winning_ticket_id: params.winningTicketNumber,
    selection_method: params.selectionMethod,
    drawn_at: now,
    drawn_by: confirmedBy,
    status: 'confirmed',
    verification_data: JSON.stringify({
      code: verificationCode,
      ticketsCount: params.eligibleTicketNumbers.length,
      timestamp: Date.now()
    })
  };
  localDbInstance.draws.push(draw);

  localDbInstance.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    user_id: confirmedBy,
    action: 'CONFIRM_DRAW_WINNER',
    entity_type: 'raffle_winner',
    entity_id: winner.id,
    details: `Ganador del ${prizeTitle}: Ticket #${formatTicketNumber(params.winningTicketNumber)} — ${participantName}. Código: ${verificationCode}.`,
    created_at: now
  });

  localDbInstance.saveAll();

  return {
    success: true,
    message: `¡Ganador del ${prizeTitle} confirmado con éxito!`,
    winner
  };
}

export function resetAllDataToDefault() {
  localDbInstance.resetToDefault();
}

export async function clearDatabase(): Promise<{ success: boolean; message: string }> {
  localDbInstance.clearAllData();

  // If Supabase is connected, wipe the remote database as well
  const client = getSupabaseClient();
  if (client) {
    try {
      // First try stored procedure
      const { error: rpcError } = await client.rpc('reset_raffle_court');
      if (rpcError) {
        // Fallback to direct deletes
        await client.from('payments').delete().neq('amount', -1);
        await client.from('tickets').update({ status: 'available', reservation_id: null }).neq('number', 0);
        await client.from('reservations').delete().neq('total_price', -1);
        await client.from('participants').delete().neq('first_name', '__none__');
        await client.from('raffle_winners').delete().neq('prize_position', 0);
        await client.from('raffle_draws').delete().neq('winning_ticket_id', 0);
      }
    } catch (err) {
      console.warn('Error clearing Supabase tables directly:', err);
    }
  }

  return {
    success: true,
    message: 'Base de datos restablecida completamente. Los 300 números vuelven a estar disponibles.'
  };
}

// Background sync helper to Supabase if connected
async function syncReservationToSupabase(
  reservation: Reservation,
  participant: Participant,
  initialPaymentAmount: number,
  paymentMethod?: PaymentMethod,
  reference?: string
) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // 1. Participant
    await client.from('participants').upsert({
      id: participant.id,
      first_name: participant.first_name,
      last_name: participant.last_name,
      phone: participant.phone,
      created_at: participant.created_at,
      updated_at: participant.updated_at
    });

    // 2. Reservation
    await client.from('reservations').upsert({
      id: reservation.id,
      ticket_id: reservation.ticket_id,
      ticket_number: reservation.ticket_number,
      participant_id: reservation.participant_id,
      total_price: reservation.total_price,
      status: reservation.status,
      reserved_at: reservation.reserved_at,
      notes: reservation.notes || null,
      created_by: reservation.created_by,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    });

    // 3. Ticket status
    await client.from('tickets').update({
      status: reservation.status,
      reservation_id: reservation.id,
      updated_at: new Date().toISOString()
    }).eq('number', reservation.ticket_number);

    // 4. Payment if any
    if (initialPaymentAmount > 0) {
      await client.from('payments').insert({
        reservation_id: reservation.id,
        amount: initialPaymentAmount,
        payment_method: paymentMethod || 'cash',
        status: 'confirmed',
        reference: reference || null,
        received_at: new Date().toISOString(),
        recorded_by: reservation.created_by
      });
    }
  } catch (err) {
    console.warn('Could not sync to Supabase (offline/table missing):', err);
  }
}
