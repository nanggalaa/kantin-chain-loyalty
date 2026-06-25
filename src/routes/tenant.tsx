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
} from "lucide-react";

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

/* ── Main Component ── */
function TenantDashboard() {
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [tenantNama, setTenantNama] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
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
      setNama(profile?.nama ?? "");
      const { data: tenant } = await supabase
        .from("tenants").select("id, nama").eq("owner_id", uid).maybeSingle();
      if (tenant) {
        setTenantId(tenant.id);
        setTenantNama(tenant.nama);
        const { data: tx } = await supabase
          .from("transactions")
          .select("id, tipe, jumlah, tanggal, user_id, tx_hash, blockchain_status")
          .eq("tenant_id", tenant.id)
          .order("tanggal", { ascending: false })
          .limit(50);
        setTxs((tx as any) ?? []);
      }
    })();
  }, [navigate]);

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  /* ── Stats ── */
  const today = useMemo(() => new Date().toDateString(), []);
  const stats = useMemo(() => {
    const todayTxs = txs.filter((t) => new Date(t.tanggal).toDateString() === today);
    return {
      uniqueCustomers: new Set(todayTxs.map((t) => t.user_id)).size,
      stampsOut: todayTxs.filter((t) => t.tipe === "earn").reduce((s, t) => s + t.jumlah, 0),
      rewardsRedeemed: todayTxs.filter((t) => t.tipe === "redeem").reduce((s, t) => s + t.jumlah, 0),
    };
  }, [txs, today]);

  const recentTxs = txs.slice(0, 8);

  /* QR statis — payload JSON berisi tenant_id */
  const qrPayload = tenantId ? JSON.stringify({ tenant_id: tenantId }) : null;
  const qrUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`
    : null;
  const qrPreviewUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload)}`
    : null;

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
          <p className="text-sm text-[#64748B]">Halo, <span className="font-semibold text-[#0F172A]">{nama || "Penjual"}</span> 👋</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-[#0F172A]">{tenantNama || "Kantin Anda"}</h1>
          <p className="mt-1 text-xs text-[#64748B]">Kelola loyalty pelanggan kantin Anda dengan KantinChain</p>
        </section>

        {/* Card QR Kantin Saya */}
        <section>
          <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: "var(--gradient-solana)", boxShadow: "0 8px 40px -8px rgba(153,69,255,0.45)" }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-5">
              {/* QR Preview */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-lg">
                {qrPreviewUrl ? (
                  <img src={qrPreviewUrl} alt="QR Kantin" className="h-20 w-20" />
                ) : (
                  <QrCode className="h-10 w-10 text-[#9945FF] opacity-40" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" /> QR Kantin Saya
                  </span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">{tenantNama || "Kantin Anda"}</h2>
                <p className="mt-1 text-xs text-white/75 leading-relaxed">
                  Tampilkan QR ini kepada mahasiswa untuk mendapatkan stamp.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="mt-3 flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#9945FF] shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-100 disabled:opacity-60" disabled={!tenantId}>
                      <QrCode className="h-3.5 w-3.5" /> Tampilkan QR
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-center text-[#0F172A]">{tenantNama}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
                      {qrUrl ? (
                        <img src={qrUrl} alt="QR Tenant" className="w-full rounded-xl" />
                      ) : (
                        <p className="text-sm text-[#64748B]">Memuat...</p>
                      )}
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
          {[
            { icon: QrCode, label: "QR Kantin", sub: "Tampilkan QR", isDialog: true },
            { icon: Settings, label: "Kelola Reward", sub: "Atur reward", isDialog: false },
            { icon: CheckCircle2, label: "Verifikasi", sub: "Cek redeem", isDialog: false },
          ].map((action) =>
            action.isDialog ? (
              <Dialog key={action.label}>
                <DialogTrigger asChild>
                  <button className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#9945FF]/30 bg-white py-4 shadow-sm transition-all hover:shadow-md hover:border-[#9945FF]/60 active:scale-95" disabled={!tenantId}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
                      <action.icon className="h-4 w-4 text-[#9945FF]" />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A] leading-tight text-center">{action.label}</span>
                    <span className="text-[10px] text-[#64748B]">{action.sub}</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xs rounded-3xl">
                  <DialogHeader><DialogTitle className="text-center text-[#0F172A]">{tenantNama}</DialogTitle></DialogHeader>
                  <div className="flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
                    {qrUrl ? <img src={qrUrl} alt="QR Tenant" className="w-full rounded-xl" /> : <p className="text-sm text-[#64748B]">Memuat...</p>}
                  </div>
                  <p className="break-all text-center text-[10px] text-[#94A3B8]">{qrPayload}</p>
                </DialogContent>
              </Dialog>
            ) : (
              <button key={action.label} className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#E2E8F0] bg-white py-4 shadow-sm transition-all hover:border-[#9945FF]/30 hover:shadow-md active:scale-95" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
                  <action.icon className="h-4 w-4 text-[#9945FF]" />
                </div>
                <span className="text-xs font-bold text-[#0F172A] leading-tight text-center">{action.label}</span>
                <span className="text-[10px] text-[#64748B]">{action.sub}</span>
              </button>
            )
          )}
        </section>

        {/* Statistik */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Statistik Hari Ini</h2>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">
              {new Date().toLocaleDateString("id-ID", { dateStyle: "medium" })}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, value: stats.uniqueCustomers, label: "Pelanggan\nHari Ini", color: "#9945FF", bg: "rgba(153,69,255,0.08)" },
              { icon: Stamp, value: stats.stampsOut, label: "Stamp\nKeluar", color: "#9945FF", bg: "rgba(153,69,255,0.08)" },
              { icon: Gift, value: stats.rewardsRedeemed, label: "Reward\nDitukar", color: "#14F195", bg: "rgba(20,241,149,0.10)" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: s.bg }}>
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-black text-[#0F172A] leading-none">{s.value}</p>
                <p className="mt-1 whitespace-pre-line text-[10px] text-[#64748B] leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reward Saya */}
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

        {/* Aktivitas Terbaru */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Aktivitas Terbaru</h2>
            {txs.length > 0 && <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{txs.length} total</span>}
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
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5 transition-all hover:border-[#9945FF]/20 hover:shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isEarn ? "bg-[#14F195]/10 text-[#059669]" : "bg-[#9945FF]/10 text-[#9945FF]"}`}>
                      {isEarn ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">{isEarn ? "+1 Stamp" : "Reward Ditukar"}</p>
                      <p className="text-[11px] text-[#64748B]">Mahasiswa #{t.user_id.slice(0, 6)} · {new Date(t.tanggal).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
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

        {/* Status Blockchain */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#64748B]">Status Blockchain</h2>
          <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#0F172A]">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana)" }}>
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">Solana Devnet Aktif</p>
                  <span className="flex items-center gap-1 rounded-full bg-[#14F195]/15 px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#14F195]">Online</span>
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-white/50">{txs.length} transaksi tercatat</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs leading-relaxed text-white/50">Semua aktivitas stamp dan redeem dicatat ke jaringan Solana secara transparan.</p>
            </div>
            {txs.length > 0 && (
              <ul className="divide-y divide-white/5 border-t border-white/10">
                {txs.slice(0, 4).map((t) => {
                  const isEarn = t.tipe === "earn";
                  const hash = t.tx_hash ?? t.id;
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
                          <span className="font-mono text-[10px] text-white/35">{shortHash(hash)}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelectedTx(t)}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white/90">
                        Detail <ExternalLink className="h-2.5 w-2.5" />
                      </button>
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
                  <div className="flex items-start gap-2">
                    <p className="flex-1 break-all font-mono text-xs text-[#0F172A] leading-relaxed">{selectedTx.tx_hash ?? "-"}</p>
                    {selectedTx.tx_hash && (
                      <button onClick={() => { navigator.clipboard.writeText(selectedTx.tx_hash!); toast.success("Tx Hash disalin"); }}
                        className="shrink-0 rounded-lg border border-[#E2E8F0] p-1.5 text-[#64748B] transition-colors hover:bg-white hover:text-[#9945FF]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Tipe", value: selectedTx.tipe === "earn" ? "+1 Stamp" : `-${selectedTx.jumlah} Stamp (Redeem)` },
                    { label: "Mahasiswa", value: `#${selectedTx.user_id.slice(0, 6)}` },
                    { label: "Tanggal", value: new Date(selectedTx.tanggal).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" }) },
                    { label: "Network", value: "Solana Devnet" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4">
                      <span className="text-xs text-[#64748B] shrink-0">{row.label}</span>
                      <span className="text-xs font-semibold text-[#0F172A] text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
