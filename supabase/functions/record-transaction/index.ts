// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

// Deno global tersedia di runtime Supabase Edge Function.
// Deklarasi ambient di bawah hanya untuk memuaskan TypeScript server lokal.
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

// Solana web3.js — di-resolve via import map di deno.json menggunakan npm: specifier.
// npm: specifier kompatibel dengan Supabase Edge Runtime (Deno) dan tidak memuat
// dependency Node-only seperti node:zlib, bufferutil, atau utf-8-validate.
// @ts-ignore
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

/* ── Config ─────────────────────────────────────────────────── */

const SOLANA_RPC = "https://api.devnet.solana.com";
const EXPLORER_BASE = "https://explorer.solana.com/tx";

/* ── CORS Headers ───────────────────────────────────────────── */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ── Helpers ────────────────────────────────────────────────── */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/* ── Main handler ───────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("STEP 1: start");

    // 1. Ambil private key dari environment
    const rawKey = Deno.env.get("SOLANA_PRIVATE_KEY");
    if (!rawKey) {
      return jsonResponse({ success: false, error: "SOLANA_PRIVATE_KEY tidak ditemukan." }, 500);
    }
    console.log("STEP 2: private key loaded");

    // 2. Parse JSON array → Uint8Array → Keypair
    const secret = JSON.parse(rawKey) as number[];
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    console.log("STEP 3: keypair created", keypair.publicKey.toBase58());

    // 3. Buat koneksi ke Solana Devnet
    const connection = new Connection(SOLANA_RPC, "confirmed");
    console.log("STEP 4: connection created");

    // 4. Buat transaksi dummy: self-transfer 0 lamports (sender = receiver)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: keypair.publicKey,
        lamports: 0,
      }),
    );

    // 5. Sign, kirim, dan tunggu konfirmasi
    console.log("STEP 5: sending transaction");
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      { commitment: "confirmed" },
    );
    console.log("STEP 6: signature", signature);

    // 6. Return sukses
    return jsonResponse({
      success: true,
      signature,
      explorer: `${EXPLORER_BASE}/${signature}?cluster=devnet`,
    });

  } catch (err: unknown) {
    console.error("TRANSACTION ERROR:", err);
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ success: false, error: message });
  }
});
