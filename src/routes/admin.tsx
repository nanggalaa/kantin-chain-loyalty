import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Store,
  ArrowUpCircle,
  ArrowDownCircle,
  LogOut,
  Stamp,
  GraduationCap,
  CalendarDays,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

/* ── Types ── */
type Profile = {
  id: string;
  nama: string;
  role: string;
  created_at: string;
};

type Tenant = {
  id: string;
  nama: string;
  created_at: string;
};

type TxFlat = {
  id: string;
  user_id: string;
  tenant_id: string | null;
  tipe: "earn" | "redeem";
  jumlah: number;
  tanggal: string;
  blockchain_status: string | null;
};

type TxRow = TxFlat & {
  mahasiswaNama: string;
  tenantNama: string;
};

/* ── Main Component ── */
function AdminDashboard() {
  const navigate = useNavigate();
  const [adminNama, setAdminNama]     = useState("");
  const [loading, setLoading]         = useState(true);
  const [mahasiswaList, setMahasiswaList] = useState<Profile[]>([]);
  const [tenantList, setTenantList]   = useState<Tenant[]>([]);
  const [recentTxs, setRecentTxs]     = useState<TxRow[]>([]);

  useEffect(() => {
    (async () => {
      // Guard: hanya admin
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate({ to: "/auth" }); return; }
      const uid = s.session.user.id;
      const { data: self } = await supabase
        .from("profiles").select("nama, role").eq("id", uid).maybeSingle();
      if (self?.role !== "admin") { navigate({ to: "/dashboard" }); return; }
      setAdminNama(self?.nama ?? "Admin");

      // Tiga query sederhana, paralel
      const [
        { data: profiles,     error: errP },
        { data: tenants,      error: errT },
        { data: transactions, error: errX },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, nama, role, created_at")
          .order("nama"),
        supabase
          .from("tenants")
          .select("id, nama, created_at")
          .order("nama"),
        supabase
          .from("transactions")
          .select("id, user_id, tenant_id, tipe, jumlah, tanggal, blockchain_status")
          .order("tanggal", { ascending: false })
          .limit(10),
      ]);

      if (errP) console.error("[ADMIN] profiles error:", errP);
      if (errT) console.error("[ADMIN] tenants error:", errT);
      if (errX) console.error("[ADMIN] transactions error:", errX);

      const safeProfiles     = (profiles     ?? []) as Profile[];
      const safeTenants      = (tenants      ?? []) as Tenant[];
      const safeTransactions = (transactions ?? []) as TxFlat[];

      // Pisahkan mahasiswa dari profiles
      const mahasiswa = safeProfiles.filter((p) => p.role === "mahasiswa");

      // Map lookup untuk enrich transaksi
      const profileMap = new Map<string, string>(safeProfiles.map((p) => [p.id, p.nama]));
      const tenantMap  = new Map<string, string>(safeTenants.map((t) => [t.id, t.nama]));

      const rows: TxRow[] = safeTransactions.map((t) => ({
        ...t,
        mahasiswaNama: profileMap.get(t.user_id) ?? `#${t.user_id.slice(0, 6)}`,
        tenantNama:    t.tenant_id ? (tenantMap.get(t.tenant_id) ?? "-") : "-",
      }));

      setMahasiswaList(mahasiswa);
      setTenantList(safeTenants);
      setRecentTxs(rows);
      setLoading(false);
    })();
  }, [navigate]);

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 rounded-full border-2 border-transparent border-t-[#9945FF] border-r-[#14F195] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gradient-solana)" }}>
              <Stamp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">Kantin<span className="text-gradient-solana">Chain</span></span>
            <span className="ml-2 rounded-full bg-[#9945FF]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#9945FF]">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#64748B]">{adminNama}</span>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]">
              <LogOut className="h-3.5 w-3.5" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-16">

        {/* Heading */}
        <section className="pt-7 pb-5">
          <h1 className="text-xl font-extrabold tracking-tight text-[#0F172A]">Dashboard Admin</h1>
          <p className="mt-1 text-xs text-[#64748B]">Monitoring data platform KantinChain</p>
        </section>

        {/* 1 — Ringkasan Platform (hanya 2 card) */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#64748B]">Ringkasan Platform</h2>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(153,69,255,0.08)" }}>
                <Users className="h-5 w-5 text-[#9945FF]" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#0F172A] leading-none">{mahasiswaList.length}</p>
                <p className="mt-0.5 text-[11px] text-[#64748B]">Mahasiswa</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(153,69,255,0.08)" }}>
                <Store className="h-5 w-5 text-[#9945FF]" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#0F172A] leading-none">{tenantList.length}</p>
                <p className="mt-0.5 text-[11px] text-[#64748B]">Tenant</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2 — Aktivitas Terbaru */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Aktivitas Terbaru</h2>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{recentTxs.length} transaksi</span>
          </div>
          {recentTxs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E2E8F0] bg-white px-6 py-10 text-center">
              <p className="text-sm text-[#64748B]">Belum ada aktivitas.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
              {/* Header tabel — desktop only */}
              <div className="hidden sm:grid grid-cols-5 gap-3 border-b border-[#F1F5F9] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                <span>Waktu</span>
                <span>Mahasiswa</span>
                <span>Tenant</span>
                <span>Aktivitas</span>
                <span>Status</span>
              </div>
              <ul className="divide-y divide-[#F8FAFC]">
                {recentTxs.map((t) => {
                  const isEarn = t.tipe === "earn";
                  const status = t.blockchain_status ?? "pending";
                  return (
                    <li key={t.id} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                      <span className="text-[11px] text-[#64748B]">
                        {new Date(t.tanggal).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      <span className="text-[11px] font-medium text-[#0F172A] truncate">{t.mahasiswaNama}</span>
                      <span className="text-[11px] text-[#64748B] truncate hidden sm:block">
                        {t.tenantNama !== "-" ? t.tenantNama : <span className="text-[#CBD5E1]">—</span>}
                      </span>
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isEarn ? "bg-[#14F195]/10" : "bg-[#9945FF]/10"}`}>
                          {isEarn
                            ? <ArrowUpCircle className="h-3 w-3 text-[#059669]" />
                            : <ArrowDownCircle className="h-3 w-3 text-[#9945FF]" />}
                        </div>
                        <span className="text-[11px] font-medium text-[#0F172A]">
                          {isEarn ? `Earn +${t.jumlah} Stamp` : `Redeem ${t.jumlah} Stamp`}
                        </span>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        status === "confirmed" ? "bg-[#14F195]/10 text-[#059669]" :
                        status === "failed"    ? "bg-red-500/10 text-red-500" :
                                                 "bg-yellow-100 text-yellow-700"
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${
                          status === "confirmed" ? "bg-[#14F195]" :
                          status === "failed"    ? "bg-red-400" : "bg-yellow-400"
                        }`} />
                        {status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* 3 — Daftar Tenant */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Daftar Tenant</h2>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{tenantList.length} kantin</span>
          </div>
          {tenantList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E2E8F0] bg-white px-6 py-8 text-center">
              <p className="text-sm text-[#64748B]">Belum ada tenant terdaftar.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tenantList.map((t) => (
                <div key={t.id} className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#9945FF]/20 hover:shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
                    <Store className="h-4 w-4 text-[#9945FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{t.nama}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CalendarDays className="h-3 w-3 text-[#94A3B8]" />
                      <p className="text-[11px] text-[#64748B]">
                        Bergabung {new Date(t.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4 — Daftar Mahasiswa */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#64748B]">Daftar Mahasiswa</h2>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{mahasiswaList.length} mahasiswa</span>
          </div>
          {mahasiswaList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E2E8F0] bg-white px-6 py-8 text-center">
              <p className="text-sm text-[#64748B]">Belum ada mahasiswa terdaftar.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mahasiswaList.map((m) => (
                <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#9945FF]/20 hover:shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-solana-soft)" }}>
                    <GraduationCap className="h-4 w-4 text-[#9945FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{m.nama}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CalendarDays className="h-3 w-3 text-[#94A3B8]" />
                      <p className="text-[11px] text-[#64748B]">
                        Bergabung {new Date(m.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
