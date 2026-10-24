import jsPDF from 'jspdf';
import { formatTicketNumber } from './db';

export interface TicketPdfItem {
  ticketNumber: number;
  participantName: string;
  notes?: string;
  phone?: string;
  price: number;
  status: string;
  reservationCode: string;
  date: string;
}

export interface PdfOptions {
  layoutDensity?: 'compact_18' | 'ultra_24' | 'standard_12';
}

/**
 * Generates compact printable tickets with high-impact basketball aesthetic ("diseño duro")
 * Fits 18 tickets per A4 page (3 columns x 6 rows) to minimize paper waste.
 */
export function generateTicketsPdf(
  tickets: TicketPdfItem[],
  raffleName = 'RIFA COURT',
  prizesSummary = '1er: Tenis · 2do: Balón Molten · 3er: Medias',
  options: PdfOptions = { layoutDensity: 'compact_18' }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 8;
  const marginY = 9;

  // Compact 18 tickets per page (3 columns x 6 rows)
  let cols = 3;
  let rows = 6;

  if (options.layoutDensity === 'ultra_24') {
    cols = 4;
    rows = 6;
  } else if (options.layoutDensity === 'standard_12') {
    cols = 3;
    rows = 4;
  }

  const ticketsPerPage = cols * rows;
  const spacingX = 3.5;
  const spacingY = 3.5;
  const ticketWidth = (pageWidth - marginX * 2 - (cols - 1) * spacingX) / cols; // ~61 mm
  const ticketHeight = (pageHeight - marginY * 2 - (rows - 1) * spacingY) / rows; // ~43.5 mm

  tickets.forEach((item, index) => {
    const pageIndex = Math.floor(index / ticketsPerPage);
    const itemOnPage = index % ticketsPerPage;

    if (itemOnPage === 0 && index > 0) {
      doc.addPage();
    }

    const col = itemOnPage % cols;
    const row = Math.floor(itemOnPage / cols);

    const x = marginX + col * (ticketWidth + spacingX);
    const y = marginY + row * (ticketHeight + spacingY);

    // 1. Dotted cut guidelines for scissors/guillotine
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.25);
    doc.rect(x, y, ticketWidth, ticketHeight);

    // Reset line dash
    doc.setLineDashPattern([], 0);

    // 2. High-contrast athletic card body
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 0.8, y + 0.8, ticketWidth - 1.6, ticketHeight - 1.6, 'F');

    // Outer solid dark border
    doc.setDrawColor(10, 15, 22);
    doc.setLineWidth(0.45);
    doc.rect(x + 0.8, y + 0.8, ticketWidth - 1.6, ticketHeight - 1.6);

    // 3. Heavy Athletic Black Header
    doc.setFillColor(5, 9, 13); // #05090D Deep Black
    doc.rect(x + 0.8, y + 0.8, ticketWidth - 1.6, 8.5, 'F');

    // Vivid Orange Accent Rim Line
    doc.setFillColor(255, 100, 24); // #FF6418
    doc.rect(x + 0.8, y + 9.3, ticketWidth - 1.6, 1, 'F');

    // Header Title: RIFA COURT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('RIFA COURT', x + 3, y + 6.8);

    // Header Right: Price Tag (RD$ 200)
    doc.setFontSize(7.5);
    doc.setTextColor(255, 140, 60);
    doc.text(`RD$ ${item.price}`, x + ticketWidth - 3, y + 6.8, { align: 'right' });

    // 4. Prominent Number Badge Box
    const badgeW = 18;
    const badgeH = 15;
    const badgeX = x + 2.5;
    const badgeY = y + 12;

    doc.setFillColor(15, 23, 42); // dark navy
    doc.setDrawColor(255, 100, 24); // orange border
    doc.setLineWidth(0.4);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(203, 213, 225);
    doc.text('BOLETA', badgeX + badgeW / 2, badgeY + 4.5, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(255, 100, 24); // Heavy Orange Number
    doc.text(formatTicketNumber(item.ticketNumber), badgeX + badgeW / 2, badgeY + 11.5, { align: 'center' });

    // 5. Participant Data Block
    const infoX = x + 22.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PARTICIPANTE:', infoX, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 9, 13);
    const displayName = item.participantName.length > 20
      ? item.participantName.substring(0, 18) + '..'
      : item.participantName;
    doc.text(displayName, infoX, y + 18.5);

    // Observaciones (if any) or validation text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    const obsText = item.notes?.trim()
      ? `Obs: ${item.notes.substring(0, 22)}`
      : 'Sorteo Oficial 300 Números';
    doc.text(obsText, infoX, y + 23);

    // Status Tag Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    const isPaid = item.status === 'paid' || item.status === 'Pagado';
    if (isPaid) {
      doc.setTextColor(16, 149, 104);
      doc.text('[PAGADO AL 100%]', infoX, y + 26.5);
    } else {
      doc.setTextColor(217, 119, 6);
      doc.text(`[ESTADO: ${item.status.toUpperCase()}]`, infoX, y + 26.5);
    }

    // 6. Prizes Strip Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(x + 2.5, y + 29.5, x + ticketWidth - 2.5, y + 29.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(15, 23, 42);
    doc.text('PREMIOS: 1er Tenis Basket · 2do Balón Molten · 3er Medias', x + 2.5, y + 33.5);

    // 7. Footer validation code & cut line
    doc.setFillColor(248, 250, 252);
    doc.rect(x + 0.8, y + ticketHeight - 7.5, ticketWidth - 1.6, 6.7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(x + 0.8, y + ticketHeight - 7.5, x + ticketWidth - 0.8, y + ticketHeight - 7.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(51, 65, 85);
    doc.text(`CÓD: ${item.reservationCode || `TCK-${formatTicketNumber(item.ticketNumber)}`}`, x + 3, y + ticketHeight - 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(148, 163, 184);
    doc.text('CANASTA OFICIAL', x + ticketWidth - 3, y + ticketHeight - 3, { align: 'right' });

    // Scissor guide mark
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(180, 180, 180);
    doc.text('✂', x + 1.2, y + 2.2);
  });

  return doc;
}

/**
 * Generates an official single ticket voucher certificate with high-impact dark/orange athletic design ("diseño duro")
 */
export function generateSingleReceiptPdf(item: TicketPdfItem, raffleName = 'RIFA COURT'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a6' // 105 mm x 148 mm
  });

  // Dark Athletic Background
  doc.setFillColor(11, 17, 24); // #0B1118
  doc.rect(0, 0, 105, 148, 'F');

  // Orange Outer Framing Border
  doc.setDrawColor(255, 100, 24);
  doc.setLineWidth(1.2);
  doc.roundedRect(4, 4, 97, 140, 2, 2);

  // Inner border
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.roundedRect(6, 6, 93, 136, 1.5, 1.5);

  // Header Banner
  doc.setFillColor(5, 9, 13);
  doc.rect(6, 6, 93, 26, 'F');
  doc.setFillColor(255, 100, 24);
  doc.rect(6, 32, 93, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('RIFA COURT', 52.5, 17, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(255, 140, 60);
  doc.text('COMPROBANTE OFICIAL DE PARTICIPACIÓN DEPORTIVA', 52.5, 24, { align: 'center' });

  // Prominent Ticket Number Box
  doc.setFillColor(18, 26, 36);
  doc.setDrawColor(255, 100, 24);
  doc.setLineWidth(0.8);
  doc.roundedRect(16, 38, 73, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('NÚMERO OFICIAL ASIGNADO', 52.5, 45, { align: 'center' });

  doc.setFontSize(28);
  doc.setTextColor(255, 100, 24);
  doc.text(`#${formatTicketNumber(item.ticketNumber)}`, 52.5, 58, { align: 'center' });

  // Details Card
  doc.setFillColor(15, 23, 34);
  doc.roundedRect(12, 68, 81, 44, 1.5, 1.5, 'F');
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, 68, 81, 44, 1.5, 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('PARTICIPANTE:', 16, 75);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(item.participantName, 16, 81);

  if (item.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Observaciones: ${item.notes}`, 16, 88);
  }

  doc.setDrawColor(30, 41, 59);
  doc.line(16, 92, 89, 92);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Precio de Boleta:', 16, 98);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`RD$ ${item.price}`, 89, 98, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Estado de Pago:', 16, 105);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(item.status === 'paid' ? 52 : 251, item.status === 'paid' ? 211 : 191, item.status === 'paid' ? 153 : 36);
  doc.text(item.status.toUpperCase(), 89, 105, { align: 'right' });

  // Prizes reference
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 140, 60);
  doc.text('PREMIOS EN JUEGO:', 16, 118);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('1er: Tenis Basket · 2do: Balón Molten · 3er: Medias', 16, 123);

  // Validation Code Footer
  doc.setFillColor(5, 9, 13);
  doc.rect(6, 128, 93, 14, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`VALIDACIÓN: ${item.reservationCode}`, 10, 136);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(item.date, 95, 136, { align: 'right' });

  return doc;
}
