import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  Filter, 
  CreditCard,
  Building,
  Banknote,
  Coins
} from 'lucide-react';
import { 
  getAllPayments, 
  getAllReservations, 
  formatTicketNumber, 
  reversePayment 
} from '../lib/db';
import { Payment, PaymentMethod, PAYMENT_METHOD_LABELS } from '../types/raffle';

interface PaymentsViewProps {
  onSelectTicketNumber: (num: number) => void;
  isAdmin: boolean;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onSelectTicketNumber,
  isAdmin
}) => {
  const payments = getAllPayments();
  const reservations = getAllReservations();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Breakdown metrics
  const metrics = useMemo(() => {
    let totalCash = 0;
    let totalTransfer = 0;
    let totalDeposit = 0;
    let totalOther = 0;
    let totalConfirmed = 0;
    let totalReversed = 0;

    payments.forEach((p) => {
      if (p.status === 'confirmed') {
        totalConfirmed += p.amount;
        if (p.payment_method === 'cash') totalCash += p.amount;
        else if (p.payment_method === 'transfer') totalTransfer += p.amount;
        else if (p.payment_method === 'deposit') totalDeposit += p.amount;
        else totalOther += p.amount;
      } else {
        totalReversed += p.amount;
      }
    });

    return {
      totalCash,
      totalTransfer,
      totalDeposit,
      totalOther,
      totalConfirmed,
      totalReversed,
      confirmedCount: payments.filter((p) => p.status === 'confirmed').length,
    };
  }, [payments]);

  // Filter
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const tNum = String(p.ticket_number || '');
        const ref = (p.reference || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();

        if (!tNum.includes(q) && !ref.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [payments, methodFilter, statusFilter, searchTerm]);

  const handleExportCsv = () => {
    const headers = ['ID', 'Ticket', 'Monto RD$', 'Metodo', 'Estado', 'Referencia', 'Notas', 'Fecha', 'Registrado Por', 'Motivo Reversion'];
    const rows = filteredPayments.map((p) => [
      `"${p.id}"`,
      p.ticket_number ? formatTicketNumber(p.ticket_number) : '',
      p.amount,
      PAYMENT_METHOD_LABELS[p.payment_method],
      p.status,
      `"${p.reference || ''}"`,
      `"${p.notes || ''}"`,
      `"${new Date(p.received_at).toLocaleString()}"`,
      `"${p.recorded_by}"`,
      `"${p.reversal_reason || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pagos_rifa_court_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReverse = async (paymentId: string) => {
    const reason = prompt('Ingrese el motivo de la reversión / corrección:');
    if (!reason || !reason.trim()) return;
    const res = await reversePayment(paymentId, reason.trim(), 'Administrador');
    if (!res.success) alert(res.message);
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              GESTIÓN DE PAGOS Y ABONOS
            </h2>
            <p className="text-xs text-slate-400">
              Total confirmado: <span className="font-mono font-bold text-emerald-400">RD$ {metrics.totalConfirmed.toLocaleString()}</span> ({metrics.confirmedCount} transacciones)
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Exportar Pagos CSV</span>
          </button>
        )}
      </div>

      {/* Methods Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0B1118] border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span>Efectivo</span>
          </div>
          <span className="font-['Outfit'] font-bold text-base text-white font-mono tabular-nums">
            RD$ {metrics.totalCash.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B1118] border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>Transferencia</span>
          </div>
          <span className="font-['Outfit'] font-bold text-base text-white font-mono tabular-nums">
            RD$ {metrics.totalTransfer.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B1118] border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Building className="w-3.5 h-3.5 text-purple-400" />
            <span>Depósito</span>
          </div>
          <span className="font-['Outfit'] font-bold text-base text-white font-mono tabular-nums">
            RD$ {metrics.totalDeposit.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B1118] border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Coins className="w-3.5 h-3.5 text-orange-400" />
            <span>Otros Medios</span>
          </div>
          <span className="font-['Outfit'] font-bold text-base text-white font-mono tabular-nums">
            RD$ {metrics.totalOther.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B1118] border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por # de ticket, referencia o comprobante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos los métodos</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="deposit">Depósito</option>
            <option value="other">Otro</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmados</option>
            <option value="reversed">Revertidos</option>
          </select>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121A24] border-b border-slate-800 text-slate-400 uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Boleta</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Comprobante / Ref</th>
                <th className="py-3 px-4">Registrado Por</th>
                <th className="py-3 px-4 text-center">Estado</th>
                {isAdmin && <th className="py-3 px-4 text-center">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredPayments.map((p) => {
                const isConfirmed = p.status === 'confirmed';

                return (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {new Date(p.received_at).toLocaleDateString()} {new Date(p.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.ticket_number ? (
                        <button
                          onClick={() => onSelectTicketNumber(p.ticket_number!)}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-orange-600 border border-slate-700 hover:border-orange-500 text-orange-400 hover:text-white font-bold transition-colors"
                        >
                          #{formatTicketNumber(p.ticket_number)}
                        </button>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      <span className={isConfirmed ? 'text-emerald-400 text-sm' : 'line-through text-slate-500'}>
                        RD$ {p.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-sans whitespace-nowrap">
                      {PAYMENT_METHOD_LABELS[p.payment_method]}
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {p.reference || <span className="text-slate-600">—</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-sans whitespace-nowrap">
                      {p.recorded_by}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isConfirmed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40">
                          Confirmado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-800/40" title={p.reversal_reason}>
                          Revertido
                        </span>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isConfirmed && (
                          <button
                            onClick={() => handleReverse(p.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Revertir este pago con auditoría"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-500 font-sans">
                    No se encontraron pagos registrados con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
