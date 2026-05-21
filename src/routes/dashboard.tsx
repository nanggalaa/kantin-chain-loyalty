import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  QrCode,
  Gift,
  LogOut,
  Coffee,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Coins,
  Ticket,
  CupSoda,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type Tx = {
  id: string;
  tipe: "earn" | "redeem";
  jumlah: number;
  tanggal: string;
  tenants: { nama: string } | null;
};

type Reward = {
  threshold: number;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const REWARDS: Reward[] = [
  { threshold: 10, title: "Gratis Minuman", desc: "Pilih minuman favoritmu", Icon: CupSoda },
  { threshold: 20, title: "Diskon Makanan", desc: "Potongan hingga 30%", Icon: UtensilsCrossed },
  { threshold: 30, title: "Voucher Kantin", desc: "Senilai Rp 50.000", Icon: Ticket },
];

const REDEEM_COST = 10;

function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [stamps, setStamps] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (uid: string) => {
      const [{ data: profile }, { data: stamp }, { data: tx }] = await Promise.all([
        supabase.from("profiles").select("nama, role").eq("id", uid).maybeSingle(),
        supabase.from("stamps").select("jumlah").eq("user_id", uid).maybeSingle(),
        supabase
          .from("transactions")
          .select("id, tipe, jumlah, tanggal, tenants(nama)")
          .eq("user_id", uid)
          .order("tanggal", { ascending: false })
          .limit(20),
      ]);
      if (profile?.role === "tenant") {
        navigate({ to: "/tenant" });
        return;
      }
      setNama(profile?.nama ?? "");
      setStamps(stamp?.jumlah ?? 0);
      setTxs((tx as any) ?? []);
    },
    [navigate],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(data.session.user.id);
      load(data.session.user.id);
    });
  }, [navigate, load]);

  const pickRandomTenant = async (): Promise<string | null> => {
    const { data } = await supabase.from("tenants").select("id").limit(50);
    if (!data || data.length === 0) return null;
    return data[Math.floor(Math.random() * data.length)].id;
  };

  const handleScan = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const tenantId = await pickRandomTenant();
      const newTotal = stamps + 1;
      const { error: e1 } = await supabase
        .from("stamps")
        .update({ jumlah: newTotal, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("transactions")
        .insert({ user_id: userId, tenant_id: tenantId, tipe: "earn", jumlah: 1 });
      if (e2) throw e2;
      setStamps(newTotal);
      toast.success("✨ +1 Stempel!", { description: "Terus kumpulkan untuk redeem reward." });
      load(userId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRedeem = async () => {
    if (!userId) return;
    if (stamps < REDEEM_COST) {
      toast.error(`Butuh ${REDEEM_COST} stempel untuk redeem.`);
      return;
    }
    setBusy(true);
    try {
      const newTotal = stamps - REDEEM_COST;
      const { error: e1 } = await supabase
        .from("stamps")
        .update({ jumlah: newTotal, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("transactions")
        .insert({ user_id: userId, tipe: "redeem", jumlah: REDEEM_COST });
      if (e2) throw e2;
      setStamps(newTotal);
      toast.success("🎁 Reward berhasil ditukar!", { description: "Tunjukkan ke kantin favoritmu." });
      load(userId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const nextReward = REWARDS.find((r) => stamps < r.threshold) ?? REWARDS[REWARDS.length - 1];
  const reached = stamps >= nextReward.threshold;
  const remaining = Math.max(0, nextReward.threshold - stamps);
  const progressPct = Math.min(100, Math.round((stamps / nextReward.threshold) * 100));

  return (
    <main className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-primary-foreground font-bold"
            style={{ background: "var(--gradient-warm)" }}
          >
            {(nama || "M").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Selamat datang,</p>
            <h1 className="text-base font-semibold">{nama || "Mahasiswa"} 👋</h1>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="rounded-full">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="px-5 max-w-xl mx-auto space-y-6">
        {/* Progress Card */}
        <section
          className="rounded-3xl bg-card p-6 border border-border/60"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Stempel Kamu
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground leading-none">{stamps}</span>
                <span className="text-sm text-muted-foreground">terkumpul</span>
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--gradient-warm)" }}
            >
              <Coffee className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress menuju reward</span>
              <span className="font-semibold text-primary">
                {stamps} / {nextReward.threshold}
              </span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
            <div className="flex items-center gap-2 pt-1">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-foreground">
                {reached ? (
                  <>
                    Yeay! Kamu bisa tukar <span className="font-semibold">{nextReward.title}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{remaining} stempel lagi</span> untuk{" "}
                    <span className="text-muted-foreground">{nextReward.title.toLowerCase()}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={handleScan}
            disabled={busy}
            className="group relative overflow-hidden rounded-2xl p-4 text-left text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:hover:scale-100"
            style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-stamp)" }}
          >
            <QrCode className="w-6 h-6 mb-3 opacity-90 transition-transform group-hover:scale-110" />
            <p className="font-semibold text-sm">Scan QR</p>
            <p className="text-xs opacity-80">Dapatkan stempel</p>
          </button>
          <button
            onClick={handleRedeem}
            disabled={busy || stamps < REDEEM_COST}
            className="group relative overflow-hidden rounded-2xl p-4 text-left bg-card border border-border transition-all hover:scale-[1.02] hover:border-primary/40 hover:shadow-md disabled:opacity-50 disabled:hover:scale-100 disabled:hover:border-border"
          >
            <Gift className="w-6 h-6 mb-3 text-primary transition-transform group-hover:scale-110" />
            <p className="font-semibold text-sm text-foreground">Redeem</p>
            <p className="text-xs text-muted-foreground">Tukar reward</p>
          </button>
        </section>

        {/* Rewards Available */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Reward Tersedia</h2>
            <span className="text-xs text-muted-foreground">{REWARDS.length} pilihan</span>
          </div>
          <div className="space-y-2.5">
            {REWARDS.map((r) => {
              const unlocked = stamps >= r.threshold;
              return (
                <div
                  key={r.threshold}
                  className={`flex items-center gap-3 rounded-2xl bg-card border p-3.5 transition-all ${
                    unlocked ? "border-primary/40" : "border-border/60"
                  }`}
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      unlocked ? "text-primary-foreground" : "bg-accent text-accent-foreground"
                    }`}
                    style={unlocked ? { background: "var(--gradient-warm)" } : undefined}
                  >
                    <r.Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">{r.title}</p>
                      {unlocked && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success/15 text-success">
                          SIAP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                    <Coins className="w-3.5 h-3.5" />
                    {r.threshold}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Aktivitas Terakhir</h2>
            {txs.length > 0 && (
              <span className="text-xs text-muted-foreground">{txs.length} transaksi</span>
            )}
          </div>
          {txs.length === 0 ? (
            <div
              className="rounded-2xl bg-card border border-dashed border-border p-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent mx-auto flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Belum ada aktivitas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scan QR di kantin untuk mulai kumpulkan stempel
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {txs.map((t) => {
                const isEarn = t.tipe === "earn";
                return (
                  <li
                    key={t.id}
                    className="bg-card rounded-2xl p-3.5 flex items-center gap-3 border border-border/60 transition-all hover:border-primary/30"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isEarn ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isEarn ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {isEarn ? "Dapat Stempel" : "Tukar Reward"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.tenants?.nama ?? "KantinChain"} ·{" "}
                        {new Date(t.tanggal).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`font-semibold text-sm shrink-0 ${
                        isEarn ? "text-success" : "text-primary"
                      }`}
                    >
                      {isEarn ? "+" : "-"}
                      {t.jumlah}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
