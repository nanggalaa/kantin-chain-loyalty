import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Coffee,
  QrCode,
  Gift,
  Stamp,
  ShieldCheck,
  Sparkles,
  Store,
  GraduationCap,
  Building2,
  Zap,
  Network,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KantinChain – Loyalty Digital untuk Kantin Kampus" },
      {
        name: "description",
        content:
          "KantinChain adalah sistem loyalty digital lintas tenant untuk kantin kampus. Scan QR, kumpulkan stempel, tukar reward.",
      },
      { property: "og:title", content: "KantinChain – Loyalty Digital untuk Kantin Kampus" },
      {
        property: "og:description",
        content: "Scan QR, kumpulkan stempel, tukar reward. Satu aplikasi untuk semua kantin kampus.",
      },
    ],
  }),
  component: Landing,
});

function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gradient-warm)" }}
          >
            <Coffee className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">
            Kantin<span className="text-primary">Chain</span>
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="#home" className="text-muted-foreground hover:text-foreground">Home</a>
          <a href="#tentang" className="text-muted-foreground hover:text-foreground">Tentang</a>
          <Link to="/auth" className="text-muted-foreground hover:text-foreground">Login</Link>
        </nav>
        <Link to="/auth" className="sm:hidden">
          <Button size="sm" variant="outline" className="rounded-xl">Login</Button>
        </Link>
      </div>
    </header>
  );
}

function Landing() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section id="home" className="px-5 pt-12 pb-16 max-w-6xl mx-auto text-center">
        <div
          className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-stamp)" }}
        >
          <Coffee className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
          KantinChain –<br />
          <span className="text-primary">Loyalty Digital</span> untuk Kantin Kampus
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Satu aplikasi untuk semua kantin kampus. Kumpulkan stempel digital lintas tenant
          setiap kali jajan, lalu tukar dengan reward menarik.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Link to="/auth" className="flex-1">
            <Button size="lg" className="w-full h-12 rounded-xl" style={{ background: "var(--gradient-warm)" }}>
              <GraduationCap className="w-5 h-5" />
              Masuk sebagai Mahasiswa
            </Button>
          </Link>
          <Link to="/auth" className="flex-1">
            <Button size="lg" variant="outline" className="w-full h-12 rounded-xl">
              <Store className="w-5 h-5" />
              Masuk sebagai Tenant
            </Button>
          </Link>
        </div>
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="px-5 py-16 bg-secondary/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Cara Kerja</h2>
          <p className="text-muted-foreground text-center mb-10">Tiga langkah sederhana untuk mulai mengumpulkan reward</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: QrCode, title: "Scan QR", desc: "Pindai QR code di kantin saat melakukan pembelian." },
              { icon: Stamp, title: "Dapat Stempel", desc: "Stempel digital otomatis ditambahkan ke akunmu." },
              { icon: Gift, title: "Tukar Reward", desc: "Kumpulkan 10 stempel, tukar dengan reward menarik." },
            ].map((s, i) => (
              <div
                key={s.title}
                className="bg-card rounded-2xl p-6 text-center"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-semibold text-primary mb-1">LANGKAH {i + 1}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section id="tentang" className="px-5 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Keunggulan</h2>
        <p className="text-muted-foreground text-center mb-10">Kenapa memilih KantinChain?</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Sparkles, title: "Mudah Digunakan", desc: "Antarmuka sederhana, cocok untuk semua." },
            { icon: ShieldCheck, title: "Transparan", desc: "Riwayat stempel dan transaksi selalu jelas." },
            { icon: Network, title: "Lintas Tenant", desc: "Satu akun untuk semua kantin di kampus." },
            { icon: Zap, title: "Tanpa Ribet", desc: "Tanpa kartu fisik, tanpa antri panjang." },
          ].map((c) => (
            <div key={c.title} className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <c.icon className="w-7 h-7 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Target Pengguna */}
      <section className="px-5 py-16 bg-secondary/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Untuk Siapa?</h2>
          <p className="text-muted-foreground text-center mb-10">KantinChain dirancang untuk seluruh ekosistem kantin kampus</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: GraduationCap, title: "Mahasiswa", desc: "Dapatkan reward setiap kali jajan di kantin favorit." },
              { icon: Store, title: "Penjual Kantin", desc: "Tingkatkan loyalitas pelanggan tanpa biaya kartu fisik." },
              { icon: Building2, title: "Pengelola Kampus", desc: "Pantau aktivitas kantin secara digital dan terpusat." },
            ].map((u) => (
              <div key={u.title} className="bg-card rounded-2xl p-6 flex flex-col items-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--gradient-warm)" }}
                >
                  <u.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-1">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Siap mengumpulkan reward?</h2>
        <p className="text-muted-foreground mb-8">
          Bergabunglah dengan KantinChain hari ini dan rasakan pengalaman jajan yang lebih menguntungkan.
        </p>
        <Link to="/auth">
          <Button size="lg" className="h-14 px-8 rounded-2xl text-base" style={{ background: "var(--gradient-warm)" }}>
            Mulai Sekarang
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} KantinChain. Loyalty digital untuk kantin kampus.
      </footer>
    </main>
  );
}
