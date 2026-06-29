/**
 * blockchain.ts
 * ─────────────────────────────────────────────────────────────
 * Layer blockchain KantinChain — Solana Devnet.
 *
 * recordEarnTransaction() dan recordRedeemTransaction()
 * memanggil Supabase Edge Function "record-transaction"
 * yang mengirim transaksi Solana asli ke Devnet.
 * ─────────────────────────────────────────────────────────────
 */

import { Connection, clusterApiUrl } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";

/* ── Config ──────────────────────────────────────────────── */

const NETWORK = "devnet" as const;
const EXPLORER_BASE = "https://explorer.solana.com";

/* ── Types ───────────────────────────────────────────────── */

export type BlockchainResult = {
  success: boolean;
  txHash: string;
  status: "confirmed" | "pending" | "failed";
  explorerUrl: string;
};

export type EarnParams = {
  userId: string;
  tenantId: string;
  jumlah: number;
};

export type RedeemParams = {
  userId: string;
  jumlah: number;
};

/* ── Connection ──────────────────────────────────────────── */

/**
 * Mengembalikan koneksi ke Solana Devnet.
 * Dibuat fresh setiap panggilan — cukup untuk kebutuhan
 * MVP karena frekuensi transaksi masih rendah.
 */
export function getConnection(): Connection {
  return new Connection(clusterApiUrl(NETWORK), "confirmed");
}

/* ── Explorer ────────────────────────────────────────────── */

/**
 * Menghasilkan URL Solana Explorer untuk sebuah signature/hash.
 *
 * @example
 * getExplorerUrl("5Hks7...A92")
 * // → "https://explorer.solana.com/tx/5Hks7...A92?cluster=devnet"
 */
export function getExplorerUrl(signature: string): string {
  return `${EXPLORER_BASE}/tx/${encodeURIComponent(signature)}?cluster=${NETWORK}`;
}

/* ── Dummy hash ──────────────────────────────────────────── */

/**
 * @deprecated Tidak lagi dipakai — Edge Function menghasilkan
 * signature Solana asli. Dibiarkan untuk backward compat sementara.
 */
export function generateDummyHash(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const rand = Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `SOL_DEV_${rand}`;
}

/* ── Invoke Edge Function helper ─────────────────────────── */

/**
 * Memanggil Supabase Edge Function "record-transaction"
 * dan menormalisasi response menjadi BlockchainResult.
 */
async function invokeRecordTransaction(
  payload: Record<string, unknown>,
): Promise<BlockchainResult> {
  const { data, error } = await supabase.functions.invoke("record-transaction", {
    body: payload,
  });

  // Error level transport (network/CORS/auth)
  if (error) {
    throw new Error(`Edge Function invoke error: ${error.message ?? JSON.stringify(error)}`);
  }

  // Edge Function mengembalikan { success: false, error: "..." }
  if (!data?.success) {
    throw new Error(`Edge Function failed: ${data?.error ?? "Unknown error"}`);
  }

  // Edge Function response shape: { success, signature, explorer }
  const signature: string = data.signature;
  if (!signature) {
    throw new Error("Edge Function tidak mengembalikan signature");
  }

  const explorerUrl: string = data.explorer ?? getExplorerUrl(signature);

  return {
    success: true,
    txHash: signature,       // signature Solana asli
    status: "confirmed",     // Edge Function hanya return saat sudah confirmed
    explorerUrl,
  };
}

/* ── Record Earn ─────────────────────────────────────────── */

/**
 * Mencatat transaksi earn stamp ke Solana Devnet
 * melalui Supabase Edge Function "record-transaction".
 */
export async function recordEarnTransaction(
  params: EarnParams
): Promise<BlockchainResult> {
  return invokeRecordTransaction({
    type: "earn",
    userId: params.userId,
    tenantId: params.tenantId,
    jumlah: params.jumlah,
  });
}

/* ── Record Redeem ───────────────────────────────────────── */

/**
 * Mencatat transaksi redeem reward ke Solana Devnet
 * melalui Supabase Edge Function "record-transaction".
 */
export async function recordRedeemTransaction(
  params: RedeemParams
): Promise<BlockchainResult> {
  return invokeRecordTransaction({
    type: "redeem",
    userId: params.userId,
    tenantId: null,
    jumlah: params.jumlah,
  });
}
