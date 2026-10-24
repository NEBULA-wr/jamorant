import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Save, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  FileCode,
  ShieldAlert,
  Image as ImageIcon,
  Loader2,
  Lock
} from 'lucide-react';
import { 
  clearDatabase, 
  getAllAuditLogs, 
  getRaffleSettings, 
  pullRemoteDataFromSupabase,
  updateRaffleSettings 
} from '../lib/db';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabase';
import { RaffleSettings } from '../types/raffle';
import { compressImageFile } from '../lib/imageUtils';
import { PasswordModal } from './PasswordModal';

export const SettingsView: React.FC = () => {
  const currentSettings = getRaffleSettings();
  const auditLogs = getAllAuditLogs();

  const [settings, setSettings] = useState<RaffleSettings>(currentSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [resetSuccessModal, setResetSuccessModal] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isProcessingImg, setIsProcessingImg] = useState<number | null>(null);

  // Supabase connection state
  const storedConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(storedConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(storedConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleImageFileChange = async (prizeNum: 1 | 2 | 3, file: File | undefined) => {
    if (!file) return;
    try {
      setIsProcessingImg(prizeNum);
      const compressed = await compressImageFile(file, 900, 900, 0.82);
      if (prizeNum === 1) {
        setSettings(prev => ({ ...prev, prize_1_img: compressed }));
      } else if (prizeNum === 2) {
        setSettings(prev => ({ ...prev, prize_2_img: compressed }));
      } else if (prizeNum === 3) {
        setSettings(prev => ({ ...prev, prize_3_img: compressed }));
      }
    } catch (err) {
      console.error('Error procesando imagen:', err);
    } finally {
      setIsProcessingImg(null);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateRaffleSettings(settings);
    setSaveSuccess(true);
    setSaveModalOpen(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor complete tanto la URL como la Anon Key de Supabase.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setTestResult(res);
    setIsTesting(false);

    if (res.success) {
      saveStoredSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      await pullRemoteDataFromSupabase();
    }
  };

  const handleSaveSupabaseConfig = async () => {
    saveStoredSupabaseConfig(supabaseUrl, supabaseKey);
    setSaveSuccess(true);
    await pullRemoteDataFromSupabase();
  };

  const handleCopySql = () => {
    const sql = `-- ====================================================================
-- RIFA COURT — ESQUEMA COMPLETO Y CORREGIDO DE BASE DE DATOS (SUPABASE)
-- Sistema Profesional de Rifas Deportivas (300 Números)
-- Compatible al 100% con Frontend Web / Netlify / Dispositivos Móviles
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS raffle_settings (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'court_raffle_2026',
    name VARCHAR(255) NOT NULL DEFAULT 'RIFA COURT — Gran Sorteo Deportivo',
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 200.00 CHECK (ticket_price > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'DOP',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT 'RD$',
    total_tickets INTEGER NOT NULL DEFAULT 300 CHECK (total_tickets = 300),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'drawn')),
    closing_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
    prize_1_title VARCHAR(255) NOT NULL DEFAULT '1ER LUGAR • TENIS DE BASKET',
    prize_1_desc TEXT NOT NULL DEFAULT 'Tenis deportivos profesionales de baloncesto edición especial tigre negro y naranja.',
    prize_1_img TEXT NOT NULL DEFAULT '/images/tenis.png',
    prize_2_title VARCHAR(255) NOT NULL DEFAULT '2DO LUGAR • BALÓN OFICIAL',
    prize_2_desc TEXT NOT NULL DEFAULT 'Balón oficial Molten BG4500 FIBA Approved de 12 paneles.',
    prize_2_img TEXT NOT NULL DEFAULT '/images/balon.png',
    prize_3_title VARCHAR(255) NOT NULL DEFAULT '3ER LUGAR • PAQUETE DE MEDIAS',
    prize_3_desc TEXT NOT NULL DEFAULT 'Paquete de medias deportivas de baloncesto en blanco y negro.',
    prize_3_img TEXT NOT NULL DEFAULT '/images/medias.png',
    rules TEXT NOT NULL DEFAULT '1. Solo participarán en la canasta los tickets 100% pagados.\\n2. Cada ticket solo puede ganar un premio.',
    reservation_timeout_hours INTEGER NOT NULL DEFAULT 48 CHECK (reservation_timeout_hours >= 1),
    prevent_duplicate_winner BOOLEAN NOT NULL DEFAULT TRUE,
    contact_phone VARCHAR(50) DEFAULT '+1 (829) 555-2478',
    contact_email VARCHAR(100) DEFAULT 'contacto@rifacourt.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(100) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(first_name, last_name);

CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(100) PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE CHECK (number >= 1 AND number <= 300),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'partial', 'paid', 'blocked')),
    reservation_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(100) PRIMARY KEY,
    ticket_id VARCHAR(100) NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    ticket_number INTEGER NOT NULL CHECK (ticket_number >= 1 AND ticket_number <= 300),
    participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'partial', 'paid', 'cancelled', 'blocked')),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_by VARCHAR(100) NOT NULL DEFAULT 'Administrador',
    cancelled_at TIMESTAMPTZ DEFAULT NULL,
    cancellation_reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reservations_ticket_id ON reservations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_reservations_participant_id ON reservations(participant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(100) PRIMARY KEY,
    reservation_id VARCHAR(100) NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    ticket_number INTEGER DEFAULT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'deposit', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'reversed')),
    reference VARCHAR(100) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by VARCHAR(100) NOT NULL DEFAULT 'Administrador',
    reversal_reason TEXT DEFAULT NULL,
    reversed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS raffle_draws (
    id VARCHAR(100) PRIMARY KEY,
    prize_position INTEGER NOT NULL CHECK (prize_position IN (1, 2, 3)),
    eligible_ticket_ids INTEGER[] NOT NULL,
    winning_ticket_id INTEGER NOT NULL CHECK (winning_ticket_id >= 1 AND winning_ticket_id <= 300),
    selection_method VARCHAR(50) NOT NULL DEFAULT 'ruleta_animada_criptografica',
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    drawn_by VARCHAR(100) NOT NULL DEFAULT 'Administrador Oficial',
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    verification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS raffle_winners (
    id VARCHAR(100) PRIMARY KEY,
    ticket_id VARCHAR(100) NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    ticket_number INTEGER NOT NULL CHECK (ticket_number >= 1 AND ticket_number <= 300),
    prize_position INTEGER NOT NULL UNIQUE CHECK (prize_position IN (1, 2, 3)),
    prize_title VARCHAR(255) NOT NULL,
    draw_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    selection_method VARCHAR(50) NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_by VARCHAR(100) NOT NULL,
    verification_code VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generar 300 boletas limpias
DO $$
BEGIN
    FOR i IN 1..300 LOOP
        INSERT INTO tickets (id, number, status, created_at, updated_at)
        VALUES ('ticket_' || i, i, 'available', NOW(), NOW())
        ON CONFLICT (number) DO NOTHING;
    END LOOP;
END $$;

INSERT INTO raffle_settings (id, name, ticket_price, closing_date)
VALUES ('court_raffle_2026', 'RIFA COURT — Gran Sorteo Deportivo', 200.00, CURRENT_DATE + INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS abiertas para anon y authenticated
ALTER TABLE raffle_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all raffle_settings" ON raffle_settings;
CREATE POLICY "Allow all raffle_settings" ON raffle_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all tickets" ON tickets;
CREATE POLICY "Allow all tickets" ON tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all participants" ON participants;
CREATE POLICY "Allow all participants" ON participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all reservations" ON reservations;
CREATE POLICY "Allow all reservations" ON reservations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all payments" ON payments;
CREATE POLICY "Allow all payments" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all draws" ON raffle_draws;
CREATE POLICY "Allow all draws" ON raffle_draws FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all winners" ON raffle_winners;
CREATE POLICY "Allow all winners" ON raffle_winners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all audit_logs" ON audit_logs;
CREATE POLICY "Allow all audit_logs" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION delete_ticket_individual(
    p_ticket_number INTEGER,
    p_user VARCHAR DEFAULT 'Administrador'
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_res_id VARCHAR;
    v_ticket_id VARCHAR;
BEGIN
    SELECT id, reservation_id INTO v_ticket_id, v_res_id FROM tickets WHERE number = p_ticket_number FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'El ticket no existe.');
    END IF;
    UPDATE tickets SET status = 'available', reservation_id = NULL, updated_at = NOW() WHERE number = p_ticket_number;
    DELETE FROM raffle_winners WHERE ticket_number = p_ticket_number;
    IF v_res_id IS NOT NULL THEN
        DELETE FROM payments WHERE reservation_id = v_res_id;
        DELETE FROM reservations WHERE id = v_res_id;
    ELSE
        DELETE FROM payments WHERE reservation_id IN (SELECT id FROM reservations WHERE ticket_number = p_ticket_number);
        DELETE FROM reservations WHERE ticket_number = p_ticket_number;
    END IF;
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
    VALUES ('audit_' || EXTRACT(EPOCH FROM NOW())::TEXT, p_user, 'DELETE_TICKET_INDIVIDUAL', 'ticket', p_ticket_number::text, 'Ticket #' || LPAD(p_ticket_number::text, 3, '0') || ' eliminado individualmente y restaurado a DISPONIBLE.');
    RETURN jsonb_build_object('success', true, 'message', 'Ticket #' || LPAD(p_ticket_number::text, 3, '0') || ' eliminado y liberado exitosamente.');
END;
$$;

CREATE OR REPLACE FUNCTION reset_raffle_court()
RETURNS JSONB LANGUAGE plpgsql AS $$
BEGIN
    UPDATE tickets SET status = 'available', reservation_id = NULL, updated_at = NOW();
    DELETE FROM payments;
    DELETE FROM raffle_winners;
    DELETE FROM raffle_draws;
    DELETE FROM reservations;
    DELETE FROM participants;
    DELETE FROM audit_logs;
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
    VALUES ('audit_reset_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'admin', 'RESET_RAFFLE', 'system', 'all', 'Reinicio total de la rifa: todos los 300 tickets restablecidos.');
    RETURN jsonb_build_object('success', true, 'message', 'Rifa reiniciada exitosamente.');
END;
$$;
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-[#FF6418]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-black text-xl text-white tracking-wide uppercase">
              CONFIGURACIÓN DEL SISTEMA
            </h2>
            <p className="text-xs text-slate-400">
              Ajustes de la rifa, precios, premios, integración con Supabase y auditoría
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Configuración guardada correctamente</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form: General Settings */}
        <form onSubmit={handleSaveSettings} className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
          <h3 className="font-['Outfit'] font-black text-sm text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            Parámetros Principales de la Rifa
          </h3>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nombre de la Rifa</label>
            <input
              type="text"
              required
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white font-medium focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Precio por Boleta ({settings.currency_symbol})
              </label>
              <input
                type="number"
                min={1}
                required
                value={settings.ticket_price}
                onChange={(e) => setSettings({ ...settings, ticket_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:border-orange-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Predeterminado: RD$ 200 (Total potencial RD$ {settings.ticket_price * 300})
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Fecha de Cierre del Sorteo</label>
              <input
                type="date"
                required
                value={settings.closing_date}
                onChange={(e) => setSettings({ ...settings, closing_date: e.target.value })}
                className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white font-mono focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Estado de la Rifa</label>
              <select
                value={settings.status}
                onChange={(e) => setSettings({ ...settings, status: e.target.value as 'active' | 'closed' | 'drawn' })}
                className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white focus:border-orange-500"
              >
                <option value="active">Activa (Venta abierta)</option>
                <option value="closed">Cerrada (No admite nuevas reservas)</option>
                <option value="drawn">Sorteada (Finalizada)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Caducidad de Reservas Pendientes</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={settings.reservation_timeout_hours}
                  onChange={(e) => setSettings({ ...settings, reservation_timeout_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white font-mono focus:border-orange-500"
                />
                <span className="text-slate-400 font-sans">horas</span>
              </div>
            </div>
          </div>

          {/* Prize Configuration with Computer Upload */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="block font-bold text-slate-300 uppercase tracking-wider">
                Fotos de los Premios (Desde tu Ordenador)
              </span>
              <span className="text-[10px] text-orange-400 font-semibold">
                Sube tus fotos directamente
              </span>
            </div>

            <div className="space-y-3">
              {/* 1er Lugar */}
              <div className="p-2.5 rounded-xl bg-[#121A24] border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">1er Lugar</span>
                  <label className="cursor-pointer px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase flex items-center gap-1 transition-colors">
                    {isProcessingImg === 1 ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    <span>{isProcessingImg === 1 ? 'Optimizando foto...' : 'Seleccionar foto de tu ordenador'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isProcessingImg !== null}
                      onChange={(e) => handleImageFileChange(1, e.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    value={settings.prize_1_title}
                    onChange={(e) => setSettings({ ...settings, prize_1_title: e.target.value })}
                    className="sm:col-span-2 px-2.5 py-1.5 bg-[#0B1118] border border-slate-700 rounded text-white text-xs"
                    placeholder="Título del premio"
                  />
                  {settings.prize_1_img && (
                    <div className="flex items-center gap-2">
                      <img src={settings.prize_1_img} alt="Preview 1" className="w-9 h-9 object-contain bg-black/60 rounded border border-slate-700 shadow-inner" />
                      <span className="text-[10px] text-emerald-400 font-bold">Foto lista</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2do Lugar */}
              <div className="p-2.5 rounded-xl bg-[#121A24] border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">2do Lugar</span>
                  <label className="cursor-pointer px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase flex items-center gap-1 transition-colors">
                    {isProcessingImg === 2 ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    <span>{isProcessingImg === 2 ? 'Optimizando foto...' : 'Seleccionar foto de tu ordenador'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isProcessingImg !== null}
                      onChange={(e) => handleImageFileChange(2, e.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    value={settings.prize_2_title}
                    onChange={(e) => setSettings({ ...settings, prize_2_title: e.target.value })}
                    className="sm:col-span-2 px-2.5 py-1.5 bg-[#0B1118] border border-slate-700 rounded text-white text-xs"
                    placeholder="Título del premio"
                  />
                  {settings.prize_2_img && (
                    <div className="flex items-center gap-2">
                      <img src={settings.prize_2_img} alt="Preview 2" className="w-9 h-9 object-contain bg-black/60 rounded border border-slate-700 shadow-inner" />
                      <span className="text-[10px] text-emerald-400 font-bold">Foto lista</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3er Lugar */}
              <div className="p-2.5 rounded-xl bg-[#121A24] border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">3er Lugar</span>
                  <label className="cursor-pointer px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase flex items-center gap-1 transition-colors">
                    {isProcessingImg === 3 ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    <span>{isProcessingImg === 3 ? 'Optimizando foto...' : 'Seleccionar foto de tu ordenador'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isProcessingImg !== null}
                      onChange={(e) => handleImageFileChange(3, e.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    value={settings.prize_3_title}
                    onChange={(e) => setSettings({ ...settings, prize_3_title: e.target.value })}
                    className="sm:col-span-2 px-2.5 py-1.5 bg-[#0B1118] border border-slate-700 rounded text-white text-xs"
                    placeholder="Título del premio"
                  />
                  {settings.prize_3_img && (
                    <div className="flex items-center gap-2">
                      <img src={settings.prize_3_img} alt="Preview 3" className="w-9 h-9 object-contain bg-black/60 rounded border border-slate-700 shadow-inner" />
                      <span className="text-[10px] text-emerald-400 font-bold">Foto lista</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,100,24,0.4)] flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración General</span>
          </button>
        </form>

        {/* Right Column: Supabase Connection & Data Management */}
        <div className="space-y-6">
          {/* Supabase Connection Box */}
          <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-['Outfit'] font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Conexión Backend con Supabase
              </h3>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px]">
              La aplicación opera con base de datos local reactiva y soporta conexión directa a cualquier proyecto de <strong>Supabase PostgreSQL</strong> para sincronización en la nube.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Supabase Anon Key (Pública)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121A24] border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:border-orange-500"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTesting}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                >
                  {isTesting ? 'Probando...' : 'Probar Conexión'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Guardar Supabase
                </button>
              </div>

              {/* Ayuda Netlify multi-dispositivo */}
              <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-500/40 text-[11px] text-orange-200 space-y-1.5 mt-2">
                <span className="font-bold flex items-center gap-1.5 text-orange-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sincronización multi-dispositivo en Netlify:
                </span>
                <p className="text-slate-300">
                  Para que las reservas se sincronicen automáticamente entre todos los celulares y computadoras:
                </p>
                <div className="bg-black/50 p-2 rounded border border-slate-800 font-mono text-[10px] space-y-1 text-slate-300">
                  <div>1. En Netlify ve a: <span className="text-orange-400">Site configuration &rarr; Environment variables</span></div>
                  <div>2. Agrega: <span className="text-emerald-400 font-bold">VITE_SUPABASE_URL</span> con tu Project URL</div>
                  <div>3. Agrega: <span className="text-emerald-400 font-bold">VITE_SUPABASE_ANON_KEY</span> con tu Anon Key</div>
                  <div>4. En <span className="text-orange-400">Deploys</span> haz clic en <span className="text-white font-bold">Trigger deploy &rarr; Deploy site</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Reset / Maintenance */}
          <div className="rounded-2xl bg-[#0B1118] border border-rose-900/40 p-5 space-y-3 shadow-xl text-xs">
            <h3 className="font-['Outfit'] font-black text-sm text-white uppercase tracking-wider pb-2 border-b border-rose-900/30 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Reinicio Total de la Rifa (300 Números Disponibles)
            </h3>

            <p className="text-slate-400 text-[11px]">
              Esta acción borra de manera definitiva todos los participantes registrados, pagos, abonos y reservas. Los 300 tickets pasarán a estar 100% disponibles sin datos residuales.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsResetPasswordOpen(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(244,63,94,0.3)] hover:scale-[1.01]"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Borrar Todos los Datos y Resetear a Cero (Requiere Contraseña)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#0B1118] border border-slate-800 p-5 space-y-3 shadow-xl">
        <h3 className="font-['Outfit'] font-black text-sm text-white uppercase tracking-wider pb-2 border-b border-slate-800">
          Registro de Auditoría de Operaciones Administrativas ({auditLogs.length})
        </h3>

        <div className="max-h-60 overflow-y-auto font-mono text-xs divide-y divide-slate-800/70">
          {auditLogs.slice(0, 15).map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-orange-400">[{log.action}]</span>{' '}
                <span className="text-slate-300 font-sans">{log.details}</span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Password Modal to Authorize Database Wipe */}
      <PasswordModal
        isOpen={isResetPasswordOpen}
        actionTitle="Borrar Todos los Datos y Reiniciar Rifa"
        onClose={() => setIsResetPasswordOpen(false)}
        onSuccess={async () => {
          setIsResetPasswordOpen(false);
          await clearDatabase();
          setSettings(getRaffleSettings());
          setResetSuccessModal(true);
        }}
      />

      {/* Save Success High-Visibility Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[#0F1724] border border-emerald-500/80 p-6 text-center space-y-4 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-black text-lg text-white uppercase tracking-wide">
                ¡CONFIGURACIÓN Y FOTOS GUARDADAS!
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Los cambios en los títulos y las fotos de los premios se han optimizado y guardado con éxito. Permanecerán guardadas en el sistema.
              </p>
            </div>
            <button
              onClick={() => setSaveModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Reset Complete High-Visibility Modal */}
      {resetSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[#0F1724] border border-orange-500/80 p-6 text-center space-y-4 shadow-[0_0_50px_rgba(255,100,24,0.4)]">
            <div className="w-14 h-14 rounded-2xl bg-orange-950/80 border border-orange-500/50 flex items-center justify-center mx-auto text-orange-400">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-black text-lg text-white uppercase tracking-wide">
                ¡RIFA REINICIADA EXITOSAMENTE!
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Se han eliminado todos los participantes, pagos y reservas. Los <strong>300 números (del 001 al 300)</strong> se han generado limpios y 100% disponibles.
              </p>
            </div>
            <button
              onClick={() => setResetSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Listo, Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
