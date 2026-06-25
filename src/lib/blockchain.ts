/**
 * blockchain.ts
 * ─────────────────────────────────────────────────────────────
 * Layer blockchain KantinChain — Solana Devnet.
 *
 * Saat ini semua fungsi record* menggunakan dummy hash.
 * Ketika siap integrasi penuh, cukup ganti implementasi
 * recordEarnTransaction() dan recordRedeemTransaction()
 * tanpa mengubah caller di dashboard maupun tenant.
 * ─────────────────────────────────────────────────────────────
 */

import { Connection, clusterApiUrl } from "@solana/web3.js";

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
 * Generate dummy tx hash sementara selama integrasi penuh belum aktif.
 * Format: SOL_DEV_<32 karakter random>
 *
 * TODO: Hapus fungsi ini setelah recordEarnTransaction /
 *       recordRedeemTransaction menggunakan transaksi Solana asli.
 */
export function generateDummyHash(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const rand = Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `SOL_DEV_${rand}`;
}

/* ── Record Earn ─────────────────────────────────────────── */

/**
 * Mencatat transaksi earn stamp ke blockchain.
 *
 * Status saat ini: DUMMY — mengembalikan hash palsu.
 *
 * TODO: Implementasi asli akan:
 *   1. Buat keypair ephemeral atau gunakan wallet tenant.
 *   2. Build & send transaksi memo ke Solana Devnet.
 *   3. Tunggu konfirmasi lalu kembalikan signature asli.
 *
 * @param params - userId, tenantId, jumlah stamp
 * @returns BlockchainResult dengan txHash dan explorerUrl
 */
export async function recordEarnTransaction(
  params: EarnParams
): Promise<BlockchainResult> {
  // Stub — simulasi async seperti transaksi asli nantinya
  await Promise.resolve();

  const txHash = generateDummyHash();

  return {
    success: true,
    txHash,
    status: "confirmed",
    explorerUrl: getExplorerUrl(txHash),
  };
}

/* ── Record Redeem ───────────────────────────────────────── */

/**
 * Mencatat transaksi redeem reward ke blockchain.
 *
 * Status saat ini: DUMMY — mengembalikan hash palsu.
 *
 * TODO: Implementasi asli sama dengan recordEarnTransaction
 *       namun dengan data memo yang berbeda (tipe: redeem).
 *
 * @param params - userId, jumlah stamp yang diredeem
 * @returns BlockchainResult dengan txHash dan explorerUrl
 */
export async function recordRedeemTransaction(
  params: RedeemParams
): Promise<BlockchainResult> {
  await Promise.resolve();

  const txHash = generateDummyHash();

  return {
    success: true,
    txHash,
    status: "confirmed",
    explorerUrl: getExplorerUrl(txHash),
  };
}
