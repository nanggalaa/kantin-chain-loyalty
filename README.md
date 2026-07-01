<div align="center">

# 🍽️ KantinChain

### Blockchain-Based Digital Loyalty System for Multi-Tenant Campus Cafeterias

Sistem loyalty digital berbasis **Solana Blockchain** yang memungkinkan banyak tenant dalam lingkungan kantin kampus menggunakan satu platform loyalty bersama.

![TypeScript](https://img.shields.io/badge/TypeScript-97%25-blue)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-orange)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Solana](https://img.shields.io/badge/Solana-Devnet-purple)
![License](https://img.shields.io/badge/Status-MVP-success)

</div>

---

# 📖 Overview

KantinChain merupakan aplikasi loyalty digital yang mengintegrasikan teknologi **Blockchain Solana** dengan sistem informasi kantin kampus.

Melalui aplikasi ini:

- Mahasiswa memperoleh stamp digital setiap transaksi.
- Stamp dapat ditukarkan menjadi reward.
- Seluruh transaksi loyalty memiliki bukti transaksi (Transaction Hash) pada Solana Devnet.
- Banyak tenant dapat menggunakan satu sistem loyalty yang sama.

---

# ✨ Features

## 👨‍🎓 Mahasiswa

- Login & Authentication
- Scan QR Code Tenant
- Earn Digital Stamp
- Redeem Reward
- Riwayat Transaksi
- Detail Transaction
- Copy Transaction Hash
- Open Solana Explorer

---

## 🏪 Tenant

- Dashboard Tenant
- Static QR Code
- Monitoring Aktivitas Pelanggan
- Riwayat Transaksi
- Status Blockchain
- Detail Transaction

---

## 👨‍💼 Administrator

- Dashboard Monitoring
- Data Mahasiswa
- Data Tenant
- Monitoring Aktivitas Platform

---

# 🏗️ Tech Stack

| Technology | Description |
|------------|-------------|
| TanStack Start | Frontend Framework |
| TypeScript | Programming Language |
| React | UI Library |
| TailwindCSS | Styling |
| Shadcn UI | UI Components |
| Supabase | Authentication & Database |
| Solana Web3.js | Blockchain Integration |
| Solana Devnet | Blockchain Network |
| QRCode | Loyalty Transaction |

---

# ⚙️ System Architecture

```text
Mahasiswa
      │
      │ Scan QR
      ▼
+---------------------+
|     KantinChain     |
| React + TanStack    |
+---------------------+
      │
      ├──────────────► Supabase
      │               (Auth + Database)
      │
      └──────────────► Solana Devnet
                      (Blockchain Transaction)
```

---

# 📂 Project Structure

```text
src/
├── components/
├── integrations/
│   └── supabase/
├── lib/
├── routes/
│   ├── auth.tsx
│   ├── dashboard.tsx
│   ├── tenant.tsx
│   └── admin.tsx
├── styles.css
└── routeTree.gen.ts

supabase/
├── functions/
└── migrations/
```

---

# 🚀 Installation

Clone repository

```bash
git clone https://github.com/nanggalaa/kantin-chain-loyalty.git
```

Masuk ke project

```bash
cd kantin-chain-loyalty
```

Install dependency

```bash
npm install
```

Jalankan aplikasi

```bash
npm run dev
```

---

# 🔑 Environment Variables

Buat file `.env`

```env
VITE_SUPABASE_URL=your_supabase_url

VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

---

# 📸 Application Flow

1. Mahasiswa Login
2. Scan QR Tenant
3. Earn Stamp
4. Blockchain Transaction Recorded
5. Stamp Stored
6. Redeem Reward
7. View Transaction History
8. Verify Transaction on Solana Explorer

---

# 🎯 Research Objective

Penelitian ini bertujuan untuk mengimplementasikan teknologi Blockchain Solana pada sistem loyalty digital multi-tenant sehingga:

- meningkatkan transparansi transaksi,
- mempermudah pengelolaan reward,
- menyediakan bukti transaksi yang dapat diverifikasi,
- mendukung penggunaan lintas tenant dalam satu platform.

---

# 📊 Current Status

✅ Authentication

✅ Multi Role (Mahasiswa, Tenant, Admin)

✅ QR Loyalty System

✅ Blockchain Integration

✅ Transaction History

✅ Solana Explorer Integration

✅ Dashboard Mahasiswa

✅ Dashboard Tenant

✅ Dashboard Admin

✅ MVP Completed

---

# 👨‍💻 Author

**Nanggala Parker**

Teknik Informatika  
Universitas Semarang

GitHub:
https://github.com/nanggalaa

---

# 📄 License

This project was developed for academic research purposes.
