import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Disc, 
  Trophy, 
  Crown, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw,
  Flame,
  Award,
  Printer,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { 
  confirmDrawWinner, 
  formatTicketNumber, 
  getAllReservations, 
  getAllTickets, 
  getRaffleSettings, 
  getRaffleWinners 
} from '../lib/db';
import { soundManager } from '../lib/sound';
import { PrizePosition, RaffleWinner } from '../types/raffle';
import { PasswordModal } from './PasswordModal';

export const RouletteView: React.FC = () => {
  const settings = getRaffleSettings();
  const tickets = getAllTickets();
  const reservations = getAllReservations();
  const existingWinners = getRaffleWinners();

  const [selectedPrize, setSelectedPrize] = useState<PrizePosition>(1);
  const [eligibilityCriteria, setEligibilityCriteria] = useState<'paid_only' | 'all_active'>('paid_only');
  const [preventDuplicate, setPreventDuplicate] = useState<boolean>(settings.prevent_duplicate_winner);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winnerModal, setWinnerModal] = useState<RaffleWinner | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpinPasswordModalOpen, setIsSpinPasswordModalOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Determine eligible tickets
  const eligibleTickets = useMemo(() => {
    const resMap = new Map(reservations.map((r) => [r.ticket_number, r]));
    const alreadyWonNumbers = new Set(existingWinners.map((w) => w.ticket_number));

    return tickets.filter((t) => {
      const res = resMap.get(t.number);
      if (!res || res.status === 'cancelled') return false;

      // Filter by criteria
      if (eligibilityCriteria === 'paid_only' && res.status !== 'paid') return false;

      // Filter duplicate winners
      if (preventDuplicate && alreadyWonNumbers.has(t.number)) return false;

      return true;
    });
  }, [tickets, reservations, eligibilityCriteria, preventDuplicate, existingWinners]);

  const soundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  // Draw the basketball roulette canvas
  const drawRouletteWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;

    ctx.clearRect(0, 0, size, size);

    // Outer Glowing Basketball Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FF6418';
    ctx.shadowColor = '#FF6418';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();

    // Segments count
    const count = Math.min(36, Math.max(12, eligibleTickets.length || 24));
    const sliceAngle = (2 * Math.PI) / count;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotation);

    for (let i = 0; i < count; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternate Basketball Theme Colors: Deep Charcoal, Burnt Orange, Dark Slate
      if (i % 3 === 0) {
        ctx.fillStyle = '#FF6418'; // Vibrant Orange
      } else if (i % 3 === 1) {
        ctx.fillStyle = '#161F2E'; // Dark Slate
      } else {
        ctx.fillStyle = '#0B1118'; // Deep Black
      }
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#05090D';
      ctx.stroke();

      // Draw segment text / number
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.font = 'bold 12px "Outfit", sans-serif';

      const ticketNum = eligibleTickets.length > 0
        ? eligibleTickets[i % eligibleTickets.length].formatted_number
        : String(i + 1).padStart(3, '0');

      ctx.fillText(`#${ticketNum}`, radius - 20, 4);
      ctx.restore();
    }

    // Basketball Center Hub
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, 2 * Math.PI);
    ctx.fillStyle = '#0B1118';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FF6418';
    ctx.shadowColor = '#FF6418';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Basketball seams on center hub
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Fixed Pointer at the Top (pointing down at 12 o'clock)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 14, 10);
    ctx.lineTo(center + 14, 10);
    ctx.lineTo(center, 34);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FF6418';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF6418';
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    drawRouletteWheel(currentRotationRef.current);
  }, [eligibleTickets]);

  // Triggered when user clicks spin button
  const handleSpinClick = () => {
    if (isSpinning) return;
    if (eligibleTickets.length === 0) {
      setErrorMsg('No hay boletas elegibles disponibles para el sorteo con los filtros actuales.');
      return;
    }
    setErrorMsg(null);
    setIsSpinPasswordModalOpen(true);
  };

  // Executed only after password 'morant2026' is validated
  const executeSpinSequence = async () => {
    setIsSpinning(true);
    soundManager.playBounce();

    // 1. Backend / Cryptographically Secure Selection
    const cryptoArray = new Uint32Array(1);
    window.crypto.getRandomValues(cryptoArray);
    const chosenIndex = cryptoArray[0] % eligibleTickets.length;
    const winningTicket = eligibleTickets[chosenIndex];

    // 2. Physics & Deceleration Animation
    const totalDuration = 7000; // 7 seconds of suspenseful basketball spin
    const startTime = performance.now();
    const startRotation = currentRotationRef.current;
    
    // Rotate 8 full turns + angle offset
    const fullSpins = 8 * 2 * Math.PI;
    const targetRotation = startRotation + fullSpins + (Math.random() * Math.PI * 2);

    let lastClickTime = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / totalDuration);

      // Deceleration curve (easeOutCubic / quartic)
      const easeOut = 1 - Math.pow(1 - progress, 3.5);
      const currentRot = startRotation + (targetRotation - startRotation) * easeOut;
      currentRotationRef.current = currentRot;

      drawRouletteWheel(currentRot);

      // Play click ratchet sounds with deceleration pitch
      const clickInterval = 40 + progress * 240;
      if (currentTime - lastClickTime > clickInterval && progress < 0.98) {
        soundManager.playClick(Math.max(0.6, 1.2 - progress * 0.6));
        lastClickTime = currentTime;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished!
        setIsSpinning(false);
        handleWinnerSelected(winningTicket.number);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleWinnerSelected = async (winningNumber: number) => {
    soundManager.playVictoryFanfare();

    // Trigger high-energy confetti
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#FF6418', '#F59E0B', '#10B981', '#FFFFFF']
    });

    // Save draw & winner to database
    const res = await confirmDrawWinner({
      prizePosition: selectedPrize,
      winningTicketNumber: winningNumber,
      selectionMethod: 'ruleta_animada_oficial',
      eligibleTicketNumbers: eligibleTickets.map((t) => t.number),
      confirmedBy: 'Comité Oficial RIFA COURT'
    });

    if (res.success && res.winner) {
      setWinnerModal(res.winner);
    }
  };

  const currentPrizeTitle =
    selectedPrize === 1
      ? settings.prize_1_title
      : selectedPrize === 2
      ? settings.prize_2_title
      : settings.prize_3_title;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-[#FF6418]">
            <Disc className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              RULETA DE LA SUERTE — SORTEO OFICIAL
            </h2>
            <p className="text-xs text-slate-400">
              Mecanismo aleatorio verificable para seleccionar los ganadores de los 3 premios
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={soundToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            soundEnabled
              ? 'bg-orange-950/40 border-orange-500/40 text-orange-400'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>Efectos Sonoros {soundEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Roulette & Setup Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Setup & Prize Selection (4 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0B1118] border border-slate-800 p-5 space-y-5 shadow-xl">
          {/* Prize Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Seleccionar Premio a Sortear
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedPrize(1)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedPrize === 1
                    ? 'bg-gradient-to-r from-orange-950/70 to-slate-900 border-orange-500 text-white shadow-[0_0_15px_rgba(255,100,24,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">1ER LUGAR</span>
                    <span className="text-[11px] text-orange-400 font-semibold">{settings.prize_1_title}</span>
                  </div>
                </div>
                <Crown className="w-4 h-4 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedPrize(2)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedPrize === 2
                    ? 'bg-gradient-to-r from-orange-950/70 to-slate-900 border-orange-500 text-white shadow-[0_0_15px_rgba(255,100,24,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">2DO LUGAR</span>
                    <span className="text-[11px] text-slate-300 font-semibold">{settings.prize_2_title}</span>
                  </div>
                </div>
                <Trophy className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedPrize(3)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedPrize === 3
                    ? 'bg-gradient-to-r from-orange-950/70 to-slate-900 border-orange-500 text-white shadow-[0_0_15px_rgba(255,100,24,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">3ER LUGAR</span>
                    <span className="text-[11px] text-slate-300 font-semibold">{settings.prize_3_title}</span>
                  </div>
                </div>
                <Award className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
            <span className="block font-bold text-slate-300 uppercase tracking-wider">
              Criterio de Participación
            </span>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="eligibility"
                checked={eligibilityCriteria === 'paid_only'}
                onChange={() => setEligibilityCriteria('paid_only')}
                className="mt-0.5 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="font-bold text-emerald-400 block">
                  Solo boletas 100% pagadas (Recomendado)
                </span>
                <span className="text-[11px] text-slate-400">
                  Condición reglamentaria para canasta oficial.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="eligibility"
                checked={eligibilityCriteria === 'all_active'}
                onChange={() => setEligibilityCriteria('all_active')}
                className="mt-0.5 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="font-bold text-slate-300 block">
                  Todas las reservas activas (con o sin pago)
                </span>
                <span className="text-[11px] text-slate-500">
                  Solo si está explícitamente autorizado.
                </span>
              </div>
            </label>

            {/* Checkbox prevent duplicate winner */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={preventDuplicate}
                  onChange={(e) => setPreventDuplicate(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="font-semibold text-[11px]">
                  Evitar que un mismo ticket gane más de un premio
                </span>
              </label>
            </div>
          </div>

          {/* Status Metrics Box */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Boletas Elegibles:</span>
              <span className="font-bold text-white text-sm">{eligibleTickets.length} números</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Premio Seleccionado:</span>
              <span className="font-bold text-orange-400 text-sm">Lugar #{selectedPrize}</span>
            </div>
          </div>
        </div>

        {/* Right: The Animated Basketball Roulette Wheel (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-gradient-to-b from-[#0F1724] to-[#0A0E17] border border-slate-800 p-6 flex flex-col items-center justify-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Canvas Wheel */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="max-w-full drop-shadow-[0_0_30px_rgba(255,100,24,0.25)]"
            />
          </div>

          {/* Large Basketball Spin Button */}
          <button
            type="button"
            onClick={handleSpinClick}
            disabled={isSpinning || eligibleTickets.length === 0}
            className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-[#FF6418] to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-['Outfit'] font-black text-xl tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(255,100,24,0.45)] hover:shadow-[0_0_35px_rgba(255,100,24,0.65)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
          >
            <Lock className="w-6 h-6 text-slate-950" />
            <span>{isSpinning ? 'GIRANDO RULETA...' : 'GIRAR RULETA OFICIAL'}</span>
          </button>
        </div>
      </div>

      {/* Confirmed Winners Podium */}
      {existingWinners.length > 0 && (
        <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="font-['Outfit'] font-black text-lg text-white uppercase tracking-wider">
              PODIO DE GANADORES CONFIRMADOS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((pos) => {
              const winner = existingWinners.find((w) => w.prize_position === pos);
              const prizeTitle =
                pos === 1
                  ? settings.prize_1_title
                  : pos === 2
                  ? settings.prize_2_title
                  : settings.prize_3_title;

              return (
                <div
                  key={pos}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    winner
                      ? 'bg-gradient-to-b from-[#161F2E] to-[#0E1520] border-orange-500/70 shadow-[0_0_15px_rgba(255,100,24,0.2)]'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Outfit'] font-black text-xs uppercase tracking-wider text-orange-400">
                      {pos === 1 ? '1ER LUGAR' : pos === 2 ? '2DO LUGAR' : '3ER LUGAR'}
                    </span>
                    {winner && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        CONFIRMADO
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-white">{prizeTitle}</h4>

                  {winner ? (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">Boleta Ganadora:</span>
                        <span className="font-['Outfit'] font-black text-xl text-orange-400 font-mono">
                          #{formatTicketNumber(winner.ticket_number)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white block">
                        {winner.participant_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Código: {winner.verification_code}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 italic">
                      Pendiente de sorteo
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Winner Celebration Modal */}
      {winnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#182333] via-[#0E1522] to-[#070B10] border-2 border-orange-500 shadow-[0_0_50px_rgba(255,100,24,0.5)] p-6 sm:p-8 text-center text-white space-y-5">
            {/* Crown Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 mx-auto flex items-center justify-center shadow-lg border-2 border-amber-300 animate-bounce">
              <Crown className="w-8 h-8 text-slate-950" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-orange-400 font-['Outfit']">
                ¡TENEMOS GANADOR OFICIAL!
              </span>
              <h3 className="font-['Outfit'] font-black text-2xl sm:text-3xl uppercase tracking-wide mt-1">
                {winnerModal.prize_title}
              </h3>
            </div>

            {/* Huge Winning Ticket Display */}
            <div className="p-4 rounded-2xl bg-black/60 border border-orange-500/50 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">
                BOLETA GANADORA
              </span>
              <div className="font-['Outfit'] font-black text-5xl sm:text-6xl text-[#FF6418] font-mono tracking-wider">
                #{formatTicketNumber(winnerModal.ticket_number)}
              </div>
              <span className="font-['Outfit'] font-bold text-xl text-white block mt-2">
                {winnerModal.participant_name}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div>Código de Verificación: <strong className="text-white">{winnerModal.verification_code}</strong></div>
              <div className="text-[11px] text-slate-500">
                Confirmado el {new Date(winnerModal.confirmed_at).toLocaleString()} por {winnerModal.confirmed_by}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWinnerModal(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cerrar Ventana
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,100,24,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir Acta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal to Authorize Official Roulette Spin */}
      <PasswordModal
        isOpen={isSpinPasswordModalOpen}
        actionTitle="Girar la Ruleta Oficial"
        onClose={() => setIsSpinPasswordModalOpen(false)}
        onSuccess={() => {
          setIsSpinPasswordModalOpen(false);
          executeSpinSequence();
        }}
      />
    </div>
  );
};
