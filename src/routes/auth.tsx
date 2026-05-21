import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"mahasiswa" | "tenant">("mahasiswa");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");

  const goToDashboard = async (uid: string) => {
    const { data: p } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
    navigate({ to: p?.role === "tenant" ? "/tenant" : "/dashboard" });
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nama, role, tenant_nama: nama },
          },
        });
        if (error) throw error;
        if (data.user) {
          toast.success("Akun berhasil dibuat!");
          await goToDashboard(data.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Selamat datang kembali!");
        await goToDashboard(data.user.id);
      }
    } catch (err: any) {
      const msg = err.message || "";
      let friendly = msg;
      if (/invalid login credentials/i.test(msg)) friendly = "Email atau password salah";
      else if (/already registered|already exists/i.test(msg)) friendly = "Email sudah terdaftar, silakan masuk";
      else if (/password.*(short|6)/i.test(msg)) friendly = "Password minimal 6 karakter";
      toast.error(friendly || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col px-6 py-8">
      <Link to="/" className="text-muted-foreground inline-flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          {mode === "login" ? "Masuk" : "Daftar"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {mode === "login" ? "Lanjutkan koleksi stempel Anda" : "Buat akun KantinChain baru"}
        </p>

        {mode === "signup" && (
          <Tabs value={role} onValueChange={(v) => setRole(v as any)} className="mb-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="mahasiswa">Mahasiswa</TabsTrigger>
              <TabsTrigger value="tenant">Penjual</TabsTrigger>
            </TabsList>
            <TabsContent value="mahasiswa" />
            <TabsContent value="tenant" />
          </Tabs>
        )}

        <form onSubmit={handle} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="nama">{role === "tenant" ? "Nama Kantin" : "Nama Lengkap"}</Label>
              <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required className="h-12 rounded-xl" />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base" style={{ background: "var(--gradient-warm)" }}>
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm text-muted-foreground mt-6 text-center hover:text-foreground"
        >
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </main>
  );
}
