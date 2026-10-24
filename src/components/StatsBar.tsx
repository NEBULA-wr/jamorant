import React from 'react';
import { Ticket, DollarSign, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { FinancialStats } from '../types/raffle';

interface StatsBarProps {
  stats: FinancialStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-4 lg:p-5 shadow-lg space-y-4">
      {/* Top Row: Reservation Count & Status Badges */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Occupancy Counter & Progress */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-500/40 flex items-center justify-center text-[#FF6418]">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="font-['Outfit'] font-black text-2xl text-white">
                  {stats.occupiedTickets}
                </span>
                <span className="text-slate-400 font-semibold text-sm">
                  / {stats.totalTickets}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                números reservados ({stats.occupancyPercentage}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="hidden sm:block flex-1 max-w-xs">
            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#FF6418] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,100,24,0.5)]"
                style={{ width: `${Math.min(100, stats.occupancyPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Exact Status Badges matching mockup */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Disponibles (Green) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-semibold">Disponibles</span>
            <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
              {stats.availableTickets}
            </span>
          </div>

          {/* Pendientes (Amber) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-xs font-semibold">Pendientes</span>
            <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
              {stats.reservedPendingTickets}
            </span>
          </div>

          {/* Abonos Parciales (Dark Orange) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-300">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
            <span className="text-xs font-semibold">Abonos</span>
            <span className="font-mono font-bold text-sm text-orange-400 tabular-nums">
              {stats.partialPaymentTickets}
            </span>
          </div>

          {/* Pagados (Slate) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]" />
            <span className="text-xs font-semibold">Pagados</span>
            <span className="font-mono font-bold text-sm text-slate-200 tabular-nums">
              {stats.fullyPaidTickets}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
        {/* Recaudado Efectivo */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#121A24] border border-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Recaudado Confirmado
              </span>
              <span className="font-['Outfit'] font-black text-lg text-emerald-400 font-mono tabular-nums">
                RD$ {stats.totalConfirmedRevenue.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Pendiente de Cobro */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#121A24] border border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pendiente de Cobro
              </span>
              <span className="font-['Outfit'] font-black text-lg text-amber-400 font-mono tabular-nums">
                RD$ {stats.totalPendingBalance.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Meta / Potencial Máximo */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#121A24] border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Meta Bruta (300 Boletas)
              </span>
              <span className="font-['Outfit'] font-black text-lg text-white font-mono tabular-nums">
                RD$ {stats.totalPotentialGross.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
