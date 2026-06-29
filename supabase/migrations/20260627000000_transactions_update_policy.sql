-- Tambah UPDATE policy pada tabel transactions.
-- Sebelumnya tidak ada policy UPDATE sehingga semua UPDATE diblok oleh RLS
-- secara silent (rowsAffected = 0, tanpa error) — menyebabkan tx_hash
-- dan blockchain_status tidak pernah tersimpan setelah Edge Function berhasil.
CREATE POLICY "tx_update_own" ON public.transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
