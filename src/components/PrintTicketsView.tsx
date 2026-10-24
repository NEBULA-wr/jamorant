import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Eye, 
  Scissors, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  getAllReservations, 
  getAllTickets, 
  formatTicketNumber, 
  getRaffleSettings 
} from '../lib/db';
import { generateTicketsPdf, TicketPdfItem } from '../lib/pdfGenerator';

export const PrintTicketsView: React.FC = () => {
  const settings = getRaffleSettings();
  const tickets = getAllTickets();
  const reservations = getAllReservations();

  const [filterType, setFilterType] = useState<'paid_only' | 'all_assigned' | 'partial_only' | 'range'>('paid_only');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(300);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Map tickets to printable items
  const eligibleItems = useMemo(() => {
    const resMap = new Map(reservations.map((r) => [r.ticket_number, r]));

    const items: TicketPdfItem[] = [];

    tickets.forEach((t) => {
      const res = resMap.get(t.number);
      if (!res || res.status === 'cancelled') return; // Do not print unassigned or cancelled

      // Apply Filter
      if (filterType === 'paid_only' && res.status !== 'paid') return;
      if (filterType === 'partial_only' && res.status !== 'partial') return;
      if (filterType === 'range') {
        if (t.number < rangeStart || t.number > rangeEnd) return;
      }

      const pName = res.participant
        ? `${res.participant.first_name} ${res.participant.last_name}`
        : 'Participante';

      items.push({
        ticketNumber: t.number,
        participantName: pName,
        notes: res.notes,
        phone: res.participant?.phone || '',
        price: res.total_price || settings.ticket_price,
        status: res.status === 'paid' ? 'Pagado' : res.status,
        reservationCode: `RES-${formatTicketNumber(t.number)}-${res.id.slice(-4).toUpperCase()}`,
        date: new Date(res.reserved_at).toLocaleDateString()
      });
    });

    return items.sort((a, b) => a.ticketNumber - b.ticketNumber);
  }, [tickets, reservations, filterType, rangeStart, rangeEnd, settings.ticket_price]);

  // Page calculations (18 tickets per A4 page - 3 cols x 6 rows)
  const ticketsPerPage = 18;
  const estimatedPages = Math.ceil(eligibleItems.length / ticketsPerPage) || 0;

  const handleDownloadPdf = () => {
    if (eligibleItems.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = generateTicketsPdf(
        eligibleItems,
        settings.name,
        '1er: Tenis Basket · 2do: Balón Molten · 3er: Medias',
        { layoutDensity: 'compact_18' }
      );
      doc.save(`tickets_compactos_canasta_${filterType}_${eligibleItems.length}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error al generar el documento PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintDirect = () => {
    if (eligibleItems.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = generateTicketsPdf(
        eligibleItems,
        settings.name,
        '1er: Tenis Basket · 2do: Balón Molten · 3er: Medias',
        { layoutDensity: 'compact_18' }
      );
      const blobUrl = doc.output('bloburl');
      const printWindow = window.open(blobUrl as unknown as string, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } catch (e) {
      console.error(e);
      alert('Error al preparar impresión.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-[#FF6418]">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              GENERADOR DE TICKETS IMPRIMIBLES EN PDF
            </h2>
            <p className="text-xs text-slate-400">
              Formato estándar A4 listo para recortar y colocar en la canasta oficial del sorteo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating || eligibleItems.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,100,24,0.35)] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generando...' : 'Descargar PDF (A4)'}</span>
          </button>
          <button
            onClick={handlePrintDirect}
            disabled={isGenerating || eligibleItems.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filter and Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-[#0B1118] border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-400" />
            <h3 className="font-['Outfit'] font-black text-sm text-white uppercase tracking-wider">
              Criterio de Inclusión para la Canasta
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterType === 'paid_only'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="printFilter"
                checked={filterType === 'paid_only'}
                onChange={() => setFilterType('paid_only')}
                className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-white block text-sm">
                  Solo boletas pagadas al 100%
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                  (Recomendado oficialmente para el sorteo)
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Garantiza que solo tickets totalmente liquidados ingresen a la canasta.
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterType === 'all_assigned'
                ? 'bg-orange-950/40 border-orange-500/60 shadow-[0_0_12px_rgba(255,100,24,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="printFilter"
                checked={filterType === 'all_assigned'}
                onChange={() => setFilterType('all_assigned')}
                className="mt-0.5 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="font-bold text-white block text-sm">
                  Todas las boletas asignadas
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Incluye boletas pagadas, reservas pendientes y abonos parciales.
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterType === 'range'
                ? 'bg-slate-800 border-slate-600 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="printFilter"
                checked={filterType === 'range'}
                onChange={() => setFilterType('range')}
                className="mt-0.5 text-orange-500 focus:ring-orange-500"
              />
              <div className="flex-1">
                <span className="font-bold text-white block text-sm">
                  Rango específico de números
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Number(e.target.value))}
                    disabled={filterType !== 'range'}
                    className="w-16 px-2 py-1 bg-black border border-slate-700 rounded text-center font-mono font-bold text-white text-xs disabled:opacity-40"
                  />
                  <span className="text-slate-400">al</span>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Number(e.target.value))}
                    disabled={filterType !== 'range'}
                    className="w-16 px-2 py-1 bg-black border border-slate-700 rounded text-center font-mono font-bold text-white text-xs disabled:opacity-40"
                  />
                </div>
              </div>
            </label>
          </div>

          {filterType !== 'paid_only' && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Aviso de Auditoría:</strong> Has seleccionado incluir reservas no pagadas. Recuerda verificar las reglas públicas antes de colocarlas en la canasta oficial.
              </span>
            </div>
          )}
        </div>

        {/* Estimated Print Stats Card */}
        <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-['Outfit'] font-black text-sm text-white uppercase tracking-wider mb-3">
              Resumen de Impresión A4
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-sans">Tickets a imprimir:</span>
                <span className="font-bold text-white text-sm">{eligibleItems.length} boletas</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-sans">Hojas de papel A4:</span>
                <span className="font-bold text-orange-400 text-sm">{estimatedPages} hojas (18 por página - Formato Compacto)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-sans">Precio indicado:</span>
                <span className="font-bold text-emerald-400">RD$ {settings.ticket_price}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Scissors className="w-3.5 h-3.5 text-orange-400" />
              <span>Líneas de corte visibles</span>
            </div>
            <p>
              El documento contiene guías perimetrales punteadas para tijeras o guillotina rápida.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Ticket Preview Grid */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-orange-400" />
            <h3 className="font-['Outfit'] font-black text-base text-white uppercase tracking-wider">
              Vista Previa de Boletas Recortables ({eligibleItems.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {estimatedPages} páginas A4
          </span>
        </div>

        {eligibleItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No hay boletas que coincidan con el filtro seleccionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {eligibleItems.slice(0, 6).map((item) => (
              <div
                key={item.ticketNumber}
                className="relative rounded-xl bg-white text-slate-950 p-3.5 border-2 border-dashed border-slate-400 shadow-md font-sans overflow-hidden"
              >
                {/* Cut Scissors corner badge */}
                <div className="absolute top-1 left-2 flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                  <Scissors className="w-2.5 h-2.5" />
                  <span>recortar</span>
                </div>

                {/* Top strip */}
                <div className="bg-[#0F172A] text-white rounded-lg p-2.5 flex items-center justify-between mb-3 mt-3">
                  <span className="font-['Outfit'] font-black text-sm tracking-wider">
                    RIFA <span className="text-[#FF6418]">COURT</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400">
                    RD$ {item.price}
                  </span>
                </div>

                {/* Ticket Details */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-300 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Boleta</span>
                    <span className="font-['Outfit'] font-black text-xl text-[#FF6418] font-mono leading-none">
                      {formatTicketNumber(item.ticketNumber)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Participante</span>
                    <span className="font-bold text-sm text-slate-900 block truncate">
                      {item.participantName}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {item.phone}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 block mt-0.5">
                      [{item.status.toUpperCase()}]
                    </span>
                  </div>
                </div>

                {/* Footer validation code */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>{item.reservationCode}</span>
                  <span className="italic">Válido para la canasta</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {eligibleItems.length > 6 && (
          <p className="text-center text-xs text-slate-500 pt-2 font-mono">
            ... y {eligibleItems.length - 6} boletas adicionales incluidas en el documento PDF completo.
          </p>
        )}
      </div>
    </div>
  );
};
