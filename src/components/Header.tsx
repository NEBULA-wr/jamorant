import React from 'react';
import { 
  Trophy, 
  Ticket, 
  Users, 
  DollarSign, 
  BarChart3, 
  Printer, 
  Disc, 
  Settings, 
  ShieldCheck, 
  ShieldAlert,
  Flame,
  Lock,
  Unlock
} from 'lucide-react';
import { RaffleSettings } from '../types/raffle';

export type ActiveTab = 'raffle' | 'participants' | 'payments' | 'reports' | 'print' | 'roulette' | 'settings';

interface HeaderProps {
  settings: RaffleSettings;
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  isSupabaseLive: boolean;
  isAuthorized: boolean;
  onToggleLock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  onNavigate,
  isAdmin,
  setIsAdmin,
  isSupabaseLive,
  isAuthorized,
  onToggleLock
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#05090D]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onNavigate('raffle')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-[0_0_15px_rgba(255,100,24,0.35)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-[#0B1118] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#FF6418]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Outfit'] font-black text-xl tracking-wider text-white">
                  RIFA <span className="text-[#FF6418]">COURT</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-orange-950/60 text-orange-400 border border-orange-500/30">
                  300 BOLETAS
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => onNavigate('raffle')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'raffle'
                ? 'bg-orange-500/15 text-[#FF6418] border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Rifa</span>
          </button>

          <button
            onClick={() => onNavigate('participants')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'participants'
                ? 'bg-orange-500/15 text-[#FF6418] border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Participantes</span>
          </button>

          <button
            onClick={() => onNavigate('payments')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-orange-500/15 text-[#FF6418] border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pagos y Abonos</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-orange-500/15 text-[#FF6418] border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reportes</span>
          </button>

          <button
            onClick={() => onNavigate('print')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'print'
                ? 'bg-orange-500/15 text-[#FF6418] border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Tickets</span>
          </button>

          <button
            onClick={() => onNavigate('roulette')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'roulette'
                ? 'bg-orange-500/15 text-[#FF6418] border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Disc className="w-4 h-4 text-orange-400 animate-spin-slow" />
            <span>Ruleta</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-orange-500/15 text-[#FF6418] border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </nav>

        {/* Right Action / Admin Mode Switch & Password Protection */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Supabase status indicator */}
          <div 
            onClick={() => onNavigate('settings')}
            className="cursor-pointer hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 transition-colors"
            title={isSupabaseLive ? 'Conectado a Supabase PostgreSQL en vivo' : 'Operando en Modo Local Persistente'}
          >
            <div className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isSupabaseLive ? 'Supabase Live' : 'Modo DB Local'}</span>
          </div>

          {/* Master Password Authorization Indicator */}
          <button
            onClick={onToggleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
              isAuthorized
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-orange-950/60 border-orange-500/50 text-orange-400 animate-pulse'
            }`}
            title={isAuthorized ? 'Acceso desbloqueado con morant2026. Haz clic para bloquear.' : 'Página protegida. Se requiere clave morant2026.'}
          >
            {isAuthorized ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">morant2026</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <span>Bloqueado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation tab scroll bar */}
      <div className="flex lg:hidden items-center gap-2 pt-2.5 overflow-x-auto no-scrollbar border-t border-slate-800/60 mt-2">
        <button
          onClick={() => onNavigate('raffle')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'raffle' ? 'bg-[#FF6418] text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Rifa
        </button>
        <button
          onClick={() => onNavigate('participants')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'participants' ? 'bg-[#FF6418] text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Participantes
        </button>
        <button
          onClick={() => onNavigate('payments')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'payments' ? 'bg-[#FF6418] text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Pagos
        </button>
        <button
          onClick={() => onNavigate('reports')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-[#FF6418] text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Reportes
        </button>
        <button
          onClick={() => onNavigate('print')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'print' ? 'bg-[#FF6418] text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir
        </button>
        <button
          onClick={() => onNavigate('roulette')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'roulette' ? 'bg-[#FF6418] text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          Ruleta
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-[#FF6418] text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Ajustes
        </button>
      </div>
    </header>
  );
};
