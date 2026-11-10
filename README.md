# Sistem Informasi Apotek Sri Utama (Modul IV APSI)

Aplikasi berbasis Web untuk **Apotek Sri Utama** yang dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, dan **PostgreSQL** (Docker Desktop untuk pengembangan lokal & Neon Serverless PostgreSQL untuk cloud deployment di Vercel).

---

## Fitur Utama & Role Pengguna (Sesuai Permission Matrix)

1. **Owner**:
   - Login ke sistem dan memantau **Dashboard Metrik Operasional**.
   - Melihat katalog obat (*Read-Only*), jumlah stok real-time, riwayat transaksi apotek, serta **Laporan Penjualan & Stok**.
2. **Admin**:
   - Mengelola katalog obat (**CRUD Obat**), mencatat penerimaan & penyesuaian **Stok Obat**.
   - Melihat dan menindaklanjuti **Permintaan Obat** pelanggan.
   - Melayani transaksi penjualan langsung melalui **Kasir POS** (dengan pemotongan stok atomik) dan mencetak struk penjualan.
   - Melihat rekap transaksi dan laporan operasional.
3. **Apoteker**:
   - Memeriksa dan melakukan **Validasi Resep Dokter** (*Setujui / Tolak* beserta alasan) serta menginspeksi dokumen digital resep pelanggan melalui endpoint terproteksi.
   - Mengelola katalog obat, stok obat, permintaan obat pelanggan, transaksi Kasir POS, dan laporan operasional apotek.
4. **Pelanggan**:
   - Registrasi akun mandiri dan login ke portal pelanggan (`/pelanggan`).
   - Mencari & memfilter katalog obat berdasarkan golongan obat.
   - Mengajukan permintaan/pemesanan obat (Tunai/QRIS) dan **mengunggah berkas resep dokter** (JPG, PNG, PDF maks. 5 MB) untuk obat keras/antibiotik.
   - Melanjutkan pesanan yang telah disetujui Apoteker menjadi transaksi dan memantau riwayat transaksi pribadi.

---

## Arsitektur & Struktur Direktori

- `database.sql` — Definisi DDL & DML 18 tabel relasional beserta constraint PK/FK, indeks, dan seed data awal dengan password ter-hash bcrypt (`pgcrypto`).
- `prisma/schema.prisma` — Hasil introspeksi skema basis data PostgreSQL (`npx prisma db pull`).
- `Permission_Matrix_Apotek_Sri_Utama.xlsx` — Matriks Hak Akses (Permission Matrix) 4 role utama terhadap seluruh modul/sumber daya.
- `AGENTS.md` — Dokumentasi *Context Engineering* (kerangka *Context–Feature–Constraint* / CFC), integrasi **Figma MCP Server**, dan catatan prompt pengembangan.
- `app/` — Halaman frontend (*Presentation Layer*), Server Actions, dan REST API Route Handlers (`app/api/*/route.ts`).
- `lib/` — Modul autentikasi sesi HMAC-SHA256 (`lib/auth.ts`), *Role-Based Access Control* (`lib/apoteker-access.ts`), penyimpanan resep kompatibel serverless (`lib/recipe-storage.ts`), dan instansiasi Prisma (`lib/prisma.ts`).

---

## Endpoint REST API (`app/api/*/route.ts`)

| Endpoint | Metode | Role yang Diizinkan | Deskripsi |
|---|---|---|---|
| `/api/obat` | `GET`, `POST` | Semua Role (`GET`), Admin/Apoteker (`POST`) | Mengambil daftar katalog obat & stok terkini; menambah data obat baru secara atomik. |
| `/api/stok` | `GET` | Semua Role | Menampilkan saldo stok real-time dan log riwayat perubahan stok. |
| `/api/transaksi` | `GET` | Semua Role | Mengambil rekap transaksi apotek (untuk staf) atau riwayat transaksi pribadi (untuk pelanggan). |
| `/api/laporan` | `GET` | Owner, Admin, Apoteker | Mengambil metrik ringkasan penjualan, stok minimum, dan arsip laporan. |
| `/api/apoteker/resep/[filename]` | `GET` | Apoteker | Menyajikan dokumen digital resep dokter secara aman (mendukung file lokal, `/tmp`, dan data database). |
| `/api/test-db` | `GET` | Owner, Admin, Apoteker | Verifikasi konektivitas database PostgreSQL dan daftar 18 tabel. |

---

## Cara Menjalankan Secara Lokal

1. Salin file `.env.example` menjadi `.env` dan sesuaikan `DATABASE_URL` serta `AUTH_SECRET`:
   ```bash
   cp .env.example .env
   ```
2. Jalankan container PostgreSQL pada Docker Desktop dan eksekusi skrip `database.sql`.
3. Generate Prisma Client dan jalankan server pengembangan:
   ```bash
   npx prisma generate
   npm run dev
   ```
4. Buka `http://localhost:3000` pada browser.

---

## Deployment (Neon PostgreSQL & Vercel)

1. Buat project database PostgreSQL pada **Neon** dan salin connection string `DATABASE_URL`.
2. Terapkan struktur tabel ke Neon menggunakan `npx prisma db push` dan jalankan `database.sql` pada **Neon SQL Editor**.
3. Hubungkan repository GitHub ke **Vercel**, tambahkan environment variables `DATABASE_URL` dan `AUTH_SECRET`, lalu jalankan *Deploy*.
