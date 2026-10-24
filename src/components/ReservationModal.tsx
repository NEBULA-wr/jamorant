import React, { useState } from 'react';
import { 
  X, 
  Ticket, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  PaymentMethod, 
  PAYMENT_METHOD_LABELS, 
  RaffleSettings, 
  Ticket as TicketType 
} from '../types/raffle';
import { formatTicketNumber, reserveTicket } from '../lib/db';

interface ReservationModalProps {
  ticket: TicketType;
  settings: RaffleSettings;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin: boolean;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  ticket,
  settings,
  onClose,
  onSuccess,
  isAdmin
}) => {
  const [fullName, setFullName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'reserved' | 'partial' | 'blocked'>('paid');
  const [amountPaid, setAmountPaid] = useState<number>(settings.ticket_price);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  // Handle status change
  const handleStatusChange = (status: 'paid' | 'reserved' | 'partial' | 'blocked') => {
    setPaymentStatus(status);
    if (status === 'paid') {
      setAmountPaid(settings.ticket_price);
    } else if (status === 'reserved' || status === 'blocked') {
      setAmountPaid(0);
    } else if (status === 'partial') {
      setAmountPaid(Math.round(settings.ticket_price / 2));
    }
  };

  const calculatedBalanceDue = Math.max(0, settings.ticket_price - (amountPaid || 0));

  const handleValidateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (paymentStatus !== 'blocked') {
      if (!fullName.trim()) {
        setErrorMsg('El nombre del participante es obligatorio.');
        return;
      }
    }

    if (paymentStatus === 'partial') {
      if (amountPaid <= 0) {
        setErrorMsg('El abono inicial debe ser mayor a RD$ 0.');
        return;
      }
      if (amountPaid >= settings.ticket_price) {
        setPaymentStatus('paid');
      }
    }

    if (amountPaid > settings.ticket_price) {
      setErrorMsg(`El abono no puede superar el precio total (RD$ ${settings.ticket_price}).`);
      return;
    }

    setShowConfirmStep(true);
  };

  const handleConfirmReservation = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await reserveTicket({
        ticketNumber: ticket.number,
        fullName: fullName.trim(),
        initialState: paymentStatus,
        initialAmountPaid: amountPaid,
        paymentMethod,
        notes: notes.trim(),
        recordedBy: isAdmin ? 'Administrador' : 'Público Web'
      });

      if (!res.success) {
        setErrorMsg(res.message);
        setShowConfirmStep(false);
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Error inesperado: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F1724] border border-orange-500/40 shadow-2xl p-5 sm:p-7 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-950/80 border border-orange-500/50 flex items-center justify-center text-[#FF6418]">
              <Ticket className="w-4 h-4" />
            </div>
            <h3 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              RESERVAR NÚMERO <span className="text-[#FF6418]">#{ticket.formatted_number}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Confirmation Step */}
        {showConfirmStep ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/30">
              <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Confirmar datos de la reserva
              </h4>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Boleta Seleccionada:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    #{ticket.formatted_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Nombre del Participante:</span>
                  <span className="font-bold text-white">
                    {fullName}
                  </span>
                </div>
                {notes && (
                  <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="text-slate-400">Observaciones:</span>
                    <span className="text-slate-200 italic">{notes}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Precio Total:</span>
                  <span className="font-mono font-bold text-white">
                    RD$ {settings.ticket_price}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Monto Recibido:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    RD$ {amountPaid}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Saldo Pendiente:</span>
                  <span className={`font-mono font-bold ${calculatedBalanceDue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    RD$ {calculatedBalanceDue}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmStep(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Modificar
              </button>
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,100,24,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        ) : (
          /* Simplified Form requiring ONLY Name and Observaciones */
          <form onSubmit={handleValidateAndProceed} className="mt-5 space-y-4 text-xs">
            {/* Nombre del participante */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nombre del Participante <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Escribe el nombre completo..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121A24] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Observaciones
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  placeholder="Detalles u observaciones de la boleta (opcional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#121A24] border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Estado del pago */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Estado del Pago <span className="text-orange-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('paid')}
                  className={`py-2 px-2.5 rounded-lg border font-semibold text-center transition-all ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-[#121A24] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pagado (RD$ {settings.ticket_price})
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('reserved')}
                  className={`py-2 px-2.5 rounded-lg border font-semibold text-center transition-all ${
                    paymentStatus === 'reserved'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-[#121A24] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pendiente (RD$ 0)
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('partial')}
                  className={`py-2 px-2.5 rounded-lg border font-semibold text-center transition-all ${
                    paymentStatus === 'partial'
                      ? 'bg-orange-950/70 border-orange-500 text-orange-300 shadow-[0_0_10px_rgba(234,88,12,0.3)]'
                      : 'bg-[#121A24] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Abono Inicial
                </button>
              </div>
            </div>

            {/* Monto abonado si es abono inicial */}
            {paymentStatus === 'partial' && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Monto Abonado (RD$) <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <span className="text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 font-bold font-mono">
                    RD$
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={settings.ticket_price}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full pl-12 pr-3 py-2 bg-[#121A24] border border-orange-500/60 rounded-lg text-slate-100 font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Método de pago si hay dinero recibido */}
            {amountPaid > 0 && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Saldo y Precio Total resumen */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Precio total boleta:</span>
                <span className="text-white font-bold">RD$ {settings.ticket_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto recibido:</span>
                <span className="text-emerald-400 font-bold">RD$ {amountPaid}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-300 font-semibold">Saldo restante por cobrar:</span>
                <span className={`font-bold ${calculatedBalanceDue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  RD$ {calculatedBalanceDue}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,100,24,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar Reserva
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
