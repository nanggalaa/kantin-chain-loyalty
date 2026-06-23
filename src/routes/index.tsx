import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Store,
  Gift,
  QrCode,
  Zap,
  Lock,
  Coins,
  ArrowRight,
  Stamp,
  CheckCircle2,
  Layers,
  UserPlus,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KantinChain – Loyalty Digital Kantin Kampus Berbasis Blockchain" },
      {
        name: "description",
        content:
          "KantinChain menghadirkan sistem loyalty digital yang modern, transparan, dan aman untuk mahasiswa dan tenant kantin dengan dukungan teknologi blockchain Solana.",
      },
      { property: "og:title", content: "KantinChain – Loyalty Digital Kantin Kampus" },
      {
        property: "og:description",
        content: "Sistem loyalty digital modern untuk kantin kampus berbasis teknologi blockchain Solana.",
      },
    ],
  }),
  component: Landing,
});

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-6xl px-5 pt-4">
        <nav
          className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-5 py-3 backdrop-blur-xl"
          style={{ boxShadow: "var(--shadow-nav)" }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "var(--gradient-solana)" }}
            >
              <Stamp className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-[#0F172A]">
              Kantin<span className="text-gradient-solana">Chain</span>
            </span>
          </Link>

          {/* Menu desktop */}
          <div className="hidden items-center gap-7 md:flex">
            {["Beranda", "Fitur", "Cara Kerja", "Tentang"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A]"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link to="/auth">
            <button
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
              style={{
                background: "var(--gradient-solana)",
                boxShadow: "var(--shadow-button)",
              }}
            >
              Masuk
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Hero Illustration ───────────────────────────────────────── */
function HeroIllustration() {
  return (
    <div className="relative mx-auto h-95 w-full max-w-110">
      {/* Glow background */}
      <div
        className="absolute inset-0 rounded-3xl opacity-20 blur-3xl animate-pulse-glow"
        style={{ background: "var(--gradient-solana)" }}
      />

      {/* Loyalty card utama */}
      <div
        className="animate-float absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-3xl p-5 shadow-2xl"
        style={{ background: "var(--gradient-solana)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
            KantinChain Card
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
            <Stamp className="h-4 w-4 text-white" />
          </div>
        </div>
        {/* Stamp grid */}
        <div className="mb-4 grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                i < 7
                  ? "bg-white/90 text-[#9945FF] shadow-sm"
                  : "border border-white/30 bg-white/10 text-white/40"
              }`}
            >
              {i < 7 ? "✦" : "○"}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Mahasiswa</p>
            <p className="text-sm font-semibold text-white">7 / 10 Stempel</p>
          </div>
          <div className="rounded-xl bg-white/20 px-3 py-1.5">
            <p className="text-xs font-semibold text-white">3 lagi →</p>
          </div>
        </div>
      </div>

      {/* Badge QR floating kiri */}
      <div
        className="animate-float-slow absolute left-0 top-16 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xl"
        style={{ animationDelay: "1s", boxShadow: "var(--shadow-card-hover)" }}
      >
        <QrCode className="h-10 w-10 text-[#9945FF]" />
        <p className="mt-1 text-center text-[10px] font-semibold text-[#64748B]">Scan QR</p>
      </div>

      {/* Badge reward floating kanan */}
      <div
        className="animate-float absolute right-0 top-8 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2.5 shadow-xl"
        style={{ animationDelay: "2s", boxShadow: "var(--shadow-card-hover)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-solana-soft)" }}
          >
            <Gift className="h-4 w-4 text-[#9945FF]" />
          </div>
          <div>
            <p className="text-[10px] text-[#64748B]">Reward</p>
            <p className="text-xs font-bold text-[#0F172A]">Siap Ditukar</p>
          </div>
        </div>
      </div>

      {/* Badge blockchain floating bawah */}
      <div
        className="animate-float-slow absolute bottom-10 right-4 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-xl"
        style={{ animationDelay: "0.5s", boxShadow: "var(--shadow-card-hover)" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#14F195] shadow-sm" />
          <p className="text-[11px] font-semibold text-[#0F172A]">Solana Network</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Landing Page ────────────────────────────────────────────── */
function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />

      {/* ── Hero ── */}
      <section
        id="beranda"
        className="relative overflow-hidden pt-32 pb-24"
        style={{ background: "var(--gradient-hero-bg)" }}
      >
        {/* Dekoratif blob */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-150 w-150 -translate-x-1/2 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "var(--gradient-solana)" }}
        />

        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Teks */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 shadow-sm">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: "var(--gradient-solana)" }}
                />
                <span className="text-xs font-semibold text-[#64748B]">
                  Didukung Teknologi Solana Blockchain
                </span>
              </div>

              <h1 className="mb-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-[#0F172A] sm:text-5xl lg:text-[3.25rem]">
                Transformasi Loyalty<br />
                Kantin Kampus dengan{" "}
                <span className="text-gradient-solana">Teknologi Blockchain</span>
              </h1>

              <p className="mb-8 text-base leading-relaxed text-[#64748B] sm:text-lg lg:max-w-120">
                KantinChain menghadirkan sistem loyalty digital yang modern, transparan,
                dan aman untuk mahasiswa dan tenant kantin dengan dukungan teknologi
                blockchain Solana.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link to="/auth">
                  <button
                    className="inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl"
                    style={{
                      background: "var(--gradient-solana)",
                      boxShadow: "var(--shadow-button)",
                    }}
                  >
                    Mulai Sekarang
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <a href="#cara-kerja">
                  <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 text-sm font-semibold text-[#0F172A] transition-all hover:border-[#9945FF]/30 hover:shadow-md">
                    Pelajari Cara Kerja
                  </button>
                </a>
              </div>

              {/* Trust indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                {[
                  "Transparan & Aman",
                  "Lintas Tenant",
                  "Reward Digital",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#14F195]" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Ilustrasi */}
            <div className="flex justify-center lg:justify-end">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── Fitur ── */}
      <section id="fitur" className="py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9945FF]">
              Fitur Unggulan
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
              Dirancang untuk Ekosistem Kampus
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#64748B]">
              Tiga pilar utama yang membuat KantinChain berbeda dari sistem loyalty konvensional.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Transparansi Blockchain",
                desc: "Setiap proses pemberian dan penukaran stamp tersimpan secara aman dan transparan di jaringan Solana.",
                accent: "#9945FF",
                bg: "rgba(153,69,255,0.06)",
              },
              {
                icon: Store,
                title: "Loyalty Multi-Tenant",
                desc: "Satu akun mahasiswa dapat digunakan untuk mengumpulkan stamp dari berbagai kantin dalam satu ekosistem.",
                accent: "#14F195",
                bg: "rgba(20,241,149,0.06)",
              },
              {
                icon: Gift,
                title: "Reward Digital Pintar",
                desc: "Kumpulkan stamp digital dan tukarkan dengan berbagai reward menarik secara mudah dan instan.",
                accent: "#9945FF",
                bg: "rgba(153,69,255,0.06)",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-hover group rounded-2xl border border-[#E2E8F0] bg-white p-7"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: f.bg }}
                >
                  <f.icon className="h-6 w-6" style={{ color: f.accent }} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-[#0F172A]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#64748B]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ── */}
      <section id="cara-kerja" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9945FF]">
              Cara Kerja
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
              Empat Langkah Sederhana
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#64748B]">
              Mulai kumpulkan reward dalam hitungan menit.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                icon: UserPlus,
                title: "Buat Akun",
                desc: "Daftar dengan email dan pilih peran sebagai mahasiswa atau tenant kantin.",
              },
              {
                step: "02",
                icon: QrCode,
                title: "Scan QR Kantin",
                desc: "Pindai QR code di kantin setiap kali melakukan transaksi pembelian.",
              },
              {
                step: "03",
                icon: Stamp,
                title: "Kumpulkan Stamp",
                desc: "Stamp digital otomatis tercatat di akun Anda secara real-time.",
              },
              {
                step: "04",
                icon: Gift,
                title: "Tukarkan Reward",
                desc: "Kumpulkan 10 stamp dan tukarkan dengan reward menarik pilihanmu.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {/* Connector line */}
                {i < 3 && (
                  <div className="absolute right-0 top-7 hidden h-px w-6 translate-x-3 bg-linear-to-r from-[#9945FF] to-[#14F195] opacity-30 lg:block" />
                )}
                <div
                  className="card-hover h-full rounded-2xl border border-[#E2E8F0] bg-white p-6"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="text-xs font-extrabold text-gradient-solana"
                    >
                      {s.step}
                    </span>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: "var(--gradient-solana-soft)" }}
                    >
                      <s.icon className="h-5 w-5 text-[#9945FF]" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-bold text-[#0F172A]">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-[#64748B]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solana Section ── */}
      <section id="tentang" className="py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-6xl px-5">
          <div className="overflow-hidden rounded-3xl p-px" style={{ background: "var(--gradient-solana)" }}>
            <div className="rounded-3xl bg-[#0F172A] px-8 py-14 md:px-14">
              <div className="mb-12 text-center">
                {/* Solana logo badge */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#14F195]" />
                  <span className="text-xs font-semibold text-white/70">
                    Powered by Solana
                  </span>
                </div>
                <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Didukung Teknologi{" "}
                  <span className="text-gradient-solana">Solana Blockchain</span>
                </h2>
                <p className="mx-auto max-w-lg text-[#94A3B8]">
                  KantinChain memanfaatkan teknologi blockchain Solana untuk menghadirkan
                  sistem loyalty yang lebih cepat, aman, dan transparan.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {[
                  {
                    emoji: "⚡",
                    title: "Transaksi Cepat",
                    desc: "Proses pencatatan data loyalty berjalan dengan cepat berkat arsitektur Solana.",
                    accent: "#14F195",
                  },
                  {
                    emoji: "🔒",
                    title: "Aman & Transparan",
                    desc: "Riwayat aktivitas loyalty dapat diverifikasi secara on-chain dan lebih terpercaya.",
                    accent: "#9945FF",
                  },
                  {
                    emoji: "💸",
                    title: "Biaya Rendah",
                    desc: "Teknologi blockchain yang efisien dengan biaya transaksi sangat minimal.",
                    accent: "#14F195",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="card-hover rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/8"
                  >
                    <div className="mb-4 text-2xl">{item.emoji}</div>
                    <h3
                      className="mb-2 font-bold"
                      style={{ color: item.accent }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#94A3B8]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-5">
          <div
            className="relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16"
            style={{ background: "var(--gradient-solana)" }}
          >
            {/* Dekoratif lingkaran */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/70">
                Bergabung Sekarang
              </p>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Siap Memulai Era Loyalty Digital?
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-base text-white/80">
                Bergabung bersama KantinChain dan rasakan pengalaman baru dalam sistem
                reward kantin kampus yang modern dan transparan.
              </p>
              <Link to="/auth">
                <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-[#9945FF] shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl active:scale-100">
                  Mulai Sekarang
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            {/* Brand */}
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "var(--gradient-solana)" }}
                >
                  <Stamp className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-[#0F172A]">
                  Kantin<span className="text-gradient-solana">Chain</span>
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Loyalty Kantin Kampus Berbasis Blockchain
              </p>
            </div>

            {/* Links */}
            <nav className="flex items-center gap-6 text-sm text-[#64748B]">
              <a href="#fitur" className="hover:text-[#0F172A] transition-colors">Fitur</a>
              <a href="#cara-kerja" className="hover:text-[#0F172A] transition-colors">Cara Kerja</a>
              <Link to="/auth" className="hover:text-[#0F172A] transition-colors">Masuk</Link>
            </nav>
          </div>

          <div className="mt-8 border-t border-[#E2E8F0] pt-6 text-center text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} KantinChain. Hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
