BEGIN;

-- 1. OWNER
CREATE TABLE owner (
    id_pengguna       INTEGER PRIMARY KEY,
    menu_id_menu      INTEGER,
    nama_pengguna     VARCHAR(100) NOT NULL,
    email             VARCHAR(50) NOT NULL UNIQUE,
    username          VARCHAR(50) NOT NULL UNIQUE,
    password_hash     VARCHAR(225) NOT NULL,
    no_hp             VARCHAR(20),
    alamat            VARCHAR(225),
    status            VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

-- 2. ADMIN
CREATE TABLE admin (
    id_pengguna             INTEGER PRIMARY KEY,
    menu_id_menu            INTEGER,
    transaksi_id_transaksi  INTEGER,
    retur_obat_id_retur     INTEGER,
    nama_pengguna           VARCHAR(100) NOT NULL,
    email                   VARCHAR(50) NOT NULL UNIQUE,
    username                VARCHAR(50) NOT NULL UNIQUE,
    password_hash           VARCHAR(225) NOT NULL,
    no_hp                   VARCHAR(20),
    alamat                  VARCHAR(50),
    status                  VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

-- 3. ASISTEN APOTEKER
CREATE TABLE asisten_apoteker (
    id_pengguna       INTEGER PRIMARY KEY,
    menu_id_menu      INTEGER,
    nama_pengguna     VARCHAR(100) NOT NULL,
    email             VARCHAR(50) NOT NULL UNIQUE,
    username          VARCHAR(50) NOT NULL UNIQUE,
    password_hash     VARCHAR(225) NOT NULL,
    no_hp             VARCHAR(20),
    alamat            VARCHAR(50),
    status            VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

-- 4. APOTEKER
CREATE TABLE apoteker (
    id_pengguna       INTEGER PRIMARY KEY,
    menu_id_menu      INTEGER,
    nama_pengguna     VARCHAR(100) NOT NULL,
    email             VARCHAR(50) NOT NULL UNIQUE,
    username          VARCHAR(50) NOT NULL UNIQUE,
    password_hash     VARCHAR(225) NOT NULL,
    no_hp             VARCHAR(20),
    alamat            VARCHAR(50),
    status            VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

-- 5. PELANGGAN
CREATE TABLE pelanggan (
    id_pengguna             INTEGER PRIMARY KEY,
    transaksi_id_transaksi  INTEGER,
    menu_id_menu            INTEGER,
    nama_pengguna           VARCHAR(100) NOT NULL,
    email                   VARCHAR(50) NOT NULL UNIQUE,
    username                VARCHAR(50) NOT NULL UNIQUE,
    password_hash           VARCHAR(225) NOT NULL,
    no_hp                   VARCHAR(20),
    alamat                  VARCHAR(50),
    status                  VARCHAR(20) NOT NULL DEFAULT 'Aktif'
);

-- 6. LAPORAN
CREATE TABLE laporan (
    id_laporan                     INTEGER PRIMARY KEY,
    admin_id_pengguna              INTEGER,
    owner_id_pengguna              INTEGER,
    asisten_apoteker_id_pengguna   INTEGER,
    nama_laporan                   VARCHAR(100) NOT NULL,
    jenis_laporan                  VARCHAR(20),
    tanggal_laporan                DATE,
    periode_laporan                VARCHAR(30),
    isi_laporan                    VARCHAR(225)
);

-- 7. MENU
CREATE TABLE menu (
    id_menu             INTEGER PRIMARY KEY,
    laporan_id_laporan  INTEGER,
    nama_obat            VARCHAR(225),
    status               VARCHAR(20),
    golongan_obat        VARCHAR(225),
    harga_obat           NUMERIC(12,2),
    stok_obat            INTEGER,
    satuan_obat          VARCHAR(225),
    deskripsi            VARCHAR(255)
);

-- 8. TRANSAKSI
CREATE TABLE transaksi (
    id_transaksi             INTEGER PRIMARY KEY,
    apoteker_id_pengguna     INTEGER,
    tanggal                  DATE NOT NULL,
    nama_pelanggan           VARCHAR(100),
    nama_pengguna            VARCHAR(100),
    catatan_obat             VARCHAR(225),
    total                    NUMERIC(12,2) NOT NULL DEFAULT 0,
    metode_pembayaran        VARCHAR(50),
    status                   VARCHAR(20),
    laporan_id_laporan       INTEGER
);

-- 9. DETAIL TRANSAKSI
CREATE TABLE detail_transaksi (
    id_detail_transaksi  INTEGER PRIMARY KEY,
    transaksi_id_transaksi INTEGER NOT NULL,
    jumlah               INTEGER NOT NULL,
    harga_satuan         NUMERIC(10,2) NOT NULL,
    subtotal             NUMERIC(10,2) NOT NULL
);

-- 10. PERMINTAAN OBAT
CREATE TABLE permintaan_obat (
    id_permintaan           INTEGER PRIMARY KEY,
    pelanggan_id_pengguna   INTEGER,
    tanggal_permintaan      DATE,
    status_permintaan       VARCHAR(20),
    keterangan              VARCHAR(225),
    harga_obat              NUMERIC(10,2)
);

-- 11. DETAIL PERMINTAAN OBAT
CREATE TABLE detail_permintaan_obat (
    id_detail_permintaan_obat  INTEGER PRIMARY KEY,
    permintaan_obat_id_permintaan INTEGER NOT NULL,
    id_obat                    INTEGER NOT NULL,
    jumlah                     VARCHAR(30),
    catatan                    VARCHAR(225)
);

-- 12. GOLONGAN OBAT
CREATE TABLE golongan_obat (
    id_golongan   INTEGER PRIMARY KEY,
    nama_golongan VARCHAR(255) NOT NULL,
    deskripsi     VARCHAR(255)
);

-- 13. RESEP OBAT
CREATE TABLE resep_obat (
    id_resep                 INTEGER PRIMARY KEY,
    apoteker_id_pengguna     INTEGER,
    pelanggan_id_pengguna    INTEGER,
    permintaan_obat_id_permintaan INTEGER UNIQUE,
    tanggal_resep            DATE,
    nama_pasien              VARCHAR(100),
    nama_dokter              VARCHAR(100),
    daftar_obat              VARCHAR(225),
    status_validasi          VARCHAR(30),
    catatan                  VARCHAR(225)
);

-- 14. RETUR OBAT
CREATE TABLE retur_obat (
    id_retur                    INTEGER PRIMARY KEY,
    pelanggan_id_pengguna       INTEGER,
    transaksi_id_transaksi     INTEGER,
    apoteker_id_pengguna       INTEGER,
    asisten_apoteker_id_pengguna INTEGER,
    tanggal_retur              DATE,
    nama_obat_retur            VARCHAR(255),
    alasan                     VARCHAR(255)
);

-- 15. OBAT
CREATE TABLE obat (
    id_obat                       INTEGER PRIMARY KEY,
    golongan_obat_id_golongan     INTEGER,
    retur_obat_id_retur           INTEGER,
    permintaan_obat_id_permintaan INTEGER,
    apoteker_id_pengguna          INTEGER,
    asisten_apoteker_id_pengguna  INTEGER,
    transaksi_id_transaksi        INTEGER,
    resep_obat_id_resep           INTEGER,
    nama_obat                     VARCHAR(100) NOT NULL,
    harga_beli                    NUMERIC(10,2) NOT NULL DEFAULT 0,
    harga_jual                    NUMERIC(10,2) NOT NULL DEFAULT 0,
    stok_minimum                  INTEGER NOT NULL DEFAULT 0,
    satuan                        VARCHAR(20),
    status                        VARCHAR(20) DEFAULT 'Aktif',
    satuan_obat                   INTEGER
);

-- 16. STOK OBAT
CREATE TABLE stok_obat (
    id_stok        INTEGER PRIMARY KEY,
    obat_id_obat   INTEGER NOT NULL,
    jumlah_stok    INTEGER NOT NULL DEFAULT 0,
    tanggal_update DATE,
    keterangan     VARCHAR(225)
);

-- 17. DETAIL RESEP OBAT
CREATE TABLE detail_resep_obat (
    id_detail_resep  INTEGER PRIMARY KEY,
    id_obat          INTEGER NOT NULL,
    jumlah           VARCHAR(30),
    aturan_pakai     VARCHAR(255)
);

-- 18. DETAIL RETUR OBAT
CREATE TABLE detail_retur_obat (
    id_detail_retur  INTEGER PRIMARY KEY,
    retur_obat_id_retur INTEGER NOT NULL,
    id_obat          INTEGER NOT NULL,
    jumlah           VARCHAR(50),
    status_retur     VARCHAR(20)
);

ALTER TABLE owner
    ADD CONSTRAINT fk_owner_menu FOREIGN KEY (menu_id_menu) REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE admin
    ADD CONSTRAINT fk_admin_menu FOREIGN KEY (menu_id_menu) REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_admin_transaksi FOREIGN KEY (transaksi_id_transaksi) REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_admin_retur FOREIGN KEY (retur_obat_id_retur) REFERENCES retur_obat(id_retur) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE asisten_apoteker
    ADD CONSTRAINT fk_asisten_menu FOREIGN KEY (menu_id_menu) REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE apoteker
    ADD CONSTRAINT fk_apoteker_menu FOREIGN KEY (menu_id_menu) REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE pelanggan
    ADD CONSTRAINT fk_pelanggan_transaksi FOREIGN KEY (transaksi_id_transaksi) REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_pelanggan_menu FOREIGN KEY (menu_id_menu) REFERENCES menu(id_menu) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE laporan
    ADD CONSTRAINT fk_laporan_admin FOREIGN KEY (admin_id_pengguna) REFERENCES admin(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_laporan_owner FOREIGN KEY (owner_id_pengguna) REFERENCES owner(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_laporan_asisten FOREIGN KEY (asisten_apoteker_id_pengguna) REFERENCES asisten_apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE menu
    ADD CONSTRAINT fk_menu_laporan FOREIGN KEY (laporan_id_laporan) REFERENCES laporan(id_laporan) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE transaksi
    ADD CONSTRAINT fk_transaksi_apoteker FOREIGN KEY (apoteker_id_pengguna) REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_transaksi_laporan FOREIGN KEY (laporan_id_laporan) REFERENCES laporan(id_laporan) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE detail_transaksi
    ADD CONSTRAINT fk_detail_transaksi_header FOREIGN KEY (transaksi_id_transaksi) REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE permintaan_obat
    ADD CONSTRAINT fk_permintaan_pelanggan FOREIGN KEY (pelanggan_id_pengguna) REFERENCES pelanggan(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE detail_permintaan_obat
    ADD CONSTRAINT fk_detail_permintaan_header FOREIGN KEY (permintaan_obat_id_permintaan) REFERENCES permintaan_obat(id_permintaan) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT fk_detail_permintaan_obat FOREIGN KEY (id_obat) REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE resep_obat
    ADD CONSTRAINT fk_resep_apoteker FOREIGN KEY (apoteker_id_pengguna) REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_resep_pelanggan FOREIGN KEY (pelanggan_id_pengguna) REFERENCES pelanggan(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_resep_permintaan FOREIGN KEY (permintaan_obat_id_permintaan) REFERENCES permintaan_obat(id_permintaan) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE retur_obat
    ADD CONSTRAINT fk_retur_pelanggan FOREIGN KEY (pelanggan_id_pengguna) REFERENCES pelanggan(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_retur_transaksi FOREIGN KEY (transaksi_id_transaksi) REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_retur_apoteker FOREIGN KEY (apoteker_id_pengguna) REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_retur_asisten FOREIGN KEY (asisten_apoteker_id_pengguna) REFERENCES asisten_apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE obat
    ADD CONSTRAINT fk_obat_golongan FOREIGN KEY (golongan_obat_id_golongan) REFERENCES golongan_obat(id_golongan) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_obat_retur FOREIGN KEY (retur_obat_id_retur) REFERENCES retur_obat(id_retur) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_obat_permintaan FOREIGN KEY (permintaan_obat_id_permintaan) REFERENCES permintaan_obat(id_permintaan) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_obat_apoteker FOREIGN KEY (apoteker_id_pengguna) REFERENCES apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_obat_asisten FOREIGN KEY (asisten_apoteker_id_pengguna) REFERENCES asisten_apoteker(id_pengguna) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_obat_transaksi FOREIGN KEY (transaksi_id_transaksi) REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_obat_resep FOREIGN KEY (resep_obat_id_resep) REFERENCES resep_obat(id_resep) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE stok_obat
    ADD CONSTRAINT fk_stok_obat FOREIGN KEY (obat_id_obat) REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE detail_resep_obat
    ADD CONSTRAINT fk_detail_resep_obat FOREIGN KEY (id_obat) REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE detail_retur_obat
    ADD CONSTRAINT fk_detail_retur_header FOREIGN KEY (retur_obat_id_retur) REFERENCES retur_obat(id_retur) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT fk_detail_retur_obat FOREIGN KEY (id_obat) REFERENCES obat(id_obat) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Index tambahan untuk kolom relasi yang sering dipakai saat JOIN.
CREATE INDEX idx_laporan_tanggal ON laporan(tanggal_laporan);
CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal);
CREATE INDEX idx_permintaan_tanggal ON permintaan_obat(tanggal_permintaan);
CREATE INDEX idx_resep_tanggal ON resep_obat(tanggal_resep);
CREATE INDEX idx_retur_tanggal ON retur_obat(tanggal_retur);
CREATE INDEX idx_obat_nama ON obat(nama_obat);
CREATE INDEX idx_obat_golongan ON obat(golongan_obat_id_golongan);

COMMIT;

