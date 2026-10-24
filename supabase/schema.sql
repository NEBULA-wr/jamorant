-- ====================================================================
-- RIFA COURT — ESQUEMA COMPLETO DE BASE DE DATOS POSTGRESQL (SUPABASE)
-- Sistema Profesional de Rifas Deportivas (300 Números)
-- Moneda predeterminada: DOP (RD$), Precio base: RD$ 200
-- ====================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: raffle_settings (Configuración general de la rifa)
CREATE TABLE IF NOT EXISTS raffle_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'court_raffle_2026',
    name VARCHAR(255) NOT NULL DEFAULT 'RIFA COURT — Gran Sorteo Deportivo',
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 200.00 CHECK (ticket_price > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'DOP',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT 'RD$',
    total_tickets INTEGER NOT NULL DEFAULT 300 CHECK (total_tickets = 300),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'drawn')),
    closing_date DATE NOT NULL,
    prize_1_title VARCHAR(255) NOT NULL DEFAULT '1ER LUGAR • TENIS DE BASKET',
    prize_1_desc TEXT NOT NULL DEFAULT 'Tenis deportivos profesionales de baloncesto edición especial tigre negro y naranja.',
    prize_1_img TEXT NOT NULL DEFAULT '/images/tenis.png',
    prize_2_title VARCHAR(255) NOT NULL DEFAULT '2DO LUGAR • BALÓN OFICIAL',
    prize_2_desc TEXT NOT NULL DEFAULT 'Balón oficial Molten BG4500 FIBA Approved de 12 paneles.',
    prize_2_img TEXT NOT NULL DEFAULT '/images/balon.png',
    prize_3_title VARCHAR(255) NOT NULL DEFAULT '3ER LUGAR • PAQUETE DE MEDIAS',
    prize_3_desc TEXT NOT NULL DEFAULT 'Paquete de medias deportivas de baloncesto en blanco y negro.',
    prize_3_img TEXT NOT NULL DEFAULT '/images/medias.png',
    rules TEXT NOT NULL DEFAULT '1. Solo participarán en la canasta los tickets 100% pagados.\n2. Cada ticket solo puede ganar un premio.',
    reservation_timeout_hours INTEGER NOT NULL DEFAULT 48 CHECK (reservation_timeout_hours >= 1),
    prevent_duplicate_winner BOOLEAN NOT NULL DEFAULT TRUE,
    contact_phone VARCHAR(50) DEFAULT '+1 (829) 555-2478',
    contact_email VARCHAR(100) DEFAULT 'contacto@rifacourt.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: participants (Directorio de compradores y participantes)
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL CHECK (char_length(TRIM(first_name)) > 0),
    last_name VARCHAR(100) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(first_name, last_name);

-- 4. TABLA: tickets (Exactamente 300 números únicos del 1 al 300)
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(50) PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE CHECK (number >= 1 AND number <= 300),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'partial', 'paid', 'blocked')),
    reservation_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- 5. TABLA: reservations (Reservas activas e históricas de tickets)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    ticket_number INTEGER NOT NULL CHECK (ticket_number >= 1 AND ticket_number <= 300),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
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

-- Agregar clave foránea circular segura de tickets hacia reservations
ALTER TABLE tickets 
    DROP CONSTRAINT IF EXISTS fk_tickets_reservation,
    ADD CONSTRAINT fk_tickets_reservation 
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;

-- 6. TABLA: payments (Control estricto de abonos y pagos de tickets)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
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

-- 7. TABLA: raffle_draws (Registro y auditoría de la Ruleta y Sorteos)
CREATE TABLE IF NOT EXISTS raffle_draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 8. TABLA: raffle_winners (Ganadores confirmados de los 3 premios)
CREATE TABLE IF NOT EXISTS raffle_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    ticket_number INTEGER NOT NULL CHECK (ticket_number >= 1 AND ticket_number <= 300),
    prize_position INTEGER NOT NULL UNIQUE CHECK (prize_position IN (1, 2, 3)),
    prize_title VARCHAR(255) NOT NULL,
    draw_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    selection_method VARCHAR(50) NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_by VARCHAR(100) NOT NULL,
    verification_code VARCHAR(100) NOT NULL UNIQUE
);

-- 9. TABLA: audit_logs (Trazabilidad de operaciones críticas)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- SCRIPT IDEMPOTENTE PARA GENERAR LOS 300 TICKETS (001 AL 300)
-- ====================================================================
DO $$
BEGIN
    FOR i IN 1..300 LOOP
        INSERT INTO tickets (id, number, status, created_at, updated_at)
        VALUES ('ticket_' || i, i, 'available', NOW(), NOW())
        ON CONFLICT (number) DO NOTHING;
    END LOOP;
END $$;

-- Insertar configuración inicial por defecto si no existe
INSERT INTO raffle_settings (id, name, ticket_price, closing_date)
VALUES ('court_raffle_2026', 'RIFA COURT — Gran Sorteo Deportivo', 200.00, CURRENT_DATE + INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE raffle_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Público: Lectura pública de configuración y disponibilidad general de tickets
CREATE POLICY "Public read raffle_settings" ON raffle_settings FOR SELECT USING (true);
CREATE POLICY "Public read tickets status" ON tickets FOR SELECT USING (true);
CREATE POLICY "Public read winners" ON raffle_winners FOR SELECT USING (true);

-- 2. Administrador: Acceso total autenticado
CREATE POLICY "Admin all raffle_settings" ON raffle_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all tickets" ON tickets FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all participants" ON participants FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all reservations" ON reservations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all draws" ON raffle_draws FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all winners" ON raffle_winners FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all audit_logs" ON audit_logs FOR ALL TO authenticated USING (true);

-- ====================================================================
-- PROCEDIMIENTO ATÓMICO: RESERVAR TICKET CON PREVENCIÓN DE CONCURRENCIA
-- ====================================================================
CREATE OR REPLACE FUNCTION reserve_ticket_atomic(
    p_ticket_number INTEGER,
    p_first_name VARCHAR,
    p_last_name VARCHAR DEFAULT '',
    p_phone VARCHAR DEFAULT '',
    p_initial_status VARCHAR DEFAULT 'paid',
    p_initial_amount NUMERIC DEFAULT 0,
    p_payment_method VARCHAR DEFAULT 'cash',
    p_reference VARCHAR DEFAULT '',
    p_notes TEXT DEFAULT '',
    p_user VARCHAR DEFAULT 'Administrador'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket_id VARCHAR;
    v_current_status VARCHAR;
    v_participant_id UUID;
    v_reservation_id UUID;
    v_ticket_price NUMERIC;
    v_final_status VARCHAR;
    v_amount NUMERIC;
BEGIN
    -- 1. Bloquear y verificar el ticket atómicamente con SELECT FOR UPDATE
    SELECT id, status INTO v_ticket_id, v_current_status
    FROM tickets
    WHERE number = p_ticket_number
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'El ticket no existe.');
    END IF;

    IF v_current_status != 'available' THEN
        RETURN jsonb_build_object('success', false, 'message', 'El ticket #' || LPAD(p_ticket_number::text, 3, '0') || ' ya no está disponible. Fue tomado por otro usuario.');
    END IF;

    -- 2. Obtener precio actual de la configuración
    SELECT ticket_price INTO v_ticket_price FROM raffle_settings WHERE id = 'court_raffle_2026';
    IF v_ticket_price IS NULL THEN
        v_ticket_price := 200.00;
    END IF;

    -- 3. Calcular montos y estado final
    IF p_initial_status = 'paid' THEN
        v_amount := v_ticket_price;
        v_final_status := 'paid';
    ELSIF p_initial_status = 'partial' THEN
        v_amount := COALESCE(p_initial_amount, 0);
        IF v_amount >= v_ticket_price THEN
            v_final_status := 'paid';
            v_amount := v_ticket_price;
        ELSE
            v_final_status := 'partial';
        END IF;
    ELSIF p_initial_status = 'blocked' THEN
        v_amount := 0;
        v_final_status := 'blocked';
    ELSE
        v_amount := 0;
        v_final_status := 'reserved';
    END IF;

    -- 4. Registrar participante (buscar por teléfono si viene, o por nombre)
    IF p_phone IS NOT NULL AND TRIM(p_phone) != '' THEN
        SELECT id INTO v_participant_id FROM participants WHERE phone = p_phone LIMIT 1;
    ELSE
        SELECT id INTO v_participant_id FROM participants 
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(p_first_name)) 
          AND LOWER(TRIM(last_name)) = LOWER(TRIM(COALESCE(p_last_name, ''))) 
        LIMIT 1;
    END IF;

    IF v_participant_id IS NULL THEN
        INSERT INTO participants (first_name, last_name, phone)
        VALUES (p_first_name, COALESCE(p_last_name, ''), COALESCE(p_phone, ''))
        RETURNING id INTO v_participant_id;
    END IF;

    -- 5. Crear la reserva
    INSERT INTO reservations (
        ticket_id, ticket_number, participant_id, total_price, status, notes, created_by
    )
    VALUES (
        v_ticket_id, p_ticket_number, v_participant_id, v_ticket_price, v_final_status, p_notes, p_user
    )
    RETURNING id INTO v_reservation_id;

    -- 6. Actualizar el ticket
    UPDATE tickets 
    SET status = v_final_status, reservation_id = v_reservation_id, updated_at = NOW()
    WHERE id = v_ticket_id;

    -- 7. Registrar pago si aplica
    IF v_amount > 0 THEN
        INSERT INTO payments (
            reservation_id, amount, payment_method, status, reference, notes, recorded_by
        )
        VALUES (
            v_reservation_id, v_amount, COALESCE(p_payment_method, 'cash'), 'confirmed', COALESCE(p_reference, 'DIRECTO'), 'Pago inicial registrado en reserva', p_user
        );
    END IF;

    -- 8. Auditoría
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
        p_user, 'RESERVE_TICKET', 'ticket', p_ticket_number::text,
        'Reserva de ticket #' || LPAD(p_ticket_number::text, 3, '0') || ' por ' || p_first_name || ' ' || COALESCE(p_last_name, '') || '. Monto: ' || v_amount
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Ticket #' || LPAD(p_ticket_number::text, 3, '0') || ' reservado con éxito.',
        'reservation_id', v_reservation_id
    );
END;
$$;

-- ====================================================================
-- PROCEDIMIENTO: REINICIAR LA RIFA COMPLETAMENTE (VACIAR TODOS LOS DATOS)
-- ====================================================================
CREATE OR REPLACE FUNCTION reset_raffle_court()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Desvincular todas las reservas en los 300 tickets y restaurar estado 'available'
    UPDATE tickets 
    SET status = 'available', reservation_id = NULL, updated_at = NOW();

    -- 2. Eliminar todos los registros operativos
    DELETE FROM payments;
    DELETE FROM raffle_winners;
    DELETE FROM raffle_draws;
    DELETE FROM reservations;
    DELETE FROM participants;
    DELETE FROM audit_logs;

    -- 3. Registrar auditoría del reinicio en audit_logs
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES ('admin', 'RESET_RAFFLE', 'system', 'all', 'Reinicio total de la rifa: todos los 300 tickets restablecidos a disponible y datos borrados.');

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Rifa reiniciada exitosamente. Los 300 números están 100% disponibles y todas las compras fueron eliminadas.'
    );
END;
$$;

-- ====================================================================
-- PROCEDIMIENTO: BORRAR / LIBERAR TICKET INDIVIDUALMENTE
-- ====================================================================
CREATE OR REPLACE FUNCTION delete_ticket_individual(
    p_ticket_number INTEGER,
    p_user VARCHAR DEFAULT 'Administrador'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_res_id UUID;
    v_ticket_id VARCHAR;
BEGIN
    -- 1. Bloquear y verificar el ticket
    SELECT id, reservation_id INTO v_ticket_id, v_res_id
    FROM tickets
    WHERE number = p_ticket_number
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'El ticket no existe.');
    END IF;

    -- 2. Desvincular ticket a 'available'
    UPDATE tickets
    SET status = 'available', reservation_id = NULL, updated_at = NOW()
    WHERE number = p_ticket_number;

    -- 3. Eliminar si fue registrado como ganador
    DELETE FROM raffle_winners WHERE ticket_number = p_ticket_number;

    -- 4. Si tenía reserva, eliminar pagos asociados y la reserva
    IF v_res_id IS NOT NULL THEN
        DELETE FROM payments WHERE reservation_id = v_res_id;
        DELETE FROM reservations WHERE id = v_res_id;
    ELSE
        DELETE FROM payments WHERE reservation_id IN (SELECT id FROM reservations WHERE ticket_number = p_ticket_number);
        DELETE FROM reservations WHERE ticket_number = p_ticket_number;
    END IF;

    -- 5. Registrar auditoría
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
        p_user, 
        'DELETE_TICKET_INDIVIDUAL', 
        'ticket', 
        p_ticket_number::text, 
        'Ticket #' || LPAD(p_ticket_number::text, 3, '0') || ' eliminado individualmente y restaurado a DISPONIBLE.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Ticket #' || LPAD(p_ticket_number::text, 3, '0') || ' eliminado y liberado exitosamente a DISPONIBLE.'
    );
END;
$$;

