import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Coffee, QrCode, Gift } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .maybeSingle();
        if (profile?.role === "tenant") navigate({ to: "/tenant" });
        else navigate({ to: "/dashboard" });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-stamp)" }}
      >
        <Coffee className="w-10 h-10 text-primary-foreground" />
      </div>
      <h1 className="text-5xl font-bold tracking-tight mb-3">
        Kantin<span className="text-primary">Chain</span>
      </h1>
      <p className="text-muted-foreground max-w-sm mb-10">
        Loyalty digital lintas tenant untuk kantin kampus. Kumpulkan stempel, tukar reward.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-10 max-w-sm w-full">
        {[
          { icon: QrCode, label: "Scan QR" },
          { icon: Coffee, label: "Stempel" },
          { icon: Gift, label: "Reward" },
        ].map((f) => (
          <div key={f.label} className="bg-card rounded-2xl p-4 flex flex-col items-center gap-2" style={{ boxShadow: "var(--shadow-card)" }}>
            <f.icon className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
          </div>
        ))}
      </div>

      <Link to="/auth" className="w-full max-w-sm">
        <Button size="lg" className="w-full h-14 text-base rounded-2xl" style={{ background: "var(--gradient-warm)" }}>
          Mulai Sekarang
        </Button>
      </Link>
    </main>
  );
}
