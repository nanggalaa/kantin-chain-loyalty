import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  QrCode,
  LogOut,
  Store,
  Users,
  Stamp,
  Gift,
  ArrowUpCircle,
  ArrowDownCircle,
  CupSoda,
  UtensilsCrossed,
  Ticket,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Settings,
  ExternalLink,
  Copy,
  TrendingUp,
  Calendar,
  CalendarDays,
  User,
  Clock,
} from "lucide-react";
import { getExplorerUrl } from "@/lib/blockchain";

export const Route = createFileRoute("/tenant")({
  component: TenantDashboard,
});

/* ── Types ── */
type Tx = {
  id: string;
  tipe: "earn" | "redeem";
  jumlah: number;
  tanggal: string;
  user_id: string;
  tx_hash: string | null;
  blockchain_status: string | null;
};

type TenantProfile = {
  id: string;
  nama: string;
  owner_id: string | null;
  created_at: string;
};

/* ── Constants ── */
const REWARDS = [
  { min: 10, label: "Gratis Minuman", icon: CupSoda },
  { min: 20, label: "Diskon Makanan", icon: UtensilsCrossed },
  { min: 30, label: "Voucher Belanja", icon: Ticket },
];

/* ── Helpers ── */
function shortHash(str: string) {
  return str.slice(0, 8) + "..." + str.slice(-6);
}

function startOf(unit: "day" | "week" | "month"): Date {
  const d = new Date();
  if (unit === "day") { d.setHours(0, 0, 0, 0); return d; }
  if (unit === "week") { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
  d.setDate(1); d.setHours(0, 0, 0, 0); return d;
}

/* ── Main Component ── */
function TenantDashboard() {
  const navigate = useNavigate();
  const [ownerNama, setOwnerNama] = useState("");
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);

  /* ── Load data ── */
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate({ to: "/auth" }); return; }
      const uid = s.session.user.id;

      const { data: profile } = await supabase
        .from("profiles").select("nama, role").eq("id", uid).maybeSingle();
      if (profile?.role !== "tenant") { navigate({ to: "/dashboard" }); return; }
      setOwnerNama(profile?.nama ?? "");

      const { data: t } = await supabase
        .from("tenants").select("id, nama, owner_id, created_at").eq("owner_id", uid).maybeSingle();
      if (t) {
        setTenant(t as TenantProfile);
        const { data: tx } = await supabase
          .from("transactions")
          .select("id, tipe, jumlah, tanggal, user_id, tx_hash, blockchain_status")
          .eq("tenant_id", t.id)
          .order("tanggal", { ascending: false })
          .limit(100);
        setTxs((tx as any) ?? []);
      }
    })();
  }, [navigate]);

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  /* ── Derived stats ── */
  const todayStart  = useMemo(() => startOf("day").toISOString(), []);
  const weekStart   = useMemo(() => startOf("week").toISOString(), []);
  const monthStart  = useMemo(() => startOf("month").toISOString(), []);

  // Fase 1 — Ringkasan Hari Ini
  const todayStats = useMemo(() => {
    const t = txs.filter((x) => x.tanggal >= todayStart);
    return {
      totalScan: t.filter((x) => x.tipe === "earn").length,
      totalStamp: t.filter((x) => x.tipe === "earn").reduce((s, x) => s + x.jumlah, 0),
      uniqueCustomers: new Set(t.map((x) => x.user_id)).size,
      totalRedeem: t.filter((x) => x.tipe === "redeem").length,
    };
  }, [txs, todayStart]);

  // Fase 3 — Blockchain Activity summary
  const blockchainSummary = useMemo(() => ({
    confirmed: txs.filter((x) => x.blockchain_status === "confirmed").length,
    pending:   txs.filter((x) => x.blockchain_status === "pending" || !x.blockchain_status).length,
    failed:    txs.filter((x) => x.blockchain_status === "failed").length,
  }), [txs]);

  // Fase 4 — Statistik periode
  const periodStats = useMemo(() => {
    const byPeriod = (from: string) => {
      const t = txs.filter((x) => x.tanggal >= from);
      return {
        scan:     t.filter((x) => x.tipe === "earn").length,
        stamp:    t.filter((x) => x.tipe === "earn").reduce((s, x) => s + x.jumlah, 0),
        redeem:   t.filter((x) => x.tipe === "redeem").length,
        pelanggan: new Set(t.map((x) => x.user_id)).size,
      };
    };
    return {
      hari:   byPeriod(todayStart),
      minggu: byPeriod(weekStart),
      bulan:  byPeriod(monthStart),
    };
  }, [txs, todayStart, weekStart, monthStart]);

  const recentTxs = txs.slice(0, 10);

  /* ── QR Statis ── */
  const qrPayload    = tenant ? JSON.stringify({ tenant_id: tenant.id }) : null;
  const qrUrl        = qrPayload ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}` : null;
  const qrPreviewUrl = qrPayload ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload)}` : null;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gradient-solana)" }}>
              <Store className="h-3.5 w-3.5 text-white" />
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
          <p className="text-sm text-[#64748B]">Halo, <span className="font-semibold text-[#0F172A]">{ownerNama || "Penjual"}</span> 👋</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-[#0F172A]">{tenant?.nama || "Kantin Anda"}</h1>
          <p className="mt-1 text-xs text-[#64748B]">Kelola loyalty pelanggan kantin Anda dengan KantinChain</p>
        </section>

        {/* ── FASE 1: Ringkasan Hari Ini ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Ringkasan Hari Ini</h2>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">
              {new Date().toLocaleDateString("id-ID", { dateStyle: "medium" })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: QrCode,  value: todayStats.totalScan,        label: "Total Scan",            color: "#9945FF", bg: "rgba(153,69,255,0.08)" },
              { icon: Stamp,   value: todayStats.totalStamp,       label: "Total Stamp",           color: "#9945FF", bg: "rgba(153,69,255,0.08)" },
              { icon: Users,   value: todayStats.uniqueCustomers,  label: "Pelanggan Unik",        color: "#14F195", bg: "rgba(20,241,149,0.10)" },
              { icon: Gift,    value: todayStats.totalRedeem,      label: "Total Redeem",          color: "#059669", bg: "rgba(5,150,105,0.08)"  },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#0F172A] leading-none">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Card QR Kantin */}
        <section className="mt-6">
          <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: "var(--gradient-solana)", boxShadow: "0 8px 40px -8px rgba(153,69,255,0.45)" }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-lg">
                {qrPreviewUrl ? <img src={qrPreviewUrl} alt="QR Kantin" className="h-20 w-20" /> : <QrCode className="h-10 w-10 text-[#9945FF] opacity-40" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" /> QR Kantin Saya
                  </span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">{tenant?.nama || "Kantin Anda"}</h2>
                <p className="mt-1 text-xs text-white/75 leading-relaxed">Tampilkan QR ini kepada mahasiswa untuk mendapatkan stamp.</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="mt-3 flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#9945FF] shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-100 disabled:opacity-60" disabled={!tenant}>
                      <QrCode className="h-3.5 w-3.5" /> Tampilkan QR
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-3xl">
                    <DialogHeader><DialogTitle className="text-center text-[#0F172A]">{tenant?.nama}</DialogTitle></DialogHeader>
                    <div className="flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
                      {qrUrl ? <img src={qrUrl} alt="QR Tenant" className="w-full rounded-xl" /> : <p className="text-sm text-[#64748B]">Memuat...</p>}
                    </div>
                    <p className="break-all text-center text-[10px] text-[#94A3B8]">{qrPayload}</p>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </section>

        {/* Aksi Cepat */}
        <section className="mt-4 grid grid-cols-3 gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#9945FF]/30 bg-white py-4 shadow-sm transition-all hover:shadow-md hover:border-[#9945FF]/60 active:scale-95" disabled={!tenant}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
                  <QrCode className="h-4 w-4 text-[#9945FF]" />
                </div>
                <span className="text-xs font-bold text-[#0F172A] leading-tight text-center">QR Kantin</span>
                <span className="text-[10px] text-[#64748B]">Tampilkan QR</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xs rounded-3xl">
              <DialogHeader><DialogTitle className="text-center text-[#0F172A]">{tenant?.nama}</DialogTitle></DialogHeader>
              <div className="flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
                {qrUrl ? <img src={qrUrl} alt="QR Tenant" className="w-full rounded-xl" /> : <p className="text-sm text-[#64748B]">Memuat...</p>}
              </div>
              <p className="break-all text-center text-[10px] text-[#94A3B8]">{qrPayload}</p>
            </DialogContent>
          </Dialog>
          <button className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#E2E8F0] bg-white py-4 shadow-sm transition-all hover:border-[#9945FF]/30 hover:shadow-md active:scale-95" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
              <Settings className="h-4 w-4 text-[#9945FF]" />
            </div>
            <span className="text-xs font-bold text-[#0F172A] leading-tight text-center">Kelola Reward</span>
            <span className="text-[10px] text-[#64748B]">Atur reward</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#E2E8F0] bg-white py-4 shadow-sm transition-all hover:border-[#9945FF]/30 hover:shadow-md active:scale-95" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
              <CheckCircle2 className="h-4 w-4 text-[#9945FF]" />
            </div>
            <span className="text-xs font-bold text-[#0F172A] leading-tight text-center">Verifikasi</span>
            <span className="text-[10px] text-[#64748B]">Cek redeem</span>
          </button>
        </section>

        {/* ── FASE 2: Riwayat Aktivitas Tenant ── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Riwayat Aktivitas</h2>
            {txs.length > 0 && <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{txs.length} transaksi</span>}
          </div>
          {recentTxs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E2E8F0] bg-white px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--gradient-solana-soft)" }}>
                <Store className="h-7 w-7 text-[#9945FF]" />
              </div>
              <p className="font-semibold text-[#0F172A]">Belum ada transaksi</p>
              <p className="mt-1 text-xs text-[#64748B]">Tampilkan QR kepada mahasiswa untuk mulai merekam aktivitas.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {recentTxs.map((t) => {
                const isEarn = t.tipe === "earn";
                const status = t.blockchain_status ?? "pending";
                return (
                  <li key={t.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 transition-all hover:border-[#9945FF]/20 hover:shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isEarn ? "bg-[#14F195]/10 text-[#059669]" : "bg-[#9945FF]/10 text-[#9945FF]"}`}>
                        {isEarn ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#0F172A]">{isEarn ? "+1 Stamp" : "Reward Ditukar"}</p>
                          {/* Blockchain status badge */}
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            status === "confirmed" ? "bg-[#14F195]/10 text-[#059669]" :
                            status === "failed"    ? "bg-red-500/10 text-red-500" :
                                                     "bg-yellow-100 text-yellow-700"
                          }`}>{status}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          Mahasiswa #{t.user_id.slice(0, 6)} ·{" "}
                          {new Date(t.tanggal).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase ${isEarn ? "bg-[#14F195]/10 text-[#059669]" : "bg-[#9945FF]/10 text-[#9945FF]"}`}>
                          {isEarn ? `+${t.jumlah}` : `-${t.jumlah}`}
                        </span>
                        {t.tx_hash && (
                          <a href={getExplorerUrl(t.tx_hash)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 rounded-lg border border-[#E2E8F0] px-2 py-1 text-[10px] font-semibold text-[#9945FF] transition-colors hover:bg-[#F8FAFC]">
                            Explorer <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    {t.tx_hash && (
                      <div className="mt-2 flex items-center gap-1.5 pl-12">
                        <ShieldCheck className="h-3 w-3 text-[#94A3B8]" />
                        <span className="font-mono text-[10px] text-[#94A3B8]">{shortHash(t.tx_hash)}</span>
                        <button onClick={() => { navigator.clipboard.writeText(t.tx_hash!); toast.success("Tx Hash disalin"); }}
                          className="rounded p-0.5 text-[#CBD5E1] hover:text-[#9945FF] transition-colors">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── FASE 3: Blockchain Activity ── */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#64748B]">Blockchain Activity</h2>
          <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#0F172A]">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana)" }}>
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">Solana Devnet</p>
                  <span className="flex items-center gap-1 rounded-full bg-[#14F195]/15 px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#14F195]">Online</span>
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-white/50">{txs.length} total transaksi tercatat</p>
              </div>
            </div>
            {/* Summary confirmed / pending / failed */}
            <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
              {[
                { label: "Confirmed", value: blockchainSummary.confirmed, color: "text-[#14F195]", dot: "bg-[#14F195]" },
                { label: "Pending",   value: blockchainSummary.pending,   color: "text-yellow-400", dot: "bg-yellow-400" },
                { label: "Failed",    value: blockchainSummary.failed,    color: "text-red-400",    dot: "bg-red-400" },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    <span className={`text-[10px] font-bold uppercase ${s.color}`}>{s.label}</span>
                  </div>
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            {/* Recent blockchain entries */}
            {txs.length > 0 && (
              <ul className="divide-y divide-white/5">
                {txs.filter((t) => t.tx_hash).slice(0, 4).map((t) => {
                  const isEarn = t.tipe === "earn";
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#14F195]/15">
                        <CheckCircle2 className="h-3 w-3 text-[#14F195]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isEarn ? "bg-[#14F195]/15 text-[#14F195]" : "bg-[#9945FF]/20 text-[#9945FF]"}`}>
                            {isEarn ? "Earn" : "Redeem"}
                          </span>
                          <span className="text-[10px] text-white/40">#{t.user_id.slice(0, 6)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5 text-white/25" />
                          <span className="font-mono text-[10px] text-white/35">{shortHash(t.tx_hash!)}</span>
                        </div>
                      </div>
                      <a href={getExplorerUrl(t.tx_hash!)} target="_blank" rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white/90">
                        Explorer <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-t border-white/10 px-5 py-3 text-center">
              <p className="text-[10px] text-white/25">Powered by Solana Blockchain · Transparan & Tidak Dapat Dimanipulasi</p>
            </div>
          </div>
        </section>

        {/* ── FASE 4: Statistik Periode ── */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#64748B]">Statistik</h2>
          <div className="space-y-3">
            {[
              { icon: Clock,       label: "Hari Ini",   data: periodStats.hari   },
              { icon: Calendar,    label: "Minggu Ini", data: periodStats.minggu  },
              { icon: CalendarDays,label: "Bulan Ini",  data: periodStats.bulan   },
            ].map((p) => (
              <div key={p.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gradient-solana-soft)" }}>
                    <p.icon className="h-3.5 w-3.5 text-[#9945FF]" />
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">{p.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Scan",      value: p.data.scan      },
                    { label: "Stamp",     value: p.data.stamp     },
                    { label: "Pelanggan", value: p.data.pelanggan },
                    { label: "Redeem",    value: p.data.redeem    },
                  ].map((d) => (
                    <div key={d.label} className="text-center rounded-xl bg-[#F8FAFC] py-2">
                      <p className="text-base font-black text-[#0F172A]">{d.value}</p>
                      <p className="text-[10px] text-[#64748B]">{d.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reward Saya ── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Reward Saya</h2>
            <button className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#9945FF] transition-colors hover:border-[#9945FF]/30 hover:bg-[#F8FAFC]">
              <Settings className="h-3 w-3" /> Kelola Reward
            </button>
          </div>
          <div className="space-y-2.5">
            {REWARDS.map((r) => (
              <div key={r.min} className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#9945FF]/20 hover:shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
                  <r.icon className="h-5 w-5 text-[#9945FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A]">{r.label}</p>
                  <p className="text-[11px] text-[#64748B]">{r.min} stamp</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#9945FF]/10 px-2.5 py-1 text-[10px] font-bold text-[#9945FF]">Aktif</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FASE 5: Profil Tenant ── */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#64748B]">Profil Tenant</h2>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--gradient-solana)" }}>
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#0F172A] text-base">{tenant?.nama || "—"}</p>
                <p className="text-[11px] text-[#64748B]">Kantin terdaftar di KantinChain</p>
              </div>
            </div>
            <div className="space-y-2.5 border-t border-[#F1F5F9] pt-4">
              {[
                { icon: Store, label: "Nama Kantin",     value: tenant?.nama || "—" },
                { icon: User,  label: "Nama Pemilik",    value: ownerNama || "—" },
                { icon: TrendingUp, label: "Total Transaksi", value: `${txs.length} transaksi` },
                {
                  icon: CalendarDays,
                  label: "Bergabung Sejak",
                  value: tenant?.created_at
                    ? new Date(tenant.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })
                    : "—",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <row.icon className="h-3.5 w-3.5 text-[#94A3B8]" />
                    <span className="text-xs text-[#64748B]">{row.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0F172A] text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modal Detail Transaksi */}
        <Dialog open={!!selectedTx} onOpenChange={(open) => { if (!open) setSelectedTx(null); }}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader><DialogTitle className="text-[#0F172A]">Detail Transaksi</DialogTitle></DialogHeader>
            {selectedTx && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${selectedTx.blockchain_status === "confirmed" ? "bg-[#14F195]/15 text-[#059669]" : "bg-yellow-100 text-yellow-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedTx.blockchain_status === "confirmed" ? "bg-[#14F195]" : "bg-yellow-400"}`} />
                    {selectedTx.blockchain_status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${selectedTx.tipe === "earn" ? "bg-[#14F195]/10 text-[#059669]" : "bg-[#9945FF]/10 text-[#9945FF]"}`}>
                    {selectedTx.tipe === "earn" ? "Earn Stamp" : "Redeem"}
                  </span>
                </div>
                <div className="rounded-2xl bg-[#F8FAFC] p-4">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Tx Hash</p>
                  {selectedTx.tx_hash ? (
                    <div className="flex items-start gap-2">
                      <p className="flex-1 break-all font-mono text-xs text-[#0F172A] leading-relaxed">{selectedTx.tx_hash}</p>
                      <button onClick={() => { navigator.clipboard.writeText(selectedTx.tx_hash!); toast.success("Tx Hash disalin"); }}
                        className="shrink-0 rounded-lg border border-[#E2E8F0] p-1.5 text-[#64748B] transition-colors hover:bg-white hover:text-[#9945FF]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94A3B8] italic">Belum tersedia</p>
                  )}
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Tipe",      value: selectedTx.tipe === "earn" ? "+1 Stamp" : `-${selectedTx.jumlah} Stamp (Redeem)` },
                    { label: "Mahasiswa", value: `#${selectedTx.user_id.slice(0, 6)}` },
                    { label: "Tanggal",   value: new Date(selectedTx.tanggal).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" }) },
                    { label: "Network",   value: "Solana Devnet" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4">
                      <span className="text-xs text-[#64748B] shrink-0">{row.label}</span>
                      <span className="text-xs font-semibold text-[#0F172A] text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
                {selectedTx.tx_hash && (
                  <a href={getExplorerUrl(selectedTx.tx_hash)} target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] py-2.5 text-xs font-semibold text-[#9945FF] transition-colors hover:bg-[#F8FAFC]">
                    <ExternalLink className="h-3.5 w-3.5" /> Lihat di Solana Explorer
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
