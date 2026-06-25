// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

// Deno global tersedia di runtime Supabase Edge Function.
// Deklarasi ambient di bawah hanya untuk memuaskan TypeScript server lokal.
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

// Solana web3.js via esm.sh — kompatibel dengan Deno / Supabase Edge Runtime
// TypeScript server lokal tidak bisa resolve URL import Deno; ini normal di edge env.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import {
  Connection,
  Keypair,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
// @ts-ignore
} from "https://esm.sh/@solana/web3.js@1.98.4";
/* eslint-enable @typescript-eslint/ban-ts-comment */

/* ── Types ──────────────────────────────────────────────────── */

type TxType = "earn" | "redeem";

interface RequestBody {
  type: TxType;
  userId: string;
  tenantId: string | null;
  jumlah: number;
}

/* ── Helpers ────────────────────────────────────────────────── */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorResponse(message: string, status: number, code?: string): Response {
  return jsonResponse(
    { success: false, status: "failed", error: { message, ...(code ? { code } : {}) } },
    status,
  );
}

/**
 * Parse SOLANA_PRIVATE_KEY dari env.
 * Support dua format:
 *   1. JSON array: [1,2,3,...,64]
 *   2. Comma-separated numbers: "1,2,3,...,64"
 */
function parsePrivateKey(raw: string): Uint8Array {
  const trimmed = raw.trim();

  // Format JSON array
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as number[];
    return Uint8Array.from(parsed);
  }

  // Format comma-separated
  const nums = trimmed.split(",").map((n) => parseInt(n.trim(), 10));
  if (nums.some((n) => isNaN(n))) {
    throw new Error("SOLANA_PRIVATE_KEY tidak valid. Gunakan format JSON array [1,2,...] atau comma-separated.");
  }
  return Uint8Array.from(nums);
}

/* ── Main handler ───────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return errorResponse(
      `Method ${req.method} tidak diizinkan. Gunakan POST.`,
      405,
      "METHOD_NOT_ALLOWED",
    );
  }

  // ── Validasi environment secrets ──
  const SOLANA_PRIVATE_KEY = Deno.env.get("SOLANA_PRIVATE_KEY");
  const SOLANA_RPC_URL = Deno.env.get("SOLANA_RPC_URL");

  if (!SOLANA_PRIVATE_KEY || !SOLANA_RPC_URL) {
    const missing = [
      ...(!SOLANA_PRIVATE_KEY ? ["SOLANA_PRIVATE_KEY"] : []),
      ...(!SOLANA_RPC_URL ? ["SOLANA_RPC_URL"] : []),
    ];
    return errorResponse(
      `Secret tidak ditemukan: ${missing.join(", ")}`,
      500,
      "MISSING_SECRETS",
    );
  }

  // ── Parse request body ──
  let body: Partial<RequestBody>;
  try {
    const text = await req.text();
    if (!text || text.trim() === "") {
      return errorResponse("Request body tidak boleh kosong.", 400, "EMPTY_BODY");
    }
    body = JSON.parse(text);
  } catch {
    return errorResponse("Request body bukan JSON yang valid.", 400, "INVALID_JSON");
  }

  // Validasi: type
  if (!body.type || !["earn", "redeem"].includes(body.type)) {
    return errorResponse(
      `Field 'type' harus "earn" atau "redeem". Diterima: "${body.type ?? "undefined"}"`,
      400,
      "INVALID_TYPE",
    );
  }

  // Validasi: userId
  if (!body.userId || typeof body.userId !== "string" || body.userId.trim() === "") {
    return errorResponse("Field 'userId' harus string yang tidak kosong.", 400, "INVALID_USER_ID");
  }

  // Validasi: jumlah
  if (typeof body.jumlah !== "number" || body.jumlah <= 0 || !Number.isFinite(body.jumlah)) {
    return errorResponse(
      `Field 'jumlah' harus angka > 0. Diterima: ${body.jumlah ?? "undefined"}`,
      400,
      "INVALID_JUMLAH",
    );
  }

  // Validasi: tenantId (opsional)
  if (body.tenantId !== undefined && body.tenantId !== null && typeof body.tenantId !== "string") {
    return errorResponse("Field 'tenantId' harus string atau null.", 400, "INVALID_TENANT_ID");
  }

  const validatedData = {
    type: body.type as TxType,
    userId: body.userId.trim(),
    tenantId: body.tenantId ?? null,
    jumlah: body.jumlah,
  };

  // ── Kirim transaksi ke Solana Devnet ──
  try {
    // 1. Buat koneksi ke RPC
    const connection = new Connection(SOLANA_RPC_URL, "confirmed");

    // 2. Buat keypair dari private key
    const secretKey = parsePrivateKey(SOLANA_PRIVATE_KEY);
    const payer = Keypair.fromSecretKey(secretKey);

    // 3. Buat proof transaction: self-transfer 0 lamports
    //    Ini adalah transaksi valid yang dipakai sebagai bukti on-chain
    //    tanpa memindahkan dana apapun.
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: payer.publicKey,   // self-transfer
        lamports: 0,
      }),
    );

    // 4. Sign dan kirim — tunggu konfirmasi
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      { commitment: "confirmed" },
    );

    const explorerUrl =
      `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

    return jsonResponse({
      success: true,
      status: "confirmed",
      signature,
      explorerUrl,
      data: validatedData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Klasifikasi error umum Solana
    let code = "SOLANA_ERROR";
    if (/insufficient.*funds|not enough/i.test(message)) {
      code = "INSUFFICIENT_FUNDS";
    } else if (/blockhash.*expired|blockhash not found/i.test(message)) {
      code = "BLOCKHASH_EXPIRED";
    } else if (/failed to send|unable to send/i.test(message)) {
      code = "SEND_FAILED";
    } else if (/timeout|timed out/i.test(message)) {
      code = "TIMEOUT";
    }

    return jsonResponse(
      {
        success: false,
        status: "failed",
        error: { message, code },
      },
      200, // HTTP 200 agar caller bisa baca body error dengan mudah
    );
  }
});
