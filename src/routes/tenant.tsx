import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, LogOut, Store } from "lucide-react";

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
        const { data: tx } = await supabase.from("transactions").select("id, tipe, jumlah, tanggal, user_id").eq("tenant_id", tenant.id).order("tanggal", { ascending: false }).limit(30);
        setTxs((tx as any) ?? []);
      }
    })();
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const qrPayload = `kantinchain://tenant/${tenantId ?? ""}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;

  return (
    <main className="min-h-screen pb-12">
      <header className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tenant</p>
          <h1 className="text-xl font-bold">{tenantNama || nama} 🏪</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <section className="px-6">
        <div className="rounded-3xl p-6 text-primary-foreground flex flex-col items-center text-center" style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-stamp)" }}>
          <Store className="w-10 h-10 mb-3 opacity-90" />
          <h2 className="text-lg font-semibold">QR Kantin Anda</h2>
          <p className="text-sm opacity-85 mb-4 max-w-xs">Tunjukkan QR ini ke pelanggan agar mereka mendapat stempel.</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="secondary" className="rounded-2xl h-12 px-6">
                <QrCode className="w-5 h-5 mr-2" /> Tampilkan QR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-center">{tenantNama}</DialogTitle>
              </DialogHeader>
              <div className="bg-white p-4 rounded-2xl flex items-center justify-center">
                {tenantId ? <img src={qrUrl} alt="QR Tenant" className="w-full" /> : <p className="text-sm text-muted-foreground">Memuat...</p>}
              </div>
              <p className="text-xs text-center text-muted-foreground break-all">{qrPayload}</p>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="px-6 mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Transaksi Pelanggan</h2>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi.</p>
        ) : (
          <ul className="space-y-2">
            {txs.map((t) => (
              <li key={t.id} className="bg-card rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {t.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Pelanggan #{t.user_id.slice(0, 6)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.tanggal).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-success/15 text-success uppercase">
                  +{t.jumlah} {t.tipe}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
