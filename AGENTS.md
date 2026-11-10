# DOKUMENTASI KONTEKS PENGEMBANGAN DAN AGENTIC PROGRAMMING (MODUL IV)
## SISTEM INFORMASI APOTEK SRI UTAMA
**Laboratorium Sistem Informasi dan Keputusan (LSIK) - Departemen Teknik Industri Universitas Andalas**

---

### 1. Rekayasa Konteks (Context Engineering) - Kerangka CFC

#### A. Context (Konteks Sistem dan Lingkungan Pengembangan)
- **Nama Sistem**: Sistem Informasi Apotek Sri Utama
- **Domain Aplikasi**: Pelayanan kefarmasian, manajemen inventaris obat, validasi resep dokter, kasir/transaksi penjualan (POS), dan pelaporan apotek.
- **Teknologi & Stack Pengembangan**:
  - **Framework Web**: Next.js 16.4 (App Router, Route Handlers `app/api/*/route.ts`, Server Actions, Server Components, Streaming SSR).
  - **Library UI / Bahasa**: React 19, TypeScript 5, Tailwind CSS 4.
  - **Desain Antarmuka & Prototipe**: Rancangan UI Modul 3 diintegrasikan melalui **Figma MCP Server** dan **GitHub Copilot** untuk ekstraksi palet warna hijau medis (`#0F766E`), tipografi, kartu katalog obat, sidebar navigasi apoteker, dan form validasi resep sesuai prinsip *Usability Heuristics* (Jakob Nielsen).
  - **Basis Data & ORM**: PostgreSQL RDBMS (18 tabel terintegrasi), Prisma ORM 7.10 (Driver Adapter `@prisma/adapter-pg`, skema diintrospeksi via `npx prisma db pull`).
  - **Environment Database**: Docker Desktop (PostgreSQL lokal saat pengembangan) dan Neon Serverless PostgreSQL (Cloud Database untuk deployment).
  - **Keamanan & Autentikasi**: Cookie sesi HTTP-Only yang ditandatangani dengan HMAC-SHA256 (`AUTH_SECRET`), hashing password dengan `bcryptjs` dan `pgcrypto` (`gen_salt('bf')`), verifikasi *timing-safe* (`timingSafeEqual`), serta *Role-Based Access Control* (RBAC) penuh untuk 4 role utama (**Owner, Admin, Apoteker, Pelanggan**).
  - **Deployment Target**: Vercel (Production Web Hosting di `https://apsi-mocha.vercel.app/`) terintegrasi dengan GitHub repository (`https://github.com/Zhafira12/APSI`) dan database cloud Neon.

#### B. Feature (Fitur Utama dan Alur Fungsional Sistem)
1. **Autentikasi Terpadu Multi-Role Sesuai Permission Matrix**:
   - Login terpadu bagi **Owner**, **Admin**, **Apoteker** (serta Asisten Apoteker), dan **Pelanggan** dengan deteksi otomatis role pengguna dan navigasi yang menyesuaikan matriks hak akses (`Permission_Matrix_Apotek_Sri_Utama.xlsx`).
   - Pendaftaran mandiri akun pelanggan baru melalui form registrasi (`/register`) dengan validasi keunikan username dan email lintas tabel pengguna.
2. **Katalog Obat & Monitoring Stok Real-Time**:
   - Menampilkan daftar produk farmasi, golongan obat, satuan obat, harga jual, dan status stok.
   - **Admin** dan **Apoteker** dapat melakukan tambah/ubah data obat (CRUD) serta penyesuaian penerimaan stok, sedangkan **Owner** mengakses tampilan inventaris secara *read-only*.
3. **Portal Pelanggan & Pengajuan Permintaan Obat**:
   - Pencarian dan filter obat berdasarkan golongan/nama obat di `/pelanggan`.
   - Form pengajuan pesanan obat dengan pilihan metode pembayaran (QRIS / Tunai).
   - Pengunggahan berkas digital resep dokter (JPG, PNG, PDF maks 5 MB) untuk pembelian obat keras atau antibiotik, dilengkapi metadata nama dokter dan tanggal resep yang kompatibel penuh dengan lingkungan serverless Vercel.
4. **Validasi dan Peninjauan Resep Dokter oleh Apoteker**:
   - Daftar antrean resep dengan status *Menunggu*, *Disetujui*, atau *Ditolak* khusus untuk role **Apoteker**.
   - Antarmuka inspeksi berkas resep terproteksi melalui endpoint API khusus (`/api/apoteker/resep/[filename]`).
   - Aksi approval/rejeksi resep oleh Apoteker disertai catatan instruksi pemakaian obat atau alasan penolakan.
5. **Point of Sale (POS) Kasir Penjualan Langsung**:
   - Form transaksi kasir apotek (`/apoteker/transaksi`) bagi **Admin** dan **Apoteker** dengan pemilihan obat, kuantitas, kalkulasi otomatis subtotal dan total biaya.
   - Pemotongan stok otomatis secara atomik (*atomic transaction*) pada tabel `stok_obat`.
   - Riwayat transaksi lengkap beserta tampilan struk/nota digital siap cetak.
6. **Laporan & Dashboard Metrik Operasional**:
   - Dashboard ringkasan dan halaman laporan (`/apoteker/laporan`) bagi **Owner**, **Admin**, dan **Apoteker**: total penjualan, stok kritis, resep pending, transaksi terbaru, dan rekap laporan tersimpan.

#### C. Constraint (Batasan Teknis dan Aturan Bisnis / Business Rules)
1. **Integritas Referensial & Properti ACID**:
   - Skema basis data menerapkan relasi foreign key dengan aturan aksi referensial yang tepat (`ON UPDATE CASCADE`, `ON DELETE CASCADE/RESTRICT/SET NULL`).
   - Setiap mutasi transaksi dan pemotongan stok wajib dijalankan dalam satu blok `prisma.$transaction` dengan locking tabel (`EXCLUSIVE MODE`) guna mencegah *race condition* dan inkonsistensi stok minus.
2. **Access Control & Matriks Hak Akses (Permission Matrix)**:
   - **Owner**: Akses baca (*Read-Only*) ke Dashboard, Katalog Obat, Stok Obat, Riwayat Transaksi, dan Laporan Penjualan & Stok. Tidak dapat melakukan CRUD obat, update stok, validasi resep, atau input POS.
   - **Admin**: Akses penuh ke Dashboard, CRUD Katalog Obat, Update Stok, Daftar Permintaan Pelanggan, Kasir POS, Riwayat Transaksi, dan Laporan. Tidak dapat memvalidasi/menginspeksi resep dokter.
   - **Apoteker**: Akses penuh ke Validasi & Inspeksi Resep Dokter, Katalog Obat, Stok Obat, Permintaan Obat, Kasir POS, Riwayat Transaksi, dan Laporan.
   - **Pelanggan**: Hanya dapat mengakses Portal Pelanggan (`/pelanggan`), mengajukan pesanan, mengunggah resep dokter, dan melihat riwayat transaksi miliknya sendiri.
3. **Validasi Input & Kompatibilitas Cloud Serverless**:
   - Kuantitas pesanan tidak boleh melebihi stok fisik yang tersedia di database.
   - Berkas resep dibatasi hanya tipe MIME `image/jpeg`, `image/png`, dan `application/pdf` dengan batas ukuran maksimal 5 MB dan disimpan menggunakan lapisan abstraksi `lib/recipe-storage.ts` agar bekerja baik di filesystem lokal maupun serverless Vercel (`/tmp` & database fallback).
4. **Pemisahan Perhatian (Separation of Concerns)**:
   - *Data Storage*: RDBMS PostgreSQL (Neon Cloud / Docker).
   - *Data Access Layer*: Prisma ORM (`app/generated/prisma` via `lib/prisma.ts`).
   - *Application & Business Logic*: Next.js Route Handlers (`app/api/*/route.ts`) dan Server Actions.
   - *Presentation Logic*: React Server/Client Components dengan styling konsisten sesuai prototipe Figma.

---

### 2. Catatan Prompt Penting Pengembangan (Agentic Programming Log)

| Tahap Instruksi Kerja | Prompt (Kerangka Context–Feature–Constraint / CFC) | Hasil Implementasi & Verifikasi |
|---|---|---|
| **Tahap A & B: Persiapan & Implementasi Database (Langkah 1–9)** | **Context**: Sistem Informasi Apotek Sri Utama (Modul 4 APSI) menggunakan PostgreSQL dan Prisma ORM.<br>**Feature**: Rancang DDL `database.sql` berdasarkan ERD 18 tabel (`menu`, `owner`, `admin`, `asisten_apoteker`, `apoteker`, `pelanggan`, `golongan_obat`, `obat`, `stok_obat`, `permintaan_obat`, `detail_permintaan_obat`, `resep_obat`, `detail_resep_obat`, `transaksi`, `detail_transaksi`, `retur_obat`, `detail_retur_obat`, `laporan`) beserta seed data awal, lalu jalankan introspeksi `npx prisma db pull`.<br>**Constraint**: Terapkan PK, FK (`ON UPDATE CASCADE`, `ON DELETE RESTRICT/CASCADE/SET NULL`), index tanggal, dan hash password menggunakan bcrypt (`pgcrypto`). | File `database.sql` dan `prisma/schema.prisma` memuat tepat 18 model terintegrasi dengan relasi yang terverifikasi di Prisma Studio. |
| **Tahap C: Implementasi Prototype Figma / Frontend (Langkah 10–13)** | **Context**: Rancangan UI prototipe Figma Apotek Sri Utama dihubungkan ke VS Code melalui **Figma MCP Server** dan **GitHub Copilot**.<br>**Feature**: Ekstrak struktur layout, komponen kartu obat, tabel antrean resep, halaman login/register (`/login`, `/register`), portal pelanggan (`/pelanggan`), serta dashboard staf (`/`, `/apoteker/*`) menggunakan Next.js App Router.<br>**Constraint**: Tampilan harus konsisten dengan prototipe Figma (identitas visual hijau medis Apotek Sri Utama, navigasi jelas, status pill warna semantik, dan memenuhi 10 *Usability Heuristics* Nielsen). | Seluruh halaman frontend di folder `/app` terbangun secara responsif, konsisten dengan prototipe Figma, dan terverifikasi pada `localhost:3000`. |
| **Tahap D (Bagian 1): Implementasi REST API Route Handlers (Langkah 14–15)** | **Context**: Integrasi komunikasi client–server pada Next.js App Router menggunakan Route Handlers (`route.ts`) dan Prisma Client.<br>**Feature**: Buat endpoint REST API di `app/api/obat/route.ts`, `app/api/stok/route.ts`, `app/api/transaksi/route.ts`, `app/api/laporan/route.ts`, `app/api/apoteker/resep/[filename]/route.ts`, dan `app/api/test-db/route.ts`.<br>**Constraint**: Setiap endpoint wajib memeriksa sesi autentikasi dan otorisasi role berdasarkan *Permission Matrix* sebelum mengeksekusi query ke PostgreSQL. | Endpoint `route.ts` berhasil melayani operasi data berformat JSON dan penyajian dokumen resep dengan proteksi RBAC ketat. |
| **Tahap D (Bagian 2): Autentikasi Multi-Role, RBAC & Business Logic (Langkah 14–17)** | **Context**: Mekanisme keamanan sistem informasi apotek dengan 4 role pada `Permission_Matrix_Apotek_Sri_Utama.xlsx` (`Owner`, `Admin`, `Apoteker`, `Pelanggan`).<br>**Feature**: Implementasikan sesi cookie HMAC-SHA256 di `lib/auth.ts`, pemeriksaan multi-role di `app/login/actions.ts` dan `lib/apoteker-access.ts`, alur pengajuan permintaan obat & unggah resep di `app/pelanggan/actions.ts`, validasi resep oleh Apoteker, serta transaksi Kasir POS di `app/apoteker/actions.ts`.<br>**Constraint**: Pemotongan stok wajib atomik di dalam `prisma.$transaction` dengan `LOCK TABLE ... IN EXCLUSIVE MODE`; obat golongan keras/antibiotik wajib memiliki resep berstatus `Disetujui` sebelum ditransaksikan. | Keempat role dapat login sesuai hak aksesnya di matriks;3 use case utama lintas role berjalan end-to-end tanpa *race condition*. |
| **Tahap E: Persiapan & Verifikasi Deployment Cloud (Langkah 18–22)** | **Context**: Deployment produksi Sistem Informasi Apotek Sri Utama ke cloud database **Neon PostgreSQL** dan hosting **Vercel**.<br>**Feature**: Buat `.env.example`, abstraksi penyimpanan lampiran resep `lib/recipe-storage.ts` agar kompatibel dengan filesystem serverless Vercel, sinkronkan skema dengan `npx prisma db push`, dan pastikan `npm run build` berjalan bersih.<br>**Constraint**: Jangan mengekspos kredensial `.env` ke repositori; fitur unggah dan inspeksi resep harus tetap berfungsi di lingkungan serverless. | Build produksi Next.js berhasil tanpa error, skema 18 tabel aktif di Neon PostgreSQL, dan aplikasi telah live serta terverifikasi di `https://apsi-mocha.vercel.app/`. |
| **Penyesuaian Navigasi Sidebar Sesuai Prototype Figma** | **Context**: Sidebar dashboard pada aplikasi Apotek Sri Utama perlu disesuaikan persis dengan prototype Figma untuk membedakan navigasi Apoteker dan Pelanggan.<br>**Feature**: Buat konfigurasi menu terpusat di `lib/navigation.ts` (`SIDEBAR_MENU_BY_ROLE`) untuk Apoteker (5 menu: `Beranda`, `Validasi Resep`, `Data Obat`, `Laporan`, `Stok Obat`) dan Pelanggan (4 menu: `Beranda`, `Cari Obat`, `Resep Saya`, `Riwayat Transaksi`), perbarui `app/apoteker-shell.tsx` dan `app/pelanggan/page.tsx`.<br>**Constraint**: Pertahankan gaya visual hijau tua (`#005b35`), item aktif hijau terang (`#087443`), ikon outline putih, satu tombol logout di bagian bawah sidebar, proteksi route antar-role (redirect ke Beranda masing-masing), serta jangan menghapus halaman/API yang dilepas dari sidebar. | Sidebar Apoteker (5 menu) dan Pelanggan (4 menu) tampil persis sesuai prototype Figma dengan konfigurasi terpusat di `lib/navigation.ts`. |
| **Perbaikan Kontras Warna & Layout Satu Baris Label Sidebar** | **Context**: Pada sidebar Pelanggan, aturan warisan `.customer-nav-link span { width: 20px; color: #739080 }` dan `.customer-nav-link.active span { color: #087443 }` di `app/globals.css` menimpa elemen `<span>` pembungkus teks label sehingga teks item aktif menyatu dengan latar `#087443`, item non-aktif tampak pudar, dan label terpecah menjadi dua baris.<br>**Feature**: Hapus aturan warisan `.customer-nav-link span` yang membatasi lebar `20px` dan warna hijau pudar, serta satukan styling `.pharmacist-nav-link` dan `.customer-nav-link` (beserta `span` dan `svg` di dalamnya) pada seluruh state (`:link`, `:visited`, `:hover`, `:focus`, `:active`, `.active`).<br>**Constraint**: Pastikan seluruh teks dan ikon berwarna putih (`#ffffff`), item aktif tetap berlatar `#087443` di atas sidebar `#005b35`, dan label tampil satu baris (`white-space: nowrap`) tanpa terpotong. | Seluruh label dan ikon sidebar Pelanggan maupun Apoteker tampil putih tajam (`#ffffff`) dan satu baris utuh di semua state. |

---

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
