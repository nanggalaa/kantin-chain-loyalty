import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Stamp, GraduationCap, Store, Loader2 } from "lucide-react";

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
    if (p?.role === "tenant") navigate({ to: "/tenant" });
    else if (p?.role === "admin") navigate({ to: "/admin" });
    else navigate({ to: "/dashboard" });
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
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Topbar */}
      <div className="mx-auto w-full max-w-sm px-6 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] transition-colors hover:text-[#0F172A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="mx-auto w-full max-w-sm">

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
              style={{ background: "var(--gradient-solana)", boxShadow: "var(--shadow-button)" }}
            >
              <Stamp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              {mode === "login" ? "Masuk ke KantinChain" : "Buat Akun Baru"}
            </h1>
            <p className="mt-1.5 text-sm text-[#64748B]">
              {mode === "login"
                ? "Lanjutkan koleksi stamp kamu"
                : "Bergabung dan mulai kumpulkan reward"}
            </p>
          </div>

          {/* Role selector — hanya saat signup */}
          {mode === "signup" && (
            <div className="mb-5 grid grid-cols-2 gap-2">
              {(["mahasiswa", "tenant"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                    role === r
                      ? "border-transparent text-white shadow-md"
                      : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#9945FF]/30 hover:text-[#0F172A]"
                  }`}
                  style={role === r ? { background: "var(--gradient-solana)" } : undefined}
                >
                  {r === "mahasiswa" ? (
                    <GraduationCap className="h-4 w-4" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )}
                  {r === "mahasiswa" ? "Mahasiswa" : "Penjual"}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handle} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="nama" className="text-sm font-semibold text-[#0F172A]">
                  {role === "tenant" ? "Nama Kantin" : "Nama Lengkap"}
                </Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder={role === "tenant" ? "contoh: Warung Bu Siti" : "contoh: Budi Santoso"}
                  required
                  className="h-12 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#CBD5E1] focus-visible:ring-[#9945FF]/30"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-[#0F172A]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="h-12 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#CBD5E1] focus-visible:ring-[#9945FF]/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-[#0F172A]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className="h-12 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#CBD5E1] focus-visible:ring-[#9945FF]/30"
              />
              {mode === "signup" && (
                <p className="text-[11px] text-[#94A3B8]">Minimal 6 karakter, bebas huruf atau angka.</p>
              )}
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl h-12 text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "var(--gradient-solana)",
                boxShadow: "var(--shadow-button)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : mode === "login" ? (
                "Masuk"
              ) : (
                "Buat Akun"
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center">
            <span className="text-sm text-[#64748B]">
              {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm font-semibold text-[#9945FF] transition-colors hover:text-[#7c2fd6] hover:underline"
            >
              {mode === "login" ? "Daftar sekarang" : "Masuk"}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
