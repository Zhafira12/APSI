BEGIN;

DROP TABLE IF EXISTS
  detail_retur_obat,
  detail_resep_obat,
  stok_obat,
  detail_permintaan_obat,
  detail_transaksi,
  obat,
  resep_obat,
  retur_obat,
  permintaan_obat,
  transaksi,
  laporan,
  pelanggan,
  apoteker,
  asisten_apoteker,
  admin,
  owner,
  golongan_obat,
  menu
CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- 1. TABEL MASTER AKTOR
-- =====================================================================
CREATE TABLE menu (
  id_menu INTEGER PRIMARY KEY,
  laporan_id_laporan INTEGER,
  nama_obat VARCHAR(225),
  status VARCHAR(20),
  golongan_obat VARCHAR(225),
  harga_obat NUMERIC(12,2),
  stok_obat INTEGER,
  satuan_obat VARCHAR(225),
  deskripsi VARCHAR(255)
);

CREATE TABLE owner (
  id_pengguna INTEGER PRIMARY KEY,
  menu_id_menu INTEGER,
  nama_pengguna VARCHAR(100) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(225) NOT NULL,
  no_hp VARCHAR(20),
  alamat VARCHAR(225),
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

CREATE TABLE admin (
  id_pengguna INTEGER PRIMARY KEY,
  menu_id_menu INTEGER,
  transaksi_id_transaksi INTEGER,
  retur_obat_id_retur INTEGER,
  nama_pengguna VARCHAR(100) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(225) NOT NULL,
  no_hp VARCHAR(20),
  alamat VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

CREATE TABLE asisten_apoteker (
  id_pengguna INTEGER PRIMARY KEY,
  menu_id_menu INTEGER,
  nama_pengguna VARCHAR(100) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(225) NOT NULL,
  no_hp VARCHAR(20),
  alamat VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

CREATE TABLE apoteker (
  id_pengguna INTEGER PRIMARY KEY,
  menu_id_menu INTEGER,
  nama_pengguna VARCHAR(100) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(225) NOT NULL,
  no_hp VARCHAR(20),
  alamat VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

CREATE TABLE pelanggan (
  id_pengguna INTEGER PRIMARY KEY,
  transaksi_id_transaksi INTEGER,
  menu_id_menu INTEGER,
  nama_pengguna VARCHAR(100) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(225) NOT NULL,
  no_hp VARCHAR(20),
  alamat VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

-- =====================================================================
-- 2. TABEL OPERASIONAL
-- =====================================================================
CREATE TABLE laporan (
  id_laporan INTEGER PRIMARY KEY,
  admin_id_pengguna INTEGER,
  owner_id_pengguna INTEGER,
  asisten_apoteker_id_pengguna INTEGER,
  nama_laporan VARCHAR(100) NOT NULL,
  jenis_laporan VARCHAR(20),
  tanggal_laporan DATE,
  periode_laporan VARCHAR(30),
  isi_laporan VARCHAR(225)
);

CREATE TABLE transaksi (
  id_transaksi INTEGER PRIMARY KEY,
  apoteker_id_pengguna INTEGER,
  tanggal DATE NOT NULL,
  nama_pelanggan VARCHAR(100),
  nama_pengguna VARCHAR(100),
  catatan_obat VARCHAR(225),
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  metode_pembayaran VARCHAR(50),
  status VARCHAR(20),
  laporan_id_laporan INTEGER
);

CREATE TABLE detail_transaksi (
  id_detail_transaksi INTEGER PRIMARY KEY,
  transaksi_id_transaksi INTEGER NOT NULL,
  jumlah INTEGER NOT NULL,
  harga_satuan NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

CREATE TABLE permintaan_obat (
  id_permintaan INTEGER PRIMARY KEY,
  pelanggan_id_pengguna INTEGER,
  tanggal_permintaan DATE,
  status_permintaan VARCHAR(20),
  keterangan VARCHAR(225),
  harga_obat NUMERIC(10,2)
);

CREATE TABLE golongan_obat (
  id_golongan INTEGER PRIMARY KEY,
  nama_golongan VARCHAR(255) NOT NULL,
  deskripsi VARCHAR(255)
);

CREATE TABLE resep_obat (
  id_resep INTEGER PRIMARY KEY,
  apoteker_id_pengguna INTEGER,
  pelanggan_id_pengguna INTEGER,
  tanggal_resep DATE,
  nama_pasien VARCHAR(100),
  nama_dokter VARCHAR(100),
  daftar_obat VARCHAR(225),
  status_validasi VARCHAR(30),
  catatan VARCHAR(225),
  file_resep VARCHAR(500),
  permintaan_obat_id_permintaan INTEGER UNIQUE
);

CREATE TABLE retur_obat (
  id_retur INTEGER PRIMARY KEY,
  pelanggan_id_pengguna INTEGER,
  transaksi_id_transaksi INTEGER,
  apoteker_id_pengguna INTEGER,
  asisten_apoteker_id_pengguna INTEGER,
  tanggal_retur DATE,
  nama_obat_retur VARCHAR(255),
  alasan VARCHAR(255)
);

CREATE TABLE obat (
  id_obat INTEGER PRIMARY KEY,
  golongan_obat_id_golongan INTEGER,
  retur_obat_id_retur INTEGER,
  permintaan_obat_id_permintaan INTEGER,
  apoteker_id_pengguna INTEGER,
  asisten_apoteker_id_pengguna INTEGER,
  transaksi_id_transaksi INTEGER,
  resep_obat_id_resep INTEGER,
  nama_obat VARCHAR(100) NOT NULL,
  harga_beli NUMERIC(10,2) NOT NULL DEFAULT 0,
  harga_jual NUMERIC(10,2) NOT NULL DEFAULT 0,
  stok_minimum INTEGER NOT NULL DEFAULT 0,
  satuan VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Aktif',
  satuan_obat INTEGER
);

CREATE TABLE stok_obat (
  id_stok INTEGER PRIMARY KEY,
  obat_id_obat INTEGER NOT NULL,
  jumlah_stok INTEGER NOT NULL DEFAULT 0,
  tanggal_update DATE,
  keterangan VARCHAR(225)
);

CREATE TABLE detail_permintaan_obat (
  id_detail_permintaan_obat INTEGER PRIMARY KEY,
  permintaan_obat_id_permintaan INTEGER NOT NULL,
  id_obat INTEGER NOT NULL,
  jumlah VARCHAR(30),
  catatan VARCHAR(225)
);

CREATE TABLE detail_resep_obat (
  id_detail_resep INTEGER PRIMARY KEY,
  id_obat INTEGER NOT NULL,
  id_resep INTEGER,
  jumlah VARCHAR(30),
  aturan_pakai VARCHAR(255)
);

CREATE TABLE detail_retur_obat (
  id_detail_retur INTEGER PRIMARY KEY,
  retur_obat_id_retur INTEGER NOT NULL,
  id_obat INTEGER NOT NULL,
  jumlah VARCHAR(50),
  status_retur VARCHAR(20)
);

-- =====================================================================
-- 3. FOREIGN KEY (mengikuti relasi schema.prisma)
-- =====================================================================
ALTER TABLE owner
  ADD CONSTRAINT fk_owner_menu FOREIGN KEY (menu_id_menu)
  REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE admin
  ADD CONSTRAINT fk_admin_menu FOREIGN KEY (menu_id_menu)
  REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_admin_transaksi FOREIGN KEY (transaksi_id_transaksi)
  REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_admin_retur FOREIGN KEY (retur_obat_id_retur)
  REFERENCES retur_obat(id_retur) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE asisten_apoteker
  ADD CONSTRAINT fk_asisten_menu FOREIGN KEY (menu_id_menu)
  REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE apoteker
  ADD CONSTRAINT fk_apoteker_menu FOREIGN KEY (menu_id_menu)
  REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE pelanggan
  ADD CONSTRAINT fk_pelanggan_transaksi FOREIGN KEY (transaksi_id_transaksi)
  REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_pelanggan_menu FOREIGN KEY (menu_id_menu)
  REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE laporan
  ADD CONSTRAINT fk_laporan_admin FOREIGN KEY (admin_id_pengguna)
  REFERENCES admin(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_laporan_owner FOREIGN KEY (owner_id_pengguna)
  REFERENCES owner(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_laporan_asisten FOREIGN KEY (asisten_apoteker_id_pengguna)
  REFERENCES asisten_apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE menu
  ADD CONSTRAINT fk_menu_laporan FOREIGN KEY (laporan_id_laporan)
  REFERENCES laporan(id_laporan) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE transaksi
  ADD CONSTRAINT fk_transaksi_apoteker FOREIGN KEY (apoteker_id_pengguna)
  REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_transaksi_laporan FOREIGN KEY (laporan_id_laporan)
  REFERENCES laporan(id_laporan) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE detail_transaksi
  ADD CONSTRAINT fk_detail_transaksi_header FOREIGN KEY (transaksi_id_transaksi)
  REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE permintaan_obat
  ADD CONSTRAINT fk_permintaan_pelanggan FOREIGN KEY (pelanggan_id_pengguna)
  REFERENCES pelanggan(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE detail_permintaan_obat
  ADD CONSTRAINT fk_detail_permintaan_header FOREIGN KEY (permintaan_obat_id_permintaan)
  REFERENCES permintaan_obat(id_permintaan) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_detail_permintaan_obat FOREIGN KEY (id_obat)
  REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE resep_obat
  ADD CONSTRAINT fk_resep_permintaan FOREIGN KEY (permintaan_obat_id_permintaan)
  REFERENCES permintaan_obat(id_permintaan) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_resep_apoteker FOREIGN KEY (apoteker_id_pengguna)
  REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_resep_pelanggan FOREIGN KEY (pelanggan_id_pengguna)
  REFERENCES pelanggan(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE retur_obat
  ADD CONSTRAINT fk_retur_pelanggan FOREIGN KEY (pelanggan_id_pengguna)
  REFERENCES pelanggan(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_retur_transaksi FOREIGN KEY (transaksi_id_transaksi)
  REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_retur_apoteker FOREIGN KEY (apoteker_id_pengguna)
  REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_retur_asisten FOREIGN KEY (asisten_apoteker_id_pengguna)
  REFERENCES asisten_apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE obat
  ADD CONSTRAINT fk_obat_golongan FOREIGN KEY (golongan_obat_id_golongan)
  REFERENCES golongan_obat(id_golongan) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_obat_retur FOREIGN KEY (retur_obat_id_retur)
  REFERENCES retur_obat(id_retur) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_obat_permintaan FOREIGN KEY (permintaan_obat_id_permintaan)
  REFERENCES permintaan_obat(id_permintaan) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_obat_apoteker FOREIGN KEY (apoteker_id_pengguna)
  REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_obat_asisten FOREIGN KEY (asisten_apoteker_id_pengguna)
  REFERENCES asisten_apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_obat_transaksi FOREIGN KEY (transaksi_id_transaksi)
  REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_obat_resep FOREIGN KEY (resep_obat_id_resep)
  REFERENCES resep_obat(id_resep) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE stok_obat
  ADD CONSTRAINT fk_stok_obat FOREIGN KEY (obat_id_obat)
  REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE detail_resep_obat
  ADD CONSTRAINT fk_detail_resep_obat FOREIGN KEY (id_obat)
  REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_detail_resep_header FOREIGN KEY (id_resep)
  REFERENCES resep_obat(id_resep) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE detail_retur_obat
  ADD CONSTRAINT fk_detail_retur_header FOREIGN KEY (retur_obat_id_retur)
  REFERENCES retur_obat(id_retur) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_detail_retur_obat FOREIGN KEY (id_obat)
  REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE RESTRICT;

-- =====================================================================
-- 4. INDEX
-- =====================================================================
CREATE INDEX idx_laporan_tanggal ON laporan(tanggal_laporan);
CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal);
CREATE INDEX idx_permintaan_tanggal ON permintaan_obat(tanggal_permintaan);
CREATE INDEX idx_resep_tanggal ON resep_obat(tanggal_resep);
CREATE INDEX idx_retur_tanggal ON retur_obat(tanggal_retur);
CREATE INDEX idx_obat_nama ON obat(nama_obat);
CREATE INDEX idx_obat_golongan ON obat(golongan_obat_id_golongan);

-- =====================================================================
-- 5. DATA AWAL (SESUAI DATASET NORMALISASI 3NF MODUL IV)
-- =====================================================================

-- 5.1 Menu
INSERT INTO menu (id_menu, nama_obat, status, deskripsi)
VALUES (1, 'Katalog Obat', 'Aktif', 'Katalog produk Apotek Sri Utama')
ON CONFLICT (id_menu) DO NOTHING;

-- 5.2 Owner
INSERT INTO owner (id_pengguna, menu_id_menu, nama_pengguna, email, username, password_hash, no_hp, alamat, status)
VALUES (1, 1, 'Desyan Nimra', 'desnimra@gmail.com', 'owner', crypt('nimradesyan42', gen_salt('bf', 10)), '081234567890', 'Padang', 'Aktif')
ON CONFLICT (id_pengguna) DO NOTHING;

-- 5.3 Admin
INSERT INTO admin (id_pengguna, menu_id_menu, nama_pengguna, email, username, password_hash, no_hp, alamat, status) VALUES
  (1, 1, 'Zhafira', 'fira@gmail.com', 'admin', crypt('fifir410', gen_salt('bf', 10)), '081234567891', 'Padang', 'Aktif'),
  (2, 1, 'Budi', 'budi@gmail.com', 'budi_admin', crypt('bud421', gen_salt('bf', 10)), '081411484548', 'Padang', 'Aktif'),
  (3, 1, 'Putri', 'putri@gmail.com', 'putri_admin', crypt('tri2545', gen_salt('bf', 10)), '08164481354', 'Padang', 'Aktif'),
  (4, 1, 'Zahra', 'zahra@gmail.com', 'zahra_admin', crypt('zara825', gen_salt('bf', 10)), '08191184148', 'Padang', 'Aktif'),
  (5, 1, 'Siti', 'siti@gmail.com', 'siti_admin', crypt('151siti', gen_salt('bf', 10)), '08916642879', 'Padang', 'Aktif'),
  (6, 1, 'Gardana', 'gardana@gmail.com', 'gardana_admin', crypt('gardana58', gen_salt('bf', 10)), '08164734423', 'Padang', 'Aktif')
ON CONFLICT (id_pengguna) DO NOTHING;

-- 5.4 Asisten Apoteker
INSERT INTO asisten_apoteker (id_pengguna, menu_id_menu, nama_pengguna, email, username, password_hash, no_hp, alamat, status) VALUES
  (1, 1, 'Poppy', 'pipop@gmail.com', 'asisten', crypt('poppyy34', gen_salt('bf', 10)), '081234567893', 'Padang', 'Aktif'),
  (2, 1, 'Judika', 'judika@gmail.com', 'judika', crypt('judka7', gen_salt('bf', 10)), '081832394651', 'Padang', 'Aktif'),
  (3, 1, 'Alex', 'alex@gmail.com', 'alex', crypt('lex29', gen_salt('bf', 10)), '08346331651', 'Padang', 'Aktif'),
  (4, 1, 'Aliyah', 'aliyah@gmail.com', 'aliyah', crypt('liya11222', gen_salt('bf', 10)), '08135487321', 'Padang', 'Aktif'),
  (5, 1, 'Raffa', 'raffa@gmail.com', 'raffa', crypt('raff89', gen_salt('bf', 10)), '08413863418', 'Padang', 'Aktif'),
  (6, 1, 'Salwa', 'salwa@gmail.com', 'salwa', crypt('waa2283', gen_salt('bf', 10)), '08133476434', 'Padang', 'Aktif')
ON CONFLICT (id_pengguna) DO NOTHING;

-- 5.5 Apoteker
INSERT INTO apoteker (id_pengguna, menu_id_menu, nama_pengguna, email, username, password_hash, no_hp, alamat, status) VALUES
  (1, 1, 'Alinda', 'alinda@apotek-sriutama.test', 'alinda', crypt('Apoteker123!', gen_salt('bf', 10)), '081234567800', 'Padang', 'Aktif'),
  (2, 1, 'Deri', 'derri@gmail.com', 'apoteker', crypt('riderr093', gen_salt('bf', 10)), '081234567892', 'Padang', 'Aktif'),
  (3, 1, 'Doni', 'doni@gmail.com', 'doni', crypt('don55', gen_salt('bf', 10)), '08216161116', 'Padang', 'Aktif'),
  (4, 1, 'Ikhsan', 'ikhsan@gmail.com', 'ikhsan', crypt('ikhsan_318', gen_salt('bf', 10)), '08681320163', 'Padang', 'Aktif'),
  (5, 1, 'Farid', 'farid@gmail.com', 'farid', crypt('far11id', gen_salt('bf', 10)), '08642261336', 'Padang', 'Aktif'),
  (6, 1, 'Fikri', 'fikri@gmail.com', 'fikri', crypt('fik558', gen_salt('bf', 10)), '08399857231', 'Padang', 'Aktif'),
  (7, 1, 'Alim', 'alim@gmail.com', 'alim', crypt('rlim584', gen_salt('bf', 10)), '08637922153', 'Padang', 'Aktif')
ON CONFLICT (id_pengguna) DO NOTHING;

-- 5.6 Pelanggan
INSERT INTO pelanggan (id_pengguna, menu_id_menu, nama_pengguna, email, username, password_hash, no_hp, alamat, status) VALUES
  (3, 1, 'Mulan', 'mulan@gmail.com', 'mulan', crypt('mulan123', gen_salt('bf', 10)), '081111111111', 'Jl. Permai No. 5, Padang', 'Aktif'),
  (4, 1, 'Pevita', 'pevita@gmail.com', 'pevita', crypt('pevita123', gen_salt('bf', 10)), '082222222222', 'Jl. Raya Siteba No. 25, Padang', 'Aktif'),
  (5, 1, 'Ibnu', 'ibnu@gmail.com', 'ibnu', crypt('ibnu123', gen_salt('bf', 10)), '085265485358', 'Jl. Raya Balai Gadang No. 8, Padang', 'Aktif'),
  (6, 1, 'Dion', 'dion@gmail.com', 'dion', crypt('dion123', gen_salt('bf', 10)), '085365780957', 'Jl. Andalas No. 19, Padang', 'Aktif'),
  (7, 1, 'Panji', 'panji@gmail.com', 'panji', crypt('panji123', gen_salt('bf', 10)), '083364185456', 'Jl. Ampang No. 12, Padang', 'Aktif'),
  (8, 1, 'Kevin', 'kevin@gmail.com', 'kevin', crypt('kevin123', gen_salt('bf', 10)), '082363233247', 'Jl. Cupak Tangah No. 21, Padang', 'Aktif')
ON CONFLICT (id_pengguna) DO NOTHING;

-- 5.7 Golongan Obat
INSERT INTO golongan_obat (id_golongan, nama_golongan, deskripsi) VALUES
  (1, 'Analgesik', 'Obat pereda nyeri dan demam'),
  (2, 'Antibiotik', 'Obat untuk infeksi bakteri (wajib resep dokter)'),
  (3, 'Vitamin', 'Suplemen vitamin dan daya tahan tubuh'),
  (4, 'Obat batuk dan pilek', 'Membantu meredakan batuk dan flu'),
  (5, 'Antasida', 'Membantu meredakan gejala maag dan asam lambung'),
  (6, 'Antiseptik', 'Antiseptik untuk membantu mencegah infeksi pada luka')
ON CONFLICT (id_golongan) DO NOTHING;

-- 5.8 Obat
INSERT INTO obat (id_obat, golongan_obat_id_golongan, apoteker_id_pengguna, nama_obat, harga_beli, harga_jual, stok_minimum, satuan, status) VALUES
  (1, 1, 1, 'Paracetamol', 3000, 5000, 10, 'Tablet', 'Aktif'),
  (2, 2, 1, 'Amoxicillin', 8000, 12000, 10, 'Kapsul', 'Aktif'),
  (3, 3, 1, 'Vitamin C', 5000, 8000, 10, 'Tablet', 'Aktif'),
  (4, 4, 1, 'OBH', 10000, 15000, 10, 'Botol', 'Aktif'),
  (5, 5, 1, 'Promag', 7000, 10000, 10, 'Tablet', 'Aktif'),
  (6, 6, 1, 'Betadine', 12000, 18000, 5, 'Botol', 'Aktif')
ON CONFLICT (id_obat) DO NOTHING;

-- 5.9 Stok Obat
INSERT INTO stok_obat (id_stok, obat_id_obat, jumlah_stok, tanggal_update, keterangan) VALUES
  (1, 1, 100, '2026-10-18', 'Stok awal Paracetamol'),
  (2, 2, 75, '2026-10-18', 'Stok awal Amoxicillin'),
  (3, 3, 120, '2026-10-18', 'Stok awal Vitamin C'),
  (4, 4, 50, '2026-10-18', 'Stok awal OBH'),
  (5, 5, 80, '2026-10-18', 'Stok awal Promag'),
  (6, 6, 40, '2026-10-18', 'Stok awal Betadine')
ON CONFLICT (id_stok) DO NOTHING;

-- 5.10 Permintaan Obat
INSERT INTO permintaan_obat (id_permintaan, pelanggan_id_pengguna, tanggal_permintaan, status_permintaan, keterangan, harga_obat) VALUES
  (1, 3, '2026-10-18', 'Menunggu', 'Permintaan penambahan stok Paracetamol', 3000),
  (2, 4, '2026-10-18', 'Disetujui', 'Permintaan penambahan stok Amoxicillin', 8000),
  (3, 5, '2026-10-19', 'Diproses', 'Permintaan penambahan stok Vitamin C', 5000),
  (4, 6, '2026-10-20', 'Menunggu', 'Permintaan penambahan stok Amoxicillin', 8000),
  (5, 7, '2026-10-21', 'Disetujui', 'Permintaan penambahan stok Vitamin C', 5000),
  (6, 8, '2026-10-21', 'Diproses', 'Permintaan penambahan stok Vitamin C', 5000)
ON CONFLICT (id_permintaan) DO NOTHING;

INSERT INTO detail_permintaan_obat (id_detail_permintaan_obat, permintaan_obat_id_permintaan, id_obat, jumlah, catatan) VALUES
  (1, 1, 1, '2', 'Paracetamol'),
  (2, 2, 2, '1', 'Amoxicillin'),
  (3, 3, 3, '2', 'Vitamin C'),
  (4, 4, 2, '1', 'Amoxicillin'),
  (5, 5, 3, '1', 'Vitamin C'),
  (6, 6, 3, '1', 'Vitamin C')
ON CONFLICT (id_detail_permintaan_obat) DO NOTHING;

-- 5.11 Resep Obat
INSERT INTO resep_obat (id_resep, apoteker_id_pengguna, pelanggan_id_pengguna, tanggal_resep, nama_pasien, nama_dokter, daftar_obat, status_validasi, catatan, permintaan_obat_id_permintaan) VALUES
  (1, 1, 3, '2026-10-18', 'Mulan', 'Dr. Budi', 'Paracetamol; Amoxicillin', 'Disetujui', 'Resep untuk pasien Mulan', 1),
  (2, 1, 4, '2026-10-18', 'Pevita', 'Dr. Ani', 'Paracetamol; Vitamin C', 'Disetujui', 'Resep untuk pasien Pevita', 2),
  (3, 1, 5, '2026-10-19', 'Ibnu', 'Dr. Ani', 'Amoxicillin; Vitamin C', 'Disetujui', 'Resep untuk pasien Ibnu', 3),
  (4, 1, 6, '2026-10-20', 'Dion', 'Dr. Budi', 'Paracetamol; Vitamin C', 'Disetujui', 'Resep untuk pasien Dion', 4),
  (5, 1, 7, '2026-10-22', 'Panji', 'Dr. Budi', 'Paracetamol', 'Menunggu', 'Menunggu validasi apoteker', 5),
  (6, 1, 8, '2026-10-22', 'Kevin', 'Dr. Ani', 'Amoxicillin; Paracetamol', 'Menunggu', 'Menunggu validasi apoteker', 6)
ON CONFLICT (id_resep) DO NOTHING;

INSERT INTO detail_resep_obat (id_detail_resep, id_obat, id_resep, jumlah, aturan_pakai) VALUES
  (1, 1, 1, '2', '3 x 1 tablet sesudah makan'),
  (2, 2, 1, '1', '3 x 1 kapsul sesudah makan dihabiskan'),
  (3, 1, 2, '1', '3 x 1 tablet'),
  (4, 3, 2, '2', '1 x 1 tablet'),
  (5, 2, 3, '1', '3 x 1 kapsul dihabiskan'),
  (6, 3, 3, '2', '1 x 1 tablet'),
  (7, 1, 4, '3', '3 x 1 tablet'),
  (8, 3, 4, '1', '1 x 1 tablet'),
  (9, 1, 5, '4', '3 x 1 tablet jika demam'),
  (10, 2, 6, '2', '3 x 1 kapsul dihabiskan'),
  (11, 1, 6, '1', '3 x 1 tablet jika demam')
ON CONFLICT (id_detail_resep) DO NOTHING;

-- 5.12 Transaksi Penjualan
INSERT INTO transaksi (id_transaksi, apoteker_id_pengguna, tanggal, nama_pelanggan, nama_pengguna, catatan_obat, total, metode_pembayaran, status) VALUES
  (1, 1, '2026-10-18', 'Mulan', 'Admin', 'Paracetamol; Amoxicillin', 22000, 'Tunai', 'Selesai'),
  (2, 1, '2026-10-18', 'Pevita', 'Apoteker', 'Paracetamol; Vitamin C', 21000, 'QRIS', 'Selesai'),
  (3, 1, '2026-10-19', 'Ibnu', 'Admin', 'Amoxicillin; Vitamin C', 28000, 'Tunai', 'Selesai'),
  (4, 1, '2026-10-19', 'Dion', 'Apoteker', 'Paracetamol; Vitamin C', 23000, 'QRIS', 'Selesai'),
  (5, 1, '2026-10-19', 'Panji', 'Admin', 'Paracetamol', 20000, 'Tunai', 'Selesai'),
  (6, 1, '2026-10-19', 'Kevin', 'Apoteker', 'Amoxicillin; Paracetamol', 29000, 'Transfer', 'Selesai')
ON CONFLICT (id_transaksi) DO NOTHING;

INSERT INTO detail_transaksi (id_detail_transaksi, transaksi_id_transaksi, jumlah, harga_satuan, subtotal) VALUES
  (1, 1, 2, 5000, 10000),
  (2, 1, 1, 12000, 12000),
  (3, 2, 1, 5000, 5000),
  (4, 2, 2, 8000, 16000),
  (5, 3, 1, 12000, 12000),
  (6, 3, 2, 8000, 16000),
  (7, 4, 3, 5000, 15000),
  (8, 4, 1, 8000, 8000),
  (9, 5, 4, 5000, 20000),
  (10, 6, 2, 12000, 24000),
  (11, 6, 1, 5000, 5000)
ON CONFLICT (id_detail_transaksi) DO NOTHING;

-- 5.13 Retur Obat
INSERT INTO retur_obat (id_retur, pelanggan_id_pengguna, transaksi_id_transaksi, apoteker_id_pengguna, asisten_apoteker_id_pengguna, tanggal_retur, nama_obat_retur, alasan) VALUES
  (1, 3, 1, 1, 1, '2026-10-22', 'Paracetamol', 'Kemasan rusak'),
  (2, 4, 2, 1, 1, '2026-10-22', 'Vitamin C', 'Kesalahan pembelian'),
  (3, 5, 3, 1, 1, '2026-10-23', 'Amoxicillin', 'Kemasan rusak'),
  (4, 6, 4, 1, 1, '2026-10-23', 'OBH', 'Produk bocor'),
  (5, 7, 5, 1, 1, '2026-10-23', 'Promag', 'Kesalahan pembelian'),
  (6, 8, 6, 1, 1, '2026-10-24', 'Betadine', 'Segel kemasan rusak')
ON CONFLICT (id_retur) DO NOTHING;

INSERT INTO detail_retur_obat (id_detail_retur, retur_obat_id_retur, id_obat, jumlah, status_retur) VALUES
  (1, 1, 1, '2', 'Diproses'),
  (2, 2, 3, '1', 'Disetujui'),
  (3, 3, 2, '1', 'Diproses'),
  (4, 4, 4, '2', 'Disetujui'),
  (5, 5, 5, '1', 'Ditolak'),
  (6, 6, 6, '1', 'Diproses')
ON CONFLICT (id_detail_retur) DO NOTHING;

-- 5.14 Laporan
INSERT INTO laporan (id_laporan, admin_id_pengguna, owner_id_pengguna, asisten_apoteker_id_pengguna, nama_laporan, jenis_laporan, tanggal_laporan, periode_laporan, isi_laporan) VALUES
  (1, 1, 1, 1, 'Laporan Penjualan 18 Okt', 'Penjualan', '2026-10-18', 'Harian', 'Laporan penjualan harian total Rp 43.000'),
  (2, 1, 1, 1, 'Laporan Stok 18 Okt', 'Stok', '2026-10-18', 'Harian', 'Laporan stok obat harian'),
  (3, 1, 1, 1, 'Laporan Stok 19 Okt', 'Stok', '2026-10-19', 'Harian', 'Laporan stok obat harian'),
  (4, 1, 1, 1, 'Laporan Penjualan 20 Okt', 'Penjualan', '2026-10-20', 'Harian', 'Laporan penjualan harian total Rp 71.000'),
  (5, 1, 1, 1, 'Laporan Penjualan 21 Okt', 'Penjualan', '2026-10-21', 'Harian', 'Laporan penjualan harian'),
  (6, 1, 1, 1, 'Laporan Stok 22 Okt', 'Stok', '2026-10-22', 'Harian', 'Laporan stok obat harian')
ON CONFLICT (id_laporan) DO NOTHING;

COMMIT;

-- =====================================================================
-- 6. CEK DATA SETELAH BERHASIL DIJALANKAN
-- =====================================================================
SELECT id_pengguna, nama_pengguna, username, email, status FROM apoteker;
SELECT id_pengguna, nama_pengguna, username, email, status FROM pelanggan;
SELECT
  o.id_obat,
  o.nama_obat,
  g.nama_golongan,
  o.harga_jual,
  o.satuan,
  s.jumlah_stok
FROM obat o
LEFT JOIN golongan_obat g ON g.id_golongan = o.golongan_obat_id_golongan
LEFT JOIN stok_obat s ON s.obat_id_obat = o.id_obat
ORDER BY o.id_obat;