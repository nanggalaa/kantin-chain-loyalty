import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  ScanLine,
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
};

/* ── Constants ── */
const REWARDS = [
  { min: 10, label: "Gratis Minuman", icon: CupSoda },
  { min: 20, label: "Diskon Makanan", icon: UtensilsCrossed },
  { min: 30, label: "Voucher Belanja", icon: Ticket },
];

/* ── Helpers ── */
function shortHash(id: string) {
  return id.slice(0, 5) + "..." + id.slice(-4);
}

/* ── Main Component ── */
function TenantDashboard() {
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [tenantNama, setTenantNama] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);

  /* ── Data loading (unchanged) ── */
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate({ to: "/auth" }); return; }
      const uid = s.session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("nama, role")
        .eq("id", uid)
        .maybeSingle();
      if (profile?.role !== "tenant") { navigate({ to: "/dashboard" }); return; }
      setNama(profile?.nama ?? "");
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, nama")
        .eq("owner_id", uid)
        .maybeSingle();
      if (tenant) {
        setTenantId(tenant.id);
        setTenantNama(tenant.nama);
        const { data: tx } = await supabase
          .from("transactions")
          .select("id, tipe, jumlah, tanggal, user_id")
          .eq("tenant_id", tenant.id)
          .order("tanggal", { ascending: false })
          .limit(50);
        setTxs((tx as any) ?? []);
      }
    })();
  }, [navigate]);

  /* ── Actions (unchanged) ── */
  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  /* ── Derived state (unchanged) ── */
  const today = useMemo(() => new Date().toDateString(), []);
  const stats = useMemo(() => {
    const todayTxs = txs.filter((t) => new Date(t.tanggal).toDateString() === today);
    const uniqueCustomers = new Set(todayTxs.map((t) => t.user_id)).size;
    const stampsOut = todayTxs
      .filter((t) => t.tipe === "earn")
      .reduce((sum, t) => sum + t.jumlah, 0);
    const rewardsRedeemed = todayTxs
      .filter((t) => t.tipe === "redeem")
      .reduce((sum, t) => sum + t.jumlah, 0);
    return { uniqueCustomers, stampsOut, rewardsRedeemed };
  }, [txs, today]);

  const recentTxs = txs.slice(0, 8);

  const qrPayload = `kantinchain://tenant/${tenantId ?? ""}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;
  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload)}`;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Topbar ── */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-solana)" }}
            >
              <Store className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">
              Kantin<span className="text-gradient-solana">Chain</span>
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16">

        {/* ── Hero Greeting ── */}
        <section className="pt-7 pb-5">
          <p className="text-sm text-[#64748B]">
            Halo,{" "}
            <span className="font-semibold text-[#0F172A]">{nama || "Penjual"}</span> 👋
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-[#0F172A]">
            {tenantNama || "Kantin Anda"}
          </h1>
          <p className="mt-1 text-xs text-[#64748B]">
            Kelola loyalty pelanggan kantin Anda dengan KantinChain
          </p>
        </section>

        {/* ── Card QR Utama ── */}
        <section>
          <div
            className="relative overflow-hidden rounded-3xl p-6 text-white"
            style={{
              background: "var(--gradient-solana)",
              boxShadow: "0 8px 40px -8px rgba(153,69,255,0.45)",
            }}
          >
            {/* Dekoratif */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-center gap-5">
              {/* QR Preview */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-lg">
                {tenantId ? (
                  <img src={qrPreviewUrl} alt="QR preview" className="h-20 w-20" />
                ) : (
                  <QrCode className="h-10 w-10 text-[#9945FF]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/90">
                    QR Kantin Aktif
                  </span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">
                  {tenantNama || "Kantin Anda"}
                </h2>
                <p className="mt-1 text-xs text-white/75 leading-relaxed">
                  Tampilkan QR ini kepada mahasiswa untuk mendapatkan stamp.
                </p>

                {/* Tombol tampilkan QR */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="mt-3 flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#9945FF] shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-100">
                      <QrCode className="h-3.5 w-3.5" />
                      Tampilkan QR
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-center text-[#0F172A]">
                        {tenantNama}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
                      {tenantId ? (
                        <img src={qrUrl} alt="QR Tenant" className="w-full rounded-xl" />
                      ) : (
                        <p className="text-sm text-[#64748B]">Memuat...</p>
                      )}
                    </div>
                    <p className="break-all text-center text-[10px] text-[#94A3B8]">
                      {qrPayload}
                    </p>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </section>

        {/* ── Aksi Cepat ── */}
        <section className="mt-4 grid grid-cols-3 gap-3">
          {[
            {
              icon: ScanLine,
              label: "Tampilkan QR",
              sub: "Beri stamp",
              accent: true,
              onClick: undefined as (() => void) | undefined,
              isDialog: true,
            },
            {
              icon: Settings,
              label: "Kelola Reward",
              sub: "Atur reward",
              accent: false,
              onClick: undefined,
              isDialog: false,
            },
            {
              icon: CheckCircle2,
              label: "Verifikasi",
              sub: "Cek redeem",
              accent: false,
              onClick: undefined,
              isDialog: false,
            },
          ].map((action) =>
            action.isDialog ? (
              <Dialog key={action.label}>
                <DialogTrigger asChild>
                  <button
                    className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#9945FF]/30 bg-white py-4 shadow-sm transition-all hover:shadow-md hover:border-[#9945FF]/60 active:scale-95"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: "var(--gradient-solana-soft)" }}
                    >
                      <action.icon className="h-4.5 w-4.5 text-[#9945FF]" />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A] leading-tight text-center">
                      {action.label}
                    </span>
                    <span className="text-[10px] text-[#64748B]">{action.sub}</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xs rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-center text-[#0F172A]">{tenantNama}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
                    {tenantId ? (
                      <img src={qrUrl} alt="QR Tenant" className="w-full rounded-xl" />
                    ) : (
                      <p className="text-sm text-[#64748B]">Memuat...</p>
                    )}
                  </div>
                  <p className="break-all text-center text-[10px] text-[#94A3B8]">{qrPayload}</p>
                </DialogContent>
              </Dialog>
            ) : (
              <button
                key={action.label}
                className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#E2E8F0] bg-white py-4 shadow-sm transition-all hover:border-[#9945FF]/30 hover:shadow-md active:scale-95"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "var(--gradient-solana-soft)" }}
                >
                  <action.icon className="h-4 w-4 text-[#9945FF]" />
                </div>
                <span className="text-xs font-bold text-[#0F172A] leading-tight text-center">
                  {action.label}
                </span>
                <span className="text-[10px] text-[#64748B]">{action.sub}</span>
              </button>
            )
          )}
        </section>

        {/* ── Statistik Hari Ini ── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">
              Statistik Hari Ini
            </h2>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">
              {new Date().toLocaleDateString("id-ID", { dateStyle: "medium" })}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: Users,
                value: stats.uniqueCustomers,
                label: "Pelanggan\nHari Ini",
                color: "#9945FF",
                bg: "rgba(153,69,255,0.08)",
              },
              {
                icon: Stamp,
                value: stats.stampsOut,
                label: "Stamp\nKeluar",
                color: "#9945FF",
                bg: "rgba(153,69,255,0.08)",
              },
              {
                icon: Gift,
                value: stats.rewardsRedeemed,
                label: "Reward\nDitukar",
                color: "#14F195",
                bg: "rgba(20,241,149,0.10)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: s.bg }}
                >
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-black text-[#0F172A] leading-none">{s.value}</p>
                <p className="mt-1 whitespace-pre-line text-[10px] text-[#64748B] leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reward Saya ── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">
              Reward Saya
            </h2>
            <button className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#9945FF] transition-colors hover:border-[#9945FF]/30 hover:bg-[#F8FAFC]">
              <Settings className="h-3 w-3" />
              Kelola Reward
            </button>
          </div>

          <div className="space-y-2.5">
            {REWARDS.map((r) => (
              <div
                key={r.min}
                className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#9945FF]/20 hover:shadow-sm"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--gradient-solana-soft)" }}
                >
                  <r.icon className="h-5 w-5 text-[#9945FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A]">{r.label}</p>
                  <p className="text-[11px] text-[#64748B]">{r.min} stamp</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#9945FF]/10 px-2.5 py-1 text-[10px] font-bold text-[#9945FF]">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Aktivitas Terbaru ── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">
              Aktivitas Terbaru
            </h2>
            {txs.length > 0 && (
              <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">
                {txs.length} total
              </span>
            )}
          </div>

          {recentTxs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E2E8F0] bg-white px-6 py-10 text-center">
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "var(--gradient-solana-soft)" }}
              >
                <Store className="h-7 w-7 text-[#9945FF]" />
              </div>
              <p className="font-semibold text-[#0F172A]">Belum ada transaksi</p>
              <p className="mt-1 text-xs text-[#64748B]">
                Tampilkan QR kepada mahasiswa untuk mulai merekam aktivitas.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {recentTxs.map((t) => {
                const isEarn = t.tipe === "earn";
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5 transition-all hover:border-[#9945FF]/20 hover:shadow-sm"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isEarn
                          ? "bg-[#14F195]/10 text-[#059669]"
                          : "bg-[#9945FF]/10 text-[#9945FF]"
                      }`}
                    >
                      {isEarn ? (
                        <ArrowUpCircle className="h-4 w-4" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">
                        {isEarn ? "+1 Stamp" : "Reward Ditukar"}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Mahasiswa #{t.user_id.slice(0, 6)} ·{" "}
                        {new Date(t.tanggal).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase ${
                        isEarn
                          ? "bg-[#14F195]/10 text-[#059669]"
                          : "bg-[#9945FF]/10 text-[#9945FF]"
                      }`}
                    >
                      {isEarn ? `+${t.jumlah}` : `-${t.jumlah}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Status Blockchain ── */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#64748B]">
            Status Blockchain
          </h2>

          <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#0F172A]">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--gradient-solana)" }}
              >
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
                <p className="mt-0.5 text-[11px] text-white/50">
                  {txs.length} transaksi tercatat
                </p>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="px-5 py-4">
              <p className="text-xs leading-relaxed text-white/50">
                Semua aktivitas stamp dan redeem di kantin Anda dicatat ke jaringan Solana
                secara transparan dan tidak dapat dimanipulasi.
              </p>
            </div>

            {/* Blockchain activity list */}
            {txs.length > 0 && (
              <ul className="divide-y divide-white/5 border-t border-white/10">
                {txs.slice(0, 4).map((t) => {
                  const isEarn = t.tipe === "earn";
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#14F195]/15">
                        <CheckCircle2 className="h-3 w-3 text-[#14F195]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isEarn
                                ? "bg-[#14F195]/15 text-[#14F195]"
                                : "bg-[#9945FF]/20 text-[#9945FF]"
                            }`}
                          >
                            {isEarn ? "Earn" : "Redeem"}
                          </span>
                          <span className="text-[10px] text-white/40">
                            #{t.user_id.slice(0, 6)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5 text-white/25" />
                          <span className="font-mono text-[10px] text-white/35">
                            Tx: {shortHash(t.id)}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] text-white/30">
                        {new Date(t.tanggal).toLocaleTimeString("id-ID", {
                          timeStyle: "short",
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Footer */}
            <div className="border-t border-white/10 px-5 py-3 text-center">
              <p className="text-[10px] text-white/25">
                Powered by Solana Blockchain · Transparan & Tidak Dapat Dimanipulasi
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
