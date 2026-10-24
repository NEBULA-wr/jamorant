import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Ticket as TicketIcon, 
  SlidersHorizontal,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Lock
} from 'lucide-react';
import { Ticket, TicketStatus, STATUS_COLORS, STATUS_LABELS } from '../types/raffle';

interface TicketGridProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
}

const RANGES = [
  { label: 'Todos (001-300)', min: 1, max: 300 },
  { label: '001 - 050', min: 1, max: 50 },
  { label: '051 - 100', min: 51, max: 100 },
  { label: '101 - 150', min: 101, max: 150 },
  { label: '151 - 200', min: 151, max: 200 },
  { label: '201 - 250', min: 201, max: 250 },
  { label: '251 - 300', min: 251, max: 300 },
];

export const TicketGrid: React.FC<TicketGridProps> = ({
  tickets,
  onSelectTicket,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter
}) => {
  const [selectedRange, setSelectedRange] = useState<number>(0); // index in RANGES

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    const range = RANGES[selectedRange];
    return tickets.filter((t) => {
      // Range filter
      if (t.number < range.min || t.number > range.max) {
        return false;
      }

      // Status filter
      if (statusFilter === 'available' && t.status !== 'available') return false;
      if (statusFilter === 'reserved' && t.status !== 'reserved') return false;
      if (statusFilter === 'partial' && t.status !== 'partial') return false;
      if (statusFilter === 'paid' && t.status !== 'paid') return false;
      if (statusFilter === 'blocked' && t.status !== 'blocked') return false;
      if (statusFilter === 'occupied' && t.status === 'available') return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const numStr = String(t.number);
        const paddedNumStr = t.formatted_number;
        if (!numStr.includes(query) && !paddedNumStr.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, selectedRange, statusFilter, searchTerm]);

  return (
    <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-4 lg:p-6 shadow-xl space-y-5">
      {/* Grid Header & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-[#FF6418]">
            <TicketIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              NÚMEROS DE LA RIFA
            </h2>
            <p className="text-xs text-slate-400">
              Mostrando {filteredTickets.length} de {tickets.length} boletas
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
            <span>Pendiente de pago</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(234,88,12,0.5)]" />
            <span>Abono parcial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.4)]" />
            <span>Pagado</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Ver todos
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/30'
            }`}
          >
            Ver disponibles
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'occupied'
                ? 'bg-[#FF6418] text-white shadow-[0_0_10px_rgba(255,100,24,0.4)]'
                : 'bg-orange-950/40 text-orange-400 border border-orange-800/40 hover:bg-orange-900/30'
            }`}
          >
            Ver comprados
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'paid'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            Ver pagados
          </button>
          <button
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'reserved'
                ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:bg-amber-900/30'
            }`}
          >
            Ver pendientes
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'partial'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-950/40 text-orange-400 border border-orange-800/40 hover:bg-orange-900/30'
            }`}
          >
            Ver abonos
          </button>
        </div>

        {/* Range Selector & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Range Dropdown */}
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(Number(e.target.value))}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#121A24] border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
          >
            {RANGES.map((r, idx) => (
              <option key={idx} value={idx}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* The 300 Interactive Numbers Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
        {filteredTickets.map((ticket) => {
          const style = STATUS_COLORS[ticket.status];
          const isAvailable = ticket.status === 'available';

          return (
            <button
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              title={`Número #${ticket.formatted_number} - ${STATUS_LABELS[ticket.status]}`}
              className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all duration-200 ${style.bg} ${style.border} ${style.glow} hover:scale-105 active:scale-95 focus:outline-none`}
            >
              {/* Number Label */}
              <span className="font-['Outfit'] font-black text-sm sm:text-base text-white tracking-wider font-mono">
                {ticket.formatted_number}
              </span>

              {/* Status Dot */}
              <div className="mt-1 flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              </div>

              {/* Hover quick badge */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-950 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none z-20">
                {isAvailable ? 'Click para Reservar' : STATUS_LABELS[ticket.status]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTickets.length === 0 && (
        <div className="py-12 text-center">
          <TicketIcon className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-40" />
          <h4 className="text-slate-300 font-bold text-base">No se encontraron boletas</h4>
          <p className="text-slate-500 text-xs mt-1">
            Prueba cambiando el filtro de estado o la búsqueda por número.
          </p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
              setSelectedRange(0);
            }}
            className="mt-3 px-4 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
};
