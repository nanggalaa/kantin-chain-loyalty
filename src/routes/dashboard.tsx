import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QrCode, Gift, LogOut, Coffee, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

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

const REWARD_THRESHOLD = 10;

function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [stamps, setStamps] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (uid: string) => {
    const [{ data: profile }, { data: stamp }, { data: tx }] = await Promise.all([
      supabase.from("profiles").select("nama, role").eq("id", uid).maybeSingle(),
      supabase.from("stamps").select("jumlah").eq("user_id", uid).maybeSingle(),
      supabase.from("transactions").select("id, tipe, jumlah, tanggal, tenants(nama)").eq("user_id", uid).order("tanggal", { ascending: false }).limit(20),
    ]);
    if (profile?.role === "tenant") {
      navigate({ to: "/tenant" });
      return;
    }
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
      const { error: e1 } = await supabase.from("stamps").update({ jumlah: newTotal, updated_at: new Date().toISOString() }).eq("user_id", userId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("transactions").insert({ user_id: userId, tenant_id: tenantId, tipe: "earn", jumlah: 1 });
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
    if (stamps < REWARD_THRESHOLD) {
      toast.error(`Butuh ${REWARD_THRESHOLD} stempel untuk redeem.`);
      return;
    }
    setBusy(true);
    try {
      const newTotal = stamps - REWARD_THRESHOLD;
      const { error: e1 } = await supabase.from("stamps").update({ jumlah: newTotal, updated_at: new Date().toISOString() }).eq("user_id", userId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("transactions").insert({ user_id: userId, tipe: "redeem", jumlah: REWARD_THRESHOLD });
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

  const progress = Math.min(stamps, REWARD_THRESHOLD);

  return (
    <main className="min-h-screen pb-12">
      <header className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Halo,</p>
          <h1 className="text-xl font-bold">{nama || "Mahasiswa"} 👋</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <section className="px-6">
        <div
          className="rounded-3xl p-6 text-primary-foreground"
          style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-stamp)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Total Stempel</span>
            <Coffee className="w-5 h-5 opacity-80" />
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-6xl font-bold leading-none">{stamps}</span>
            <span className="text-sm opacity-80 mb-1">/ {REWARD_THRESHOLD} reward</span>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: REWARD_THRESHOLD }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-full border-2 flex items-center justify-center text-xs ${
                  i < progress ? "bg-primary-foreground border-primary-foreground text-primary" : "border-primary-foreground/40"
                }`}
              >
                {i < progress ? "★" : ""}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 mt-6 grid grid-cols-2 gap-3">
        <Button onClick={handleScan} disabled={busy} className="h-20 rounded-2xl flex-col gap-1" style={{ background: "var(--gradient-warm)" }}>
          <QrCode className="w-6 h-6" />
          <span className="text-sm">Scan QR</span>
        </Button>
        <Button onClick={handleRedeem} disabled={busy || stamps < REWARD_THRESHOLD} variant="secondary" className="h-20 rounded-2xl flex-col gap-1">
          <Gift className="w-6 h-6" />
          <span className="text-sm">Redeem</span>
        </Button>
      </section>

      <section className="px-6 mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Riwayat Transaksi</h2>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi. Scan QR untuk mulai!</p>
        ) : (
          <ul className="space-y-2">
            {txs.map((t) => (
              <li key={t.id} className="bg-card rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.tipe === "earn" ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"}`}>
                  {t.tipe === "earn" ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t.tipe === "earn" ? "Dapat Stempel" : "Tukar Reward"}</p>
                  <p className="text-xs text-muted-foreground">{t.tenants?.nama ?? "KantinChain"} · {new Date(t.tanggal).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <span className={`font-semibold text-sm ${t.tipe === "earn" ? "text-success" : "text-destructive"}`}>
                  {t.tipe === "earn" ? "+" : "-"}{t.jumlah}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
