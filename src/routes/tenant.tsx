import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  QrCode,
  LogOut,
  Store,
  Users,
  Stamp,
  Gift,
  Lightbulb,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  CupSoda,
  UtensilsCrossed,
  Ticket,
} from "lucide-react";

export const Route = createFileRoute("/tenant")({
  component: TenantDashboard,
});

type Tx = {
  id: string;
  tipe: "earn" | "redeem";
  jumlah: number;
  tanggal: string;
  user_id: string;
};

const REWARDS = [
  { min: 10, label: "Gratis Minuman", icon: CupSoda, color: "text-amber-600", bg: "bg-amber-50" },
  { min: 20, label: "Diskon Makanan", icon: UtensilsCrossed, color: "text-emerald-600", bg: "bg-emerald-50" },
  { min: 30, label: "Voucher Belanja", icon: Ticket, color: "text-rose-600", bg: "bg-rose-50" },
];

function TenantDashboard() {
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [tenantNama, setTenantNama] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate({ to: "/auth" }); return; }
      const uid = s.session.user.id;
      const { data: profile } = await supabase.from("profiles").select("nama, role").eq("id", uid).maybeSingle();
      if (profile?.role !== "tenant") { navigate({ to: "/dashboard" }); return; }
      setNama(profile?.nama ?? "");
      const { data: tenant } = await supabase.from("tenants").select("id, nama").eq("owner_id", uid).maybeSingle();
      if (tenant) {
        setTenantId(tenant.id);
        setTenantNama(tenant.nama);
        const { data: tx } = await supabase.from("transactions").select("id, tipe, jumlah, tanggal, user_id").eq("tenant_id", tenant.id).order("tanggal", { ascending: false }).limit(50);
        setTxs((tx as any) ?? []);
      }
    })();
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const today = useMemo(() => new Date().toDateString(), []);
  const stats = useMemo(() => {
    const todayTxs = txs.filter((t) => new Date(t.tanggal).toDateString() === today);
    const uniqueCustomers = new Set(todayTxs.map((t) => t.user_id)).size;
    const stampsOut = todayTxs.filter((t) => t.tipe === "earn").reduce((sum, t) => sum + t.jumlah, 0);
    const rewardsRedeemed = todayTxs.filter((t) => t.tipe === "redeem").reduce((sum, t) => sum + t.jumlah, 0);
    return { uniqueCustomers, stampsOut, rewardsRedeemed };
  }, [txs, today]);

  const recentTxs = txs.slice(0, 8);

  const qrPayload = `kantinchain://tenant/${tenantId ?? ""}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;

  return (
    <main className="min-h-screen pb-12 bg-background">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-start justify-between">
        <div className="max-w-[80%]">
          <p className="text-sm text-muted-foreground">Halo, {nama || "Penjual"} 👋</p>
          <h1 className="text-xl font-bold mt-0.5 leading-tight">{tenantNama || "Kantin Anda"}</h1>
          <p className="text-xs text-muted-foreground mt-1">Kelola loyalty pelanggan kantin Anda</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="shrink mt-1">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* QR Card - compact */}
      <section className="px-6">
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-stamp)" }}
        >
          <div className="w-16 h-16 rounded-xl bg-white/90 flex items-center justify-center shrink-0 overflow-hidden">
            {tenantId ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload)}`}
                alt="QR preview"
                className="w-14 h-14"
              />
            ) : (
              <QrCode className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-primary-foreground">QR Kantin Anda</h2>
            <p className="text-xs text-primary-foreground/85 mt-0.5 leading-relaxed">
              Tunjukkan QR ke pelanggan agar mereka dapat stempel.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 rounded-lg h-8 px-3 text-xs font-medium"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5" /> Tampilkan QR
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-center">{tenantNama}</DialogTitle>
                </DialogHeader>
                <div className="bg-white p-4 rounded-2xl flex items-center justify-center">
                  {tenantId ? (
                    <img src={qrUrl} alt="QR Tenant" className="w-full" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Memuat...</p>
                  )}
                </div>
                <p className="text-xs text-center text-muted-foreground break-all">{qrPayload}</p>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-3 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{stats.uniqueCustomers}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Pelanggan hari ini</p>
          </div>
          <div className="bg-card rounded-2xl p-3 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
              <Stamp className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{stats.stampsOut}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Stempel keluar</p>
          </div>
          <div className="bg-card rounded-2xl p-3 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
              <Gift className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{stats.rewardsRedeemed}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Reward diredeem</p>
          </div>
        </div>
      </section>

      {/* Transaksi Terakhir */}
      <section className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaksi Terakhir</h2>
          {txs.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{txs.length} total</span>
          )}
        </div>
        {recentTxs.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-6 text-center">
            <Store className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {recentTxs.map((t) => {
              const isEarn = t.tipe === "earn";
              return (
                <li
                  key={t.id}
                  className="bg-card rounded-2xl p-3.5 flex items-center gap-3"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isEarn ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isEarn ? (
                      <ArrowUpCircle className="w-4 h-4" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-2">
                    <p className="font-medium text-sm truncate">Pelanggan #{t.user_id.slice(0, 6)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(t.tanggal).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                        isEarn ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isEarn ? "+" : "-"}
                      {t.jumlah} {t.tipe}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Reward Populer */}
      <section className="px-6 mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Reward Populer</h2>
        <div className="space-y-2.5">
          {REWARDS.map((r) => (
            <div
              key={r.min}
              className="bg-card rounded-2xl p-3.5 flex items-center gap-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className={`w-9 h-9 rounded-full ${r.bg} ${r.color} flex items-center justify-center shrink-0`}>
                <r.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.min} stempel</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="px-6 mt-8">
        <div className="bg-accent/40 rounded-2xl p-4 flex items-start gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Tips Loyalty</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Berikan reward menarik untuk meningkatkan loyalitas pelanggan. Semakin banyak pilihan reward, semakin sering pelanggan kembali.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
