-- Tambah kolom blockchain ke tabel transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS blockchain_status TEXT NOT NULL DEFAULT 'pending';
