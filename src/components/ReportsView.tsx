import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Download, 
  PieChart, 
  Users, 
  Ticket as TicketIcon,
  ShieldAlert
} from 'lucide-react';
import { 
  getAllPayments, 
  getAllReservations, 
  getAllTickets, 
  getAllParticipants, 
  getFinancialStats, 
  formatTicketNumber 
} from '../lib/db';
import { PAYMENT_METHOD_LABELS } from '../types/raffle';

interface ReportsViewProps {
  isAdmin: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ isAdmin }) => {
  const stats = getFinancialStats();
  const payments = getAllPayments();
  const reservations = getAllReservations();
  const tickets = getAllTickets();
  const participants = getAllParticipants();

  // Export functions
  const exportParticipantsCsv = () => {
    const headers = ['ID', 'Nombre', 'Apellido', 'Telefono', 'Fecha Creacion'];
    const rows = participants.map(p => [
      `"${p.id}"`,
      `"${p.first_name}"`,
      `"${p.last_name}"`,
      `"${p.phone}"`,
      `"${p.created_at}"`
    ]);
    downloadCsv(headers, rows, 'participantes_rifa_court.csv');
  };

  const exportTicketsCsv = () => {
    const headers = ['Numero', 'Numero Formateado', 'Estado', 'ID Reserva'];
    const rows = tickets.map(t => [
      t.number,
      `"${t.formatted_number}"`,
      t.status,
      `"${t.reservation_id || ''}"`
    ]);
    downloadCsv(headers, rows, 'boletas_rifa_court.csv');
  };

  const exportFinancialSummaryCsv = () => {
    const headers = ['Indicador', 'Valor RD$ / Cantidad'];
    const rows = [
      ['Total de Boletas Emitidas', stats.totalTickets],
      ['Boletas Disponibles', stats.availableTickets],
      ['Boletas Reservadas Pendientes', stats.reservedPendingTickets],
      ['Boletas con Abono Parcial', stats.partialPaymentTickets],
      ['Boletas Pagadas al 100%', stats.fullyPaidTickets],
      ['Porcentaje de Ocupacion', `${stats.occupancyPercentage}%`],
      ['Total Participantes Registrados', stats.registeredParticipantsCount],
      ['Meta Bruta Potencial (300 x RD$ 200)', `RD$ ${stats.totalPotentialGross}`],
      ['Ingreso Efectivamente Recaudado', `RD$ ${stats.totalConfirmedRevenue}`],
      ['Saldo Pendiente por Cobrar', `RD$ ${stats.totalPendingBalance}`],
      ['Total Contratado en Reservas Activas', `RD$ ${stats.totalCommittedActive}`]
    ];
    downloadCsv(headers, rows, 'resumen_financiero_rifa_court.csv');
  };

  const downloadCsv = (headers: string[], rows: (string | number)[][], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-[#FF6418]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              REPORTES FINANCIEROS Y AUDITORÍA
            </h2>
            <p className="text-xs text-slate-400">
              Balances calculados en tiempo real según pagos confirmados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportFinancialSummaryCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6418] hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,100,24,0.3)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Resumen Financiero</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recaudado Efectivo */}
        <div className="p-4 rounded-xl bg-[#0B1118] border border-emerald-900/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dinero Recaudado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-['Outfit'] font-black text-2xl text-emerald-400 font-mono block tabular-nums">
            RD$ {stats.totalConfirmedRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Solo pagos confirmados
          </span>
        </div>

        {/* Saldo Pendiente */}
        <div className="p-4 rounded-xl bg-[#0B1118] border border-amber-900/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Saldo Pendiente de Cobro</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-['Outfit'] font-black text-2xl text-amber-400 font-mono block tabular-nums">
            RD$ {stats.totalPendingBalance.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block">
            En reservas activas
          </span>
        </div>

        {/* Contratado Activo */}
        <div className="p-4 rounded-xl bg-[#0B1118] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Contratado</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-['Outfit'] font-black text-2xl text-white font-mono block tabular-nums">
            RD$ {stats.totalCommittedActive.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Recaudado + Pendiente
          </span>
        </div>

        {/* Potencial Máximo */}
        <div className="p-4 rounded-xl bg-[#0B1118] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Meta Potencial Bruta</span>
            <TicketIcon className="w-4 h-4 text-orange-400" />
          </div>
          <span className="font-['Outfit'] font-black text-2xl text-orange-400 font-mono block tabular-nums">
            RD$ {stats.totalPotentialGross.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block">
            300 boletas a RD$ 200
          </span>
        </div>
      </div>

      {/* Tickets Distribution & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-[#0B1118] border border-slate-800 space-y-4">
          <h3 className="font-['Outfit'] font-black text-base text-white uppercase tracking-wider">
            Distribución de las 300 Boletas
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-sans font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Boletas Disponibles
                </span>
                <span className="font-bold text-emerald-400">{stats.availableTickets} boletas ({Math.round((stats.availableTickets/300)*100)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.availableTickets/300)*100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-sans font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  Boletas Pagadas al 100%
                </span>
                <span className="font-bold text-slate-200">{stats.fullyPaidTickets} boletas ({Math.round((stats.fullyPaidTickets/300)*100)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(stats.fullyPaidTickets/300)*100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-sans font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Reservadas Pendientes de Pago
                </span>
                <span className="font-bold text-amber-400">{stats.reservedPendingTickets} boletas ({Math.round((stats.reservedPendingTickets/300)*100)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.reservedPendingTickets/300)*100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-sans font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  Con Abonos Parciales
                </span>
                <span className="font-bold text-orange-400">{stats.partialPaymentTickets} boletas ({Math.round((stats.partialPaymentTickets/300)*100)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(stats.partialPaymentTickets/300)*100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* CSV Export Options Panel */}
        <div className="p-5 rounded-2xl bg-[#0B1118] border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-['Outfit'] font-black text-base text-white uppercase tracking-wider mb-2">
              Exportación de Datos Autorizados
            </h3>
            <p className="text-xs text-slate-400">
              Genera archivos CSV compatibles con Microsoft Excel, Google Sheets y software contable para auditoría de la rifa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={exportParticipantsCsv}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-white block">Participantes</span>
                <span className="text-[10px] text-slate-400">{participants.length} registros</span>
              </div>
              <Download className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={exportTicketsCsv}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-white block">300 Boletas</span>
                <span className="text-[10px] text-slate-400">Estado de cada número</span>
              </div>
              <Download className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 text-xs text-slate-400">
            <p className="leading-relaxed">
              <strong className="text-orange-400">Regla Contable:</strong> Los saldos pendientes por cobrar nunca se computan como ingresos realizados hasta la recepción formal del pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
