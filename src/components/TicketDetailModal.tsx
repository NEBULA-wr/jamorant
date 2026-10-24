import React, { useState } from 'react';
import { 
  X, 
  Ticket as TicketIcon, 
  User, 
  Phone, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Download,
  Trash2
} from 'lucide-react';
import { 
  Ticket, 
  PaymentMethod, 
  PAYMENT_METHOD_LABELS, 
  STATUS_COLORS, 
  STATUS_LABELS,
  RaffleSettings 
} from '../types/raffle';
import { 
  cancelReservation, 
  deleteIndividualTicket,
  formatTicketNumber, 
  getTicketByNumber, 
  registerPayment, 
  reversePayment 
} from '../lib/db';
import { generateSingleReceiptPdf } from '../lib/pdfGenerator';
import { PasswordModal } from './PasswordModal';

interface TicketDetailModalProps {
  ticketNumber: number;
  settings: RaffleSettings;
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketNumber,
  settings,
  isAdmin,
  onClose,
  onUpdate
}) => {
  const data = getTicketByNumber(ticketNumber);
  const { ticket, reservation, participant, payments } = data;

  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(reservation?.balance_due || 0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('cash');
  const [newPaymentRef, setNewPaymentRef] = useState('');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);

  const handleConfirmDeleteWithPassword = async () => {
    setShowDeletePasswordModal(false);
    setIsDeletingTicket(true);
    setErrorMsg(null);
    try {
      const res = await deleteIndividualTicket(ticketNumber, 'Administrador');
      if (!res.success) {
        setErrorMsg(res.message);
        setIsDeletingTicket(false);
        return;
      }
      onUpdate();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setIsDeletingTicket(false);
    }
  };

  if (!ticket || !reservation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-[#0F1724] border border-slate-800 p-6 text-center">
          <TicketIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Número #{formatTicketNumber(ticketNumber)}</h3>
          <p className="text-xs text-slate-400 mt-1">Este número se encuentra actualmente disponible.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[ticket.status];

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmittingPayment(true);

    try {
      const res = await registerPayment({
        reservationId: reservation.id,
        amount: Number(newPaymentAmount),
        paymentMethod: newPaymentMethod,
        reference: newPaymentRef,
        notes: newPaymentNotes,
        recordedBy: isAdmin ? 'Administrador' : 'Gestor'
      });

      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmittingPayment(false);
        return;
      }

      setSuccessMsg(res.message);
      setShowAddPaymentForm(false);
      setIsSubmittingPayment(false);
      onUpdate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setIsSubmittingPayment(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelReason.trim()) {
      setErrorMsg('Debe ingresar un motivo para cancelar la reserva.');
      return;
    }

    setIsCancelling(true);
    setErrorMsg(null);

    try {
      const res = await cancelReservation(reservation.id, cancelReason, 'Administrador');
      if (!res.success) {
        setErrorMsg(res.message);
        setIsCancelling(false);
        return;
      }

      onUpdate();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setIsCancelling(false);
    }
  };

  const handleReversePayment = async (paymentId: string) => {
    const reason = prompt('Ingrese el motivo de la reversión o corrección del pago:');
    if (!reason || !reason.trim()) return;

    try {
      const res = await reversePayment(paymentId, reason.trim(), 'Administrador');
      if (!res.success) {
        alert(res.message);
        return;
      }
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0F1724] border border-slate-700 shadow-2xl p-5 sm:p-7 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-mono font-black text-lg">
              #{formatTicketNumber(ticket.number)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Outfit'] font-black text-lg sm:text-xl text-white tracking-wide uppercase">
                  DETALLE DE BOLETA
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyle.text} bg-slate-900 border ${statusStyle.border}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Precio de boleta: <span className="font-mono font-bold text-white">RD$ {reservation.total_price}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Public View: Privacy Protected */}
        {!isAdmin ? (
          <div className="mt-6 py-6 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
            <h4 className="font-['Outfit'] font-bold text-lg text-white">
              Boleta #{formatTicketNumber(ticket.number)} Reservada
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Por motivos de privacidad y seguridad de los participantes, los datos personales y montos individuales solo están disponibles para el administrador de RIFA COURT.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono inline-block text-slate-300">
              Estado: <span className={`font-bold ${statusStyle.text}`}>{STATUS_LABELS[ticket.status].toUpperCase()}</span>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeletePasswordModal(true)}
                disabled={isDeletingTicket}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar Esta Boleta (morant2026)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Admin View: Full Details & Controls */
          <div className="mt-5 space-y-5">
            {/* Participant Card */}
            <div className="p-4 rounded-xl bg-[#121A24] border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                Datos del Participante
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Nombre Completo:</span>
                  <span className="font-bold text-white text-sm">
                    {participant?.first_name} {participant?.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Teléfono / WhatsApp:</span>
                  {participant?.phone && participant.phone.trim() ? (
                    <a
                      href={`https://wa.me/${participant.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {participant.phone}
                    </a>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">No especificado</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Fecha de Reserva:</span>
                  <span className="text-slate-300">
                    {new Date(reservation.reserved_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registrado por:</span>
                  <span className="text-slate-300">{reservation.created_by}</span>
                </div>
              </div>

              {reservation.notes && (
                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">Observaciones: </span>
                  <span className="text-slate-300 italic">{reservation.notes}</span>
                </div>
              )}
            </div>

            {/* Balances Card */}
            <div className="p-4 rounded-xl bg-[#121A24] border border-slate-800">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block mb-2">
                Estado Financiero de la Boleta
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Precio Total</span>
                  <span className="font-mono font-bold text-sm text-white">
                    RD$ {reservation.total_price}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Abonado</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    RD$ {reservation.total_paid}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Saldo Pendiente</span>
                  <span className={`font-mono font-bold text-sm ${reservation.balance_due > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    RD$ {reservation.balance_due}
                  </span>
                </div>
              </div>
            </div>

            {/* Payments History Ledger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Historial de Pagos ({payments.length})
                </span>
                {reservation.balance_due > 0 && !showAddPaymentForm && (
                  <button
                    onClick={() => {
                      setNewPaymentAmount(reservation.balance_due);
                      setShowAddPaymentForm(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Registrar Abono
                  </button>
                )}
              </div>

              {/* Add Payment Form */}
              {showAddPaymentForm && (
                <form onSubmit={handleRegisterPayment} className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/40 space-y-3 text-xs">
                  <div className="font-bold text-orange-400 flex items-center justify-between">
                    <span>Registrar Nuevo Abono / Pago</span>
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-300 mb-1">Monto (RD$)</label>
                      <input
                        type="number"
                        min={1}
                        max={reservation.balance_due}
                        required
                        value={newPaymentAmount}
                        onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#0F1724] border border-slate-700 rounded text-slate-100 font-mono font-bold focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Método de Pago</label>
                      <select
                        value={newPaymentMethod}
                        onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-2.5 py-1.5 bg-[#0F1724] border border-slate-700 rounded text-slate-200 focus:border-orange-500"
                      >
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Referencia / Comprobante</label>
                    <input
                      type="text"
                      placeholder="Ej. Transferencia BHD #12938"
                      value={newPaymentRef}
                      onChange={(e) => setNewPaymentRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0F1724] border border-slate-700 rounded text-slate-100 focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentForm(false)}
                      className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="flex-1 py-1.5 rounded bg-[#FF6418] hover:bg-orange-500 text-white font-bold text-xs uppercase"
                    >
                      {isSubmittingPayment ? 'Guardando...' : 'Confirmar Abono'}
                    </button>
                  </div>
                </form>
              )}

              {/* Payment rows */}
              {payments.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900 text-center text-xs text-slate-400">
                  No se han registrado pagos para esta reserva.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
                        p.status === 'confirmed'
                          ? 'bg-[#121A24] border-slate-800'
                          : 'bg-rose-950/20 border-rose-900/40 opacity-70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${p.status === 'confirmed' ? 'text-emerald-400' : 'line-through text-slate-500'}`}>
                            RD$ {p.amount}
                          </span>
                          <span className="text-slate-400">· {PAYMENT_METHOD_LABELS[p.payment_method]}</span>
                          {p.reference && <span className="text-slate-500">({p.reference})</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(p.received_at).toLocaleDateString()} por {p.recorded_by}
                          {p.reversal_reason && ` · Revertido: ${p.reversal_reason}`}
                        </span>
                      </div>

                      {p.status === 'confirmed' && (
                        <button
                          onClick={() => handleReversePayment(p.id)}
                          className="px-2 py-0.5 rounded text-[10px] text-rose-400 hover:bg-rose-950/50 border border-rose-800/40 transition-colors"
                          title="Revertir este pago con auditoría"
                        >
                          Revertir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cancel Reservation Prompt */}
            {showCancelPrompt ? (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2 text-xs">
                <span className="font-bold text-rose-300 block">
                  ¿Confirmar cancelación de la reserva?
                </span>
                <p className="text-slate-300 text-[11px]">
                  El número #{formatTicketNumber(ticket.number)} volverá a estar disponible inmediatamente. El historial de pagos se conservará auditado.
                </p>
                <input
                  type="text"
                  placeholder="Motivo de cancelación (obligatorio)..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0F1724] border border-rose-700/60 rounded text-slate-100"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleCancelReservation}
                    disabled={isCancelling}
                    className="flex-1 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    {isCancelling ? 'Cancelando...' : 'Liberar Ticket y Cancelar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeletePasswordModal(true)}
                    disabled={isDeletingTicket}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                    title="Borrar completamente esta boleta con contraseña morant2026"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeletingTicket ? 'Borrando...' : 'Borrar Boleta'}</span>
                  </button>
                  <button
                    onClick={() => setShowCancelPrompt(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Cancelar Reserva
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const doc = generateSingleReceiptPdf({
                        ticketNumber: ticket.number,
                        participantName: participant ? `${participant.first_name} ${participant.last_name}` : 'Participante',
                        notes: reservation.notes,
                        price: reservation.total_price,
                        status: reservation.status === 'paid' ? 'Pagado' : reservation.status,
                        reservationCode: `RES-${formatTicketNumber(ticket.number)}-${reservation.id.slice(-4).toUpperCase()}`,
                        date: new Date(reservation.reserved_at).toLocaleDateString()
                      }, settings.name);
                      doc.save(`comprobante_boleta_${formatTicketNumber(ticket.number)}.pdf`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-orange-400 hover:text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmación con contraseña morant2026 para borrar individualmente */}
        <PasswordModal
          isOpen={showDeletePasswordModal}
          actionTitle={`borrar individualmente la boleta #${formatTicketNumber(ticket.number)} y liberar sus datos`}
          onSuccess={handleConfirmDeleteWithPassword}
          onClose={() => setShowDeletePasswordModal(false)}
        />
      </div>
    </div>
  );
};
