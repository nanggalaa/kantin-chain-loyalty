import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QrScannerModal } from "@/components/QrScannerModal";
import {
  recordEarnTransaction,
  recordRedeemTransaction,
  getExplorerUrl,
} from "@/lib/blockchain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QrCode,
  Gift,
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  Stamp,
  CupSoda,
  UtensilsCrossed,
  Ticket,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Layers,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

/* ── Types ── */
type Tx = {
  id: string;
  tipe: "earn" | "redeem";
  jumlah: number;
  tanggal: string;
  tx_hash: string | null;
  blockchain_status: string | null;
  tenants: { nama: string } | null;
};

type Reward = {
  threshold: number;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

/* ── Constants ── */
const REWARDS: Reward[] = [
  { threshold: 10, title: "Gratis Minuman", desc: "Pilih minuman favoritmu", Icon: CupSoda },
  { threshold: 20, title: "Diskon Makanan", desc: "Potongan hingga 30%", Icon: UtensilsCrossed },
  { threshold: 30, title: "Voucher Kantin", desc: "Senilai Rp 50.000", Icon: Ticket },
];

const REDEEM_COST = 10;

/* ── Helpers ── */
function shortHash(str: string) {
  return str.slice(0, 8) + "..." + str.slice(-6);
}

/* ── Main Component ── */
function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [stamps, setStamps] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);

  /* ── Load data ── */
  const load = useCallback(async (uid: string) => {
    const [{ data: profile }, { data: stamp }, { data: tx }] = await Promise.all([
      supabase.from("profiles").select("nama, role").eq("id", uid).maybeSingle(),
      supabase.from("stamps").select("jumlah").eq("user_id", uid).maybeSingle(),
      supabase
        .from("transactions")
        .select("id, tipe, jumlah, tanggal, tx_hash, blockchain_status, tenants(nama)")
        .eq("user_id", uid)
        .order("tanggal", { ascending: false })
        .limit(20),
    ]);
    if (profile?.role === "tenant") { navigate({ to: "/tenant" }); return; }
    setNama(profile?.nama ?? "");
    setStamps(stamp?.jumlah ?? 0);
    setTxs((tx as any) ?? []);
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setUserId(data.session.user.id);
      load(data.session.user.id);
    });
  }, [navigate, load]);

  /* ── Earn stamp dari scan QR (tenantId dari QrScannerModal) ── */
  const handleQrResult = useCallback(async (tenantId: string) => {
    if (!userId) return;
    setScannerOpen(false);
    setBusy(true);
    try {
      // 1. Validasi tenant ada
      const { data: tenant, error: tenantErr } = await supabase
        .from("tenants").select("id, nama").eq("id", tenantId).maybeSingle();
      if (tenantErr) throw tenantErr;
      if (!tenant) {
        toast.error("Tenant tidak ditemukan.", { description: "QR tidak terdaftar di KantinChain." });
        return;
      }

      // 2. Rule: 1 stamp per user per hari
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from("transactions").select("id")
        .eq("user_id", userId).eq("tipe", "earn")
        .gte("tanggal", todayStart.toISOString()).limit(1);
      if (existing && existing.length > 0) {
        toast.warning("Sudah mendapat stamp hari ini.", {
          description: "Anda hanya bisa mendapatkan 1 stamp per hari.",
        });
        return;
      }

      // 3. Tambah stamp +1
      const newTotal = stamps + 1;
      const { error: stampErr } = await supabase
        .from("stamps")
        .update({ jumlah: newTotal, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (stampErr) throw stampErr;

      // 4. Insert transaksi (awalnya status pending)
      const { data: newTx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          tipe: "earn",
          jumlah: 1,
          blockchain_status: "pending",
        })
        .select("id")
        .single();
      if (txErr) throw txErr;

      setStamps(newTotal);
      toast.success("Berhasil mendapatkan 1 stamp.", {
        description: `Dari ${tenant.nama}. Terus kumpulkan untuk redeem reward!`,
      });

      // 5. Catat ke blockchain (tidak menghentikan proses jika gagal)
      try {
        const result = await recordEarnTransaction({ userId, tenantId, jumlah: 1 });
        await supabase
          .from("transactions")
          .update({ tx_hash: result.txHash, blockchain_status: result.status })
          .eq("id", newTx.id);
      } catch {
        await supabase
          .from("transactions")
          .update({ blockchain_status: "failed" })
          .eq("id", newTx.id);
      }

      load(userId);
    } catch (err: any) {
      toast.error(err.message ?? "Gagal menambah stamp. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }, [userId, stamps, load]);

  /* ── Redeem reward ── */
  const handleRedeem = async () => {
    if (!userId) return;
    if (stamps < REDEEM_COST) { toast.error(`Butuh ${REDEEM_COST} stamp untuk redeem.`); return; }
    setBusy(true);
    try {
      const newTotal = stamps - REDEEM_COST;
      const { error: e1 } = await supabase
        .from("stamps").update({ jumlah: newTotal, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (e1) throw e1;

      // Insert transaksi dulu (pending)
      const { data: newTx, error: e2 } = await supabase
        .from("transactions")
        .insert({ user_id: userId, tipe: "redeem", jumlah: REDEEM_COST, blockchain_status: "pending" })
        .select("id")
        .single();
      if (e2) throw e2;

      setStamps(newTotal);
      toast.success("🎁 Reward berhasil ditukar!", { description: "Tunjukkan ke kantin favoritmu." });

      // Catat ke blockchain (tidak menghentikan proses jika gagal)
      try {
        const result = await recordRedeemTransaction({ userId, jumlah: REDEEM_COST });
        await supabase
          .from("transactions")
          .update({ tx_hash: result.txHash, blockchain_status: result.status })
          .eq("id", newTx.id);
      } catch {
        await supabase
          .from("transactions")
          .update({ blockchain_status: "failed" })
          .eq("id", newTx.id);
      }

      load(userId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  /* ── Derived state ── */
  const nextReward = REWARDS.find((r) => stamps < r.threshold) ?? REWARDS[REWARDS.length - 1];
  const reached = stamps >= nextReward.threshold;
  const remaining = Math.max(0, nextReward.threshold - stamps);
  const progressPct = Math.min(100, Math.round((stamps / nextReward.threshold) * 100));

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleQrResult} />

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gradient-solana)" }}>
              <Stamp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">Kantin<span className="text-gradient-solana">Chain</span></span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]">
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16">
        {/* Greeting */}
        <section className="pt-7 pb-5">
          <p className="text-sm text-[#64748B]">Halo, <span className="font-semibold text-[#0F172A]">{nama || "Mahasiswa"}</span> 👋</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-[#0F172A]">Selamat datang kembali di KantinChain</h1>
        </section>

        {/* Stamp Card */}
        <section>
          <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: "var(--gradient-solana)", boxShadow: "0 8px 40px -8px rgba(153,69,255,0.45)" }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20"><Stamp className="h-4 w-4 text-white" /></div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/80">Total Stamp</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
                  <span className="text-[11px] font-semibold text-white/90">Solana Network</span>
                </div>
              </div>
              <div className="mb-5 flex items-end gap-3">
                <span className="text-7xl font-black leading-none tracking-tighter">{stamps}</span>
                <div className="mb-1"><span className="text-base font-semibold text-white/70">Stamp</span><p className="text-xs text-white/60">terkumpul</p></div>
              </div>
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Progress menuju reward</span>
                  <span className="font-bold text-white">{stamps} / {nextReward.threshold}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5">
                {reached ? (
                  <><CheckCircle2 className="h-4 w-4 shrink-0 text-[#14F195]" /><p className="text-sm font-semibold text-white">Yeay! Kamu bisa tukar <span className="underline decoration-dotted">{nextReward.title}</span></p></>
                ) : (
                  <><span className="text-base">🎯</span><p className="text-sm text-white"><span className="font-bold">{remaining} stamp lagi</span> <span className="text-white/80">untuk {nextReward.title.toLowerCase()}</span></p></>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Aksi Utama */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => setScannerOpen(true)} disabled={busy}
            className="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl py-5 font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl active:scale-95 disabled:opacity-60"
            style={{ background: "var(--gradient-solana)", boxShadow: "var(--shadow-button)" }}>
            <QrCode className="h-7 w-7 transition-transform group-hover:scale-110" />
            <span className="text-sm font-bold">Scan QR</span>
            <span className="text-[11px] font-normal text-white/80">Dapatkan stamp</span>
          </button>
          <button onClick={handleRedeem} disabled={busy || stamps < REDEEM_COST}
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white py-5 transition-all hover:border-[#9945FF]/30 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ boxShadow: "var(--shadow-card)" }}>
            <Gift className="h-7 w-7 text-[#9945FF] transition-transform group-hover:scale-110" />
            <span className="text-sm font-bold text-[#0F172A]">Tukar Reward</span>
            <span className="text-[11px] text-[#64748B]">{stamps < REDEEM_COST ? `Butuh ${REDEEM_COST - stamps} stamp lagi` : `${REDEEM_COST} stamp`}</span>
          </button>
        </section>

        {/* Reward Tersedia */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Reward Tersedia</h2>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{REWARDS.length} pilihan</span>
          </div>
          <div className="space-y-3">
            {REWARDS.map((r) => {
              const unlocked = stamps >= r.threshold;
              return (
                <div key={r.threshold}
                  className={`flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all ${unlocked ? "border-[#9945FF]/30 shadow-md" : "border-[#E2E8F0]"}`}
                  style={{ boxShadow: unlocked ? "0 4px 20px -4px rgba(153,69,255,0.2)" : "var(--shadow-card)" }}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={unlocked ? { background: "var(--gradient-solana)" } : { background: "#F1F5F9" }}>
                    <r.Icon className={`h-5 w-5 ${unlocked ? "text-white" : "text-[#9945FF]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#0F172A] truncate">{r.title}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{r.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${unlocked ? "bg-[#14F195]/15 text-[#059669]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                      {unlocked ? "Bisa Ditukar" : "Belum Cukup"}
                    </span>
                    <span className="text-[11px] font-semibold text-[#9945FF]">{r.threshold} stamp</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Aktivitas Terbaru */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Aktivitas Terbaru</h2>
            {txs.length > 0 && <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{txs.length} transaksi</span>}
          </div>
          {txs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "var(--gradient-solana-soft)" }}>
                <QrCode className="h-8 w-8 text-[#9945FF]" />
              </div>
              <p className="font-semibold text-[#0F172A]">Belum ada stamp</p>
              <p className="mt-1 text-sm text-[#64748B]">Mulai kumpulkan stamp dengan scan QR di kantin.</p>
              <button onClick={() => setScannerOpen(true)} disabled={busy}
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--gradient-solana)", boxShadow: "var(--shadow-button)" }}>
                <QrCode className="h-4 w-4" /> Scan QR Pertama
              </button>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {txs.map((t) => {
                const isEarn = t.tipe === "earn";
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5 transition-all hover:border-[#9945FF]/20 hover:shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isEarn ? "bg-[#14F195]/10 text-[#059669]" : "bg-[#9945FF]/10 text-[#9945FF]"}`}>
                      {isEarn ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">{isEarn ? "+1 Stamp" : "Tukar Reward"}</p>
                      <p className="truncate text-[11px] text-[#64748B]">
                        {t.tenants?.nama ?? "KantinChain"} · {new Date(t.tanggal).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase ${isEarn ? "bg-[#14F195]/10 text-[#059669]" : "bg-[#9945FF]/10 text-[#9945FF]"}`}>
                      {isEarn ? `+${t.jumlah}` : `-${t.jumlah}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Aktivitas Blockchain */}
        {txs.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Aktivitas Blockchain</h2>
              <div className="flex items-center gap-1.5 rounded-full bg-[#14F195]/10 px-2.5 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
                <span className="text-[10px] font-bold text-[#059669]">Solana</span>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#0F172A]">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana)" }}>
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Tercatat di Solana</p>
                  <p className="text-[10px] text-white/50">Semua aktivitas stamp kamu tercatat secara transparan</p>
                </div>
              </div>
              <ul className="divide-y divide-white/5">
                {txs.slice(0, 5).map((t) => {
                  const isEarn = t.tipe === "earn";
                  const hash = t.tx_hash;
                  const status = t.blockchain_status ?? "pending";
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                      {/* Status icon — warna sesuai status */}
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        status === "confirmed" ? "bg-[#14F195]/15" :
                        status === "failed"    ? "bg-red-500/15" :
                                                 "bg-yellow-400/15"
                      }`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 ${
                          status === "confirmed" ? "text-[#14F195]" :
                          status === "failed"    ? "text-red-400" :
                                                   "text-yellow-400"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${isEarn ? "bg-[#14F195]/15 text-[#14F195]" : "bg-[#9945FF]/20 text-[#9945FF]"}`}>
                            {isEarn ? "Earn Stamp" : "Redeem"}
                          </span>
                          {/* Badge status blockchain */}
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            status === "confirmed" ? "bg-[#14F195]/10 text-[#14F195]" :
                            status === "failed"    ? "bg-red-500/15 text-red-400" :
                                                     "bg-yellow-400/15 text-yellow-400"
                          }`}>
                            {status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 text-white/30" />
                          <span className="font-mono text-[10px] text-white/40 truncate max-w-35">
                            {hash ? shortHash(hash) : "Belum tersedia"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTx(t)}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white/90">
                        Detail <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-white/10 px-5 py-3 text-center">
                <p className="text-[10px] text-white/30">Data loyalty kamu diamankan oleh jaringan Solana Blockchain</p>
              </div>
            </div>
          </section>
        )}

        {/* Modal Detail Transaksi */}
        <Dialog open={!!selectedTx} onOpenChange={(open) => { if (!open) setSelectedTx(null); }}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader><DialogTitle className="text-[#0F172A]">Detail Transaksi</DialogTitle></DialogHeader>
            {selectedTx && (
              <div className="space-y-4">
                {/* Status badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const s = selectedTx.blockchain_status ?? "pending";
                    const cfg =
                      s === "confirmed" ? { dot: "bg-[#14F195]", cls: "bg-[#14F195]/15 text-[#059669]", label: "Confirmed" } :
                      s === "failed"    ? { dot: "bg-red-400",   cls: "bg-red-500/10 text-red-500",    label: "Failed" } :
                                          { dot: "bg-yellow-400", cls: "bg-yellow-100 text-yellow-700", label: "Pending" };
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    );
                  })()}
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${selectedTx.tipe === "earn" ? "bg-[#14F195]/10 text-[#059669]" : "bg-[#9945FF]/10 text-[#9945FF]"}`}>
                    {selectedTx.tipe === "earn" ? "Earn Stamp" : "Redeem"}
                  </span>
                </div>

                {/* Tx Hash */}
                <div className="rounded-2xl bg-[#F8FAFC] p-4">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Tx Hash</p>
                  {selectedTx.tx_hash ? (
                    <div className="flex items-start gap-2">
                      <p className="flex-1 break-all font-mono text-xs text-[#0F172A] leading-relaxed">{selectedTx.tx_hash}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(selectedTx.tx_hash!); toast.success("Tx Hash disalin"); }}
                        className="shrink-0 rounded-lg border border-[#E2E8F0] p-1.5 text-[#64748B] transition-colors hover:bg-white hover:text-[#9945FF]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94A3B8] italic">Belum tersedia</p>
                  )}
                </div>

                {/* Info rows */}
                <div className="space-y-2.5">
                  {[
                    { label: "Tipe", value: selectedTx.tipe === "earn" ? "+1 Stamp" : `-${selectedTx.jumlah} Stamp (Redeem)` },
                    { label: "Kantin", value: selectedTx.tenants?.nama ?? "KantinChain" },
                    { label: "Tanggal", value: new Date(selectedTx.tanggal).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" }) },
                    { label: "Network", value: "Solana Devnet" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4">
                      <span className="text-xs text-[#64748B] shrink-0">{row.label}</span>
                      <span className="text-xs font-semibold text-[#0F172A] text-right">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Tombol Explorer */}
                {selectedTx.tx_hash && (
                  <a
                    href={getExplorerUrl(selectedTx.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] py-2.5 text-xs font-semibold text-[#9945FF] transition-colors hover:bg-[#F8FAFC]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Lihat di Solana Explorer
                  </a>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
