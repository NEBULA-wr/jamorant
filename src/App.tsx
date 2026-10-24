import React, { useState, useEffect } from 'react';
import { 
  Header, 
  ActiveTab 
} from './components/Header';
import { HeroPrizes } from './components/HeroPrizes';
import { StatsBar } from './components/StatsBar';
import { TicketGrid } from './components/TicketGrid';
import { ReservationModal } from './components/ReservationModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { ParticipantsView } from './components/ParticipantsView';
import { PaymentsView } from './components/PaymentsView';
import { ReportsView } from './components/ReportsView';
import { PrintTicketsView } from './components/PrintTicketsView';
import { RouletteView } from './components/RouletteView';
import { SettingsView } from './components/SettingsView';
import { 
  PasswordModal, 
  isUserAuthorized, 
  setAuthorized 
} from './components/PasswordModal';
import { 
  getAllTickets, 
  getFinancialStats, 
  getRaffleSettings, 
  pullRemoteDataFromSupabase,
  setupSupabaseRealtime,
  subscribeToDatabase 
} from './lib/db';
import { getSupabaseClient } from './lib/supabase';
import { Ticket } from './types/raffle';
import { 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  Phone, 
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('raffle');
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // default admin enabled for easy testing
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);

  // Authentication state (morant2026)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => isUserAuthorized());
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{ title: string; execute: () => void } | null>(null);

  // Database state
  const [settings, setSettings] = useState(getRaffleSettings());
  const [tickets, setTickets] = useState(getAllTickets());
  const [stats, setStats] = useState(getFinancialStats());

  // Ticket selection modals
  const [selectedAvailableTicket, setSelectedAvailableTicket] = useState<Ticket | null>(null);
  const [selectedOccupiedNumber, setSelectedOccupiedNumber] = useState<number | null>(null);

  // Search & Filter state on home tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Success toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Subscribe to reactive database changes & sync with Supabase
  useEffect(() => {
    const unsubscribe = subscribeToDatabase(() => {
      setSettings(getRaffleSettings());
      setTickets(getAllTickets());
      setStats(getFinancialStats());
    });

    // Pull real-time data from Supabase
    pullRemoteDataFromSupabase().then((connected) => {
      setIsSupabaseLive(connected);
    });

    // Listen to real-time events across multiple devices
    const cleanupRealtime = setupSupabaseRealtime();

    return () => {
      unsubscribe();
      if (cleanupRealtime) cleanupRealtime();
    };
  }, []);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  /**
   * Action gate: prompts for password 'morant2026' if not authorized yet
   */
  const executeWithAuth = (actionTitle: string, actionFn: () => void) => {
    if (isAuthorized) {
      actionFn();
    } else {
      setPendingAction({ title: actionTitle, execute: actionFn });
      setPasswordModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthorized(true);
    setPasswordModalOpen(false);
    if (pendingAction) {
      pendingAction.execute();
      setPendingAction(null);
    }
  };

  const handleToggleLock = () => {
    if (isAuthorized) {
      setAuthorized(false);
      setIsAuthorized(false);
      showNotification('Sesión bloqueada. Se requerirá la contraseña para continuar.');
    } else {
      executeWithAuth('Desbloquear Sistema', () => {
        showNotification('Sistema desbloqueado correctamente.');
      });
    }
  };

  const handleNavigate = (tab: ActiveTab) => {
    if (tab === 'raffle') {
      setActiveTab(tab);
      return;
    }
    const tabNames: Record<ActiveTab, string> = {
      raffle: 'Inicio',
      participants: 'Participantes',
      payments: 'Control de Pagos',
      reports: 'Reportes y Finanzas',
      print: 'Impresión de Boletas',
      roulette: 'Sorteo / Ruleta',
      settings: 'Configuración'
    };
    executeWithAuth(`ir a la sección de ${tabNames[tab]}`, () => {
      setActiveTab(tab);
    });
  };

  const handleTicketClick = (ticket: Ticket) => {
    if (ticket.status === 'available') {
      executeWithAuth(`reservar la boleta #${ticket.formatted_number}`, () => {
        setSelectedAvailableTicket(ticket);
      });
    } else {
      executeWithAuth(`ver detalles de la boleta #${ticket.formatted_number}`, () => {
        setSelectedOccupiedNumber(ticket.number);
      });
    }
  };

  const handleExportCsvHome = () => {
    const headers = ['Numero', 'Formateado', 'Estado'];
    const rows = tickets.map((t) => [t.number, `"${t.formatted_number}"`, t.status]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boletas_rifa_court.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#05090D] text-slate-100 flex flex-col font-sans selection:bg-[#FF6418] selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0F1724] border border-orange-500/80 text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Header
        settings={settings}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        isSupabaseLive={isSupabaseLive}
        isAuthorized={isAuthorized}
        onToggleLock={handleToggleLock}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* TAB 1: RAFFLE (HOME VIEW) */}
        {activeTab === 'raffle' && (
          <div className="space-y-6">
            {/* Top Grid: Hero Prizes + Side Management Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Hero Banner with the 3 Sport Prizes (8 cols) */}
              <div className="lg:col-span-8">
                <HeroPrizes settings={settings} />
              </div>

              {/* Quick Management Sidebar widget matching reference (4 cols) */}
              <div className="lg:col-span-4 rounded-2xl bg-[#0B1118] border border-slate-800 p-5 flex flex-col justify-between shadow-xl space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-orange-400 font-bold text-xs uppercase tracking-wider">
                    <Flame className="w-4 h-4" />
                    <span>GESTIÓN DE RIFA</span>
                  </div>

                  {/* Search box */}
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar número o participante..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative mb-4">
                    <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="available">Solo disponibles</option>
                      <option value="occupied">Solo comprados / reservados</option>
                      <option value="paid">Solo pagados 100%</option>
                      <option value="reserved">Solo pendientes de pago</option>
                      <option value="partial">Solo abonos parciales</option>
                    </select>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setStatusFilter('occupied')}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>Ver comprados ({stats.occupiedTickets})</span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('available')}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>Ver disponibles ({stats.availableTickets})</span>
                    </button>

                    <button
                      onClick={handleExportCsvHome}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar CSV</span>
                    </button>
                  </div>
                </div>

                {/* Resumen de pagos widget */}
                <div className="p-3.5 rounded-xl bg-[#121A24] border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Resumen de Pagos
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Recaudado:</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        RD$ {stats.totalConfirmedRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Pendiente:</span>
                      <span className="font-bold text-amber-400 text-sm">
                        RD$ {stats.totalPendingBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Bar */}
            <StatsBar stats={stats} />

            {/* 300 Tickets Grid */}
            <TicketGrid
              tickets={tickets}
              onSelectTicket={handleTicketClick}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>
        )}

        {/* TAB 2: PARTICIPANTES */}
        {activeTab === 'participants' && (
          <ParticipantsView
            isAdmin={isAdmin}
            onSelectTicketNumber={(num) => executeWithAuth(`ver detalle del ticket #${num}`, () => setSelectedOccupiedNumber(num))}
          />
        )}

        {/* TAB 3: PAGOS Y ABONOS */}
        {activeTab === 'payments' && (
          <PaymentsView
            isAdmin={isAdmin}
            onSelectTicketNumber={(num) => executeWithAuth(`ver detalle del ticket #${num}`, () => setSelectedOccupiedNumber(num))}
          />
        )}

        {/* TAB 4: REPORTES */}
        {activeTab === 'reports' && (
          <ReportsView isAdmin={isAdmin} />
        )}

        {/* TAB 5: IMPRIMIR TICKETS */}
        {activeTab === 'print' && (
          <PrintTicketsView />
        )}

        {/* TAB 6: RULETA ANIMADA */}
        {activeTab === 'roulette' && (
          <RouletteView />
        )}

        {/* TAB 7: CONFIGURACIÓN */}
        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B1118]/80 py-6 px-4 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF6418]" />
            <span className="font-bold text-slate-400">RIFA COURT</span>
            <span>·</span>
            <span>300 oportunidades, un solo gran campeón.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Cierre: {settings.closing_date}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              {settings.contact_phone}
            </span>
          </div>
        </div>
      </footer>

      {/* Reservation Modal for Available Tickets */}
      {selectedAvailableTicket && (
        <ReservationModal
          ticket={selectedAvailableTicket}
          settings={settings}
          isAdmin={isAdmin}
          onClose={() => setSelectedAvailableTicket(null)}
          onSuccess={() => {
            showNotification(`¡Boleta #${selectedAvailableTicket.formatted_number} reservada exitosamente!`);
            setSelectedAvailableTicket(null);
          }}
        />
      )}

      {/* Ticket Detail Modal for Occupied Numbers */}
      {selectedOccupiedNumber !== null && (
        <TicketDetailModal
          ticketNumber={selectedOccupiedNumber}
          settings={settings}
          isAdmin={isAdmin}
          onClose={() => setSelectedOccupiedNumber(null)}
          onUpdate={() => {
            setTickets(getAllTickets());
            setStats(getFinancialStats());
          }}
        />
      )}

      {/* Password Authorization Modal (morant2026) */}
      <PasswordModal
        isOpen={passwordModalOpen}
        actionTitle={pendingAction?.title || 'Acceso al Sistema'}
        onSuccess={handleAuthSuccess}
        onClose={() => {
          setPasswordModalOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
