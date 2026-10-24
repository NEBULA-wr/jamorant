import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Ticket as TicketIcon, 
  Download, 
  Edit, 
  ChevronRight,
  UserCheck,
  Eye,
  Filter
} from 'lucide-react';
import { 
  getAllParticipants, 
  getAllReservations, 
  formatTicketNumber, 
  updateParticipant 
} from '../lib/db';
import { Participant, Reservation, STATUS_COLORS, STATUS_LABELS } from '../types/raffle';

interface ParticipantsViewProps {
  onSelectTicketNumber: (num: number) => void;
  isAdmin: boolean;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  onSelectTicketNumber,
  isAdmin
}) => {
  const participants = getAllParticipants();
  const reservations = getAllReservations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit participant state
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Group reservations by participant
  const participantData = useMemo(() => {
    return participants.map((p) => {
      const pReservations = reservations.filter(
        (r) => r.participant_id === p.id && r.status !== 'cancelled'
      );
      const ticketNumbers = pReservations.map((r) => r.ticket_number).sort((a, b) => a - b);
      const totalPrice = pReservations.reduce((sum, r) => sum + r.total_price, 0);
      const totalPaid = pReservations.reduce((sum, r) => sum + r.total_paid, 0);
      const balanceDue = pReservations.reduce((sum, r) => sum + r.balance_due, 0);

      let overallStatus = 'paid';
      if (pReservations.some((r) => r.status === 'reserved')) {
        overallStatus = 'reserved';
      } else if (pReservations.some((r) => r.status === 'partial')) {
        overallStatus = 'partial';
      }

      return {
        participant: p,
        reservations: pReservations,
        ticketNumbers,
        ticketsCount: ticketNumbers.length,
        totalPrice,
        totalPaid,
        balanceDue,
        overallStatus
      };
    });
  }, [participants, reservations]);

  // Filter
  const filteredData = useMemo(() => {
    return participantData.filter((item) => {
      if (statusFilter !== 'all' && item.overallStatus !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const fullName = `${item.participant.first_name} ${item.participant.last_name}`.toLowerCase();
        const phone = item.participant.phone.toLowerCase();
        const hasTicket = item.ticketNumbers.some((num) =>
          formatTicketNumber(num).includes(q) || String(num).includes(q)
        );

        if (!fullName.includes(q) && !phone.includes(q) && !hasTicket) {
          return false;
        }
      }

      return true;
    });
  }, [participantData, statusFilter, searchTerm]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Nombre', 'Apellido', 'Telefono', 'Cantidad Tickets', 'Numeros Tickets', 'Total Precio RD$', 'Total Pagado RD$', 'Saldo Pendiente RD$', 'Estado General'];
    const rows = filteredData.map((d) => [
      `"${d.participant.first_name}"`,
      `"${d.participant.last_name}"`,
      `"${d.participant.phone}"`,
      d.ticketsCount,
      `"${d.ticketNumbers.map(n => formatTicketNumber(n)).join(', ')}"`,
      d.totalPrice,
      d.totalPaid,
      d.balanceDue,
      d.overallStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participantes_rifa_court_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = (p: Participant) => {
    setEditingParticipant(p);
    setEditFirstName(p.first_name);
    setEditLastName(p.last_name);
    setEditPhone(p.phone);
  };

  const handleSaveEdit = async () => {
    if (!editingParticipant) return;
    await updateParticipant(
      editingParticipant.id,
      editFirstName,
      editLastName,
      editPhone,
      isAdmin ? 'Administrador' : 'Usuario'
    );
    setEditingParticipant(null);
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-[#FF6418]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              ADMINISTRACIÓN DE PARTICIPANTES
            </h2>
            <p className="text-xs text-slate-400">
              Total registrados: <span className="font-mono font-bold text-white">{participants.length} personas</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B1118] border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o número de ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos los estados</option>
            <option value="paid">100% Pagados</option>
            <option value="partial">Con abono parcial</option>
            <option value="reserved">Pendientes de pago</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121A24] border-b border-slate-800 text-slate-400 uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Participante</th>
                <th className="py-3 px-4">Teléfono / WhatsApp</th>
                <th className="py-3 px-4">Tickets Asignados</th>
                <th className="py-3 px-4 text-right">Total Contratado</th>
                <th className="py-3 px-4 text-right">Total Abonado</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Estado</th>
                {isAdmin && <th className="py-3 px-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredData.map(({ participant, ticketNumbers, totalPrice, totalPaid, balanceDue, overallStatus }) => {
                const statusStyle = STATUS_COLORS[overallStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.reserved;

                return (
                  <tr key={participant.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white whitespace-nowrap">
                      {participant.first_name} {participant.last_name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {isAdmin ? (
                        participant.phone && participant.phone.trim() ? (
                          <a
                            href={`https://wa.me/${participant.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-emerald-400 hover:underline flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{participant.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 font-sans text-[11px]">—</span>
                        )
                      ) : (
                        <span className="text-slate-500 font-sans">Privado</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {ticketNumbers.map((num) => (
                          <button
                            key={num}
                            onClick={() => onSelectTicketNumber(num)}
                            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-orange-600 border border-slate-700 hover:border-orange-500 text-slate-200 hover:text-white font-bold text-[11px] transition-colors"
                            title={`Ver boleta #${formatTicketNumber(num)}`}
                          >
                            #{formatTicketNumber(num)}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-200 whitespace-nowrap">
                      RD$ {totalPrice.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                      RD$ {totalPaid.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      <span className={balanceDue > 0 ? 'text-amber-400' : 'text-slate-500'}>
                        RD$ {balanceDue.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyle.text} bg-slate-900 border ${statusStyle.border}`}>
                        {STATUS_LABELS[overallStatus as keyof typeof STATUS_LABELS] || overallStatus}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit(participant)}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Editar información del participante"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-500 font-sans">
                    No se encontraron participantes con el criterio de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0F1724] border border-slate-700 p-6 space-y-4">
            <h3 className="font-['Outfit'] font-black text-lg text-white uppercase">
              Editar Datos del Participante
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Apellido</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setEditingParticipant(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-lg bg-[#FF6418] hover:bg-orange-500 text-white text-xs font-bold"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
