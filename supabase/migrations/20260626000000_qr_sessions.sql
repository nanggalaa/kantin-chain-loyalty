-- Migration: qr_sessions
-- Menambahkan tabel qr_sessions untuk fitur Dynamic QR
-- dan kolom session_id pada tabel transactions.
--
-- Desain:
--   - UUID pada qr_sessions.id digunakan langsung sebagai Session ID di QR Code.
--   - Status "expired" TIDAK disimpan di DB; dihitung dari CURRENT_TIMESTAMP > expires_at.
--   - Status yang valid: 'active' | 'cancelled'
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabel qr_sessions
CREATE TABLE public.qr_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'active',
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index qr_sessions
CREATE INDEX qr_sessions_tenant_id_idx  ON public.qr_sessions (tenant_id);
CREATE INDEX qr_sessions_expires_at_idx ON public.qr_sessions (expires_at);
CREATE INDEX qr_sessions_status_idx     ON public.qr_sessions (status);

-- 3. RLS qr_sessions
ALTER TABLE public.qr_sessions ENABLE ROW LEVEL SECURITY;

-- Tenant owner: bisa insert dan select session miliknya
CREATE POLICY "qr_sessions_select_owner" ON public.qr_sessions
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "qr_sessions_insert_owner" ON public.qr_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "qr_sessions_update_owner" ON public.qr_sessions
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = auth.uid()
    )
  );

-- Mahasiswa: bisa select session untuk validasi saat scan
CREATE POLICY "qr_sessions_select_scan" ON public.qr_sessions
  FOR SELECT TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────

-- 4. Tambah kolom session_id pada transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS session_id UUID
    REFERENCES public.qr_sessions(id) ON DELETE SET NULL;

-- 5. Index session_id pada transactions
CREATE INDEX IF NOT EXISTS transactions_session_id_idx ON public.transactions (session_id);
