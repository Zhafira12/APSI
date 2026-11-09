-- CreateTable
CREATE TABLE "transaksi" (
    "id_transaksi" INTEGER NOT NULL,
    "apoteker_id_pengguna" INTEGER,
    "tanggal" DATE NOT NULL,
    "nama_pelanggan" VARCHAR(100),
    "nama_pengguna" VARCHAR(100),
    "catatan_obat" VARCHAR(225),
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metode_pembayaran" VARCHAR(50),
    "status" VARCHAR(20),
    "laporan_id_laporan" INTEGER,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id_transaksi")
);

-- CreateTable
CREATE TABLE "admin" (
    "id_pengguna" INTEGER NOT NULL,
    "menu_id_menu" INTEGER,
    "transaksi_id_transaksi" INTEGER,
    "retur_obat_id_retur" INTEGER,
    "nama_pengguna" VARCHAR(100) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(225) NOT NULL,
    "no_hp" VARCHAR(20),
    "alamat" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Aktif',

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id_pengguna")
);

-- CreateTable
CREATE TABLE "apoteker" (
    "id_pengguna" INTEGER NOT NULL,
    "menu_id_menu" INTEGER,
    "nama_pengguna" VARCHAR(100) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(225) NOT NULL,
    "no_hp" VARCHAR(20),
    "alamat" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Aktif',

    CONSTRAINT "apoteker_pkey" PRIMARY KEY ("id_pengguna")
);

-- CreateTable
CREATE TABLE "asisten_apoteker" (
    "id_pengguna" INTEGER NOT NULL,
    "menu_id_menu" INTEGER,
    "nama_pengguna" VARCHAR(100) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(225) NOT NULL,
    "no_hp" VARCHAR(20),
    "alamat" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Aktif',

    CONSTRAINT "asisten_apoteker_pkey" PRIMARY KEY ("id_pengguna")
);

-- CreateTable
CREATE TABLE "detail_permintaan_obat" (
    "id_detail_permintaan_obat" INTEGER NOT NULL,
    "permintaan_obat_id_permintaan" INTEGER NOT NULL,
    "id_obat" INTEGER NOT NULL,
    "jumlah" VARCHAR(30),
    "catatan" VARCHAR(225),

    CONSTRAINT "detail_permintaan_obat_pkey" PRIMARY KEY ("id_detail_permintaan_obat")
);

-- CreateTable
CREATE TABLE "detail_resep_obat" (
    "id_detail_resep" INTEGER NOT NULL,
    "id_obat" INTEGER NOT NULL,
    "jumlah" VARCHAR(30),
    "aturan_pakai" VARCHAR(255),

    CONSTRAINT "detail_resep_obat_pkey" PRIMARY KEY ("id_detail_resep")
);

-- CreateTable
CREATE TABLE "detail_retur_obat" (
    "id_detail_retur" INTEGER NOT NULL,
    "retur_obat_id_retur" INTEGER NOT NULL,
    "id_obat" INTEGER NOT NULL,
    "jumlah" VARCHAR(50),
    "status_retur" VARCHAR(20),

    CONSTRAINT "detail_retur_obat_pkey" PRIMARY KEY ("id_detail_retur")
);

-- CreateTable
CREATE TABLE "detail_transaksi" (
    "id_detail_transaksi" INTEGER NOT NULL,
    "transaksi_id_transaksi" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga_satuan" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detail_transaksi_pkey" PRIMARY KEY ("id_detail_transaksi")
);

-- CreateTable
CREATE TABLE "golongan_obat" (
    "id_golongan" INTEGER NOT NULL,
    "nama_golongan" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(255),

    CONSTRAINT "golongan_obat_pkey" PRIMARY KEY ("id_golongan")
);

-- CreateTable
CREATE TABLE "laporan" (
    "id_laporan" INTEGER NOT NULL,
    "admin_id_pengguna" INTEGER,
    "owner_id_pengguna" INTEGER,
    "asisten_apoteker_id_pengguna" INTEGER,
    "nama_laporan" VARCHAR(100) NOT NULL,
    "jenis_laporan" VARCHAR(20),
    "tanggal_laporan" DATE,
    "periode_laporan" VARCHAR(30),
    "isi_laporan" VARCHAR(225),

    CONSTRAINT "laporan_pkey" PRIMARY KEY ("id_laporan")
);

-- CreateTable
CREATE TABLE "menu" (
    "id_menu" INTEGER NOT NULL,
    "laporan_id_laporan" INTEGER,
    "nama_obat" VARCHAR(225),
    "status" VARCHAR(20),
    "golongan_obat" VARCHAR(225),
    "harga_obat" DECIMAL(12,2),
    "stok_obat" INTEGER,
    "satuan_obat" VARCHAR(225),
    "deskripsi" VARCHAR(255),

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id_menu")
);

-- CreateTable
CREATE TABLE "obat" (
    "id_obat" INTEGER NOT NULL,
    "golongan_obat_id_golongan" INTEGER,
    "retur_obat_id_retur" INTEGER,
    "permintaan_obat_id_permintaan" INTEGER,
    "apoteker_id_pengguna" INTEGER,
    "asisten_apoteker_id_pengguna" INTEGER,
    "transaksi_id_transaksi" INTEGER,
    "resep_obat_id_resep" INTEGER,
    "nama_obat" VARCHAR(100) NOT NULL,
    "harga_beli" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "harga_jual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stok_minimum" INTEGER NOT NULL DEFAULT 0,
    "satuan" VARCHAR(20),
    "status" VARCHAR(20) DEFAULT 'Aktif',
    "satuan_obat" INTEGER,

    CONSTRAINT "obat_pkey" PRIMARY KEY ("id_obat")
);

-- CreateTable
CREATE TABLE "owner" (
    "id_pengguna" INTEGER NOT NULL,
    "menu_id_menu" INTEGER,
    "nama_pengguna" VARCHAR(100) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(225) NOT NULL,
    "no_hp" VARCHAR(20),
    "alamat" VARCHAR(225),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Aktif',

    CONSTRAINT "owner_pkey" PRIMARY KEY ("id_pengguna")
);

-- CreateTable
CREATE TABLE "pelanggan" (
    "id_pengguna" INTEGER NOT NULL,
    "transaksi_id_transaksi" INTEGER,
    "menu_id_menu" INTEGER,
    "nama_pengguna" VARCHAR(100) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(225) NOT NULL,
    "no_hp" VARCHAR(20),
    "alamat" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Aktif',

    CONSTRAINT "pelanggan_pkey" PRIMARY KEY ("id_pengguna")
);

-- CreateTable
CREATE TABLE "permintaan_obat" (
    "id_permintaan" INTEGER NOT NULL,
    "pelanggan_id_pengguna" INTEGER,
    "tanggal_permintaan" DATE,
    "status_permintaan" VARCHAR(20),
    "keterangan" VARCHAR(225),
    "harga_obat" DECIMAL(10,2),

    CONSTRAINT "permintaan_obat_pkey" PRIMARY KEY ("id_permintaan")
);

-- CreateTable
CREATE TABLE "resep_obat" (
    "id_resep" INTEGER NOT NULL,
    "apoteker_id_pengguna" INTEGER,
    "pelanggan_id_pengguna" INTEGER,
    "tanggal_resep" DATE,
    "nama_pasien" VARCHAR(100),
    "nama_dokter" VARCHAR(100),
    "daftar_obat" VARCHAR(225),
    "status_validasi" VARCHAR(30),
    "catatan" VARCHAR(225),

    CONSTRAINT "resep_obat_pkey" PRIMARY KEY ("id_resep")
);

-- CreateTable
CREATE TABLE "retur_obat" (
    "id_retur" INTEGER NOT NULL,
    "pelanggan_id_pengguna" INTEGER,
    "transaksi_id_transaksi" INTEGER,
    "apoteker_id_pengguna" INTEGER,
    "asisten_apoteker_id_pengguna" INTEGER,
    "tanggal_retur" DATE,
    "nama_obat_retur" VARCHAR(255),
    "alasan" VARCHAR(255),

    CONSTRAINT "retur_obat_pkey" PRIMARY KEY ("id_retur")
);

-- CreateTable
CREATE TABLE "stok_obat" (
    "id_stok" INTEGER NOT NULL,
    "obat_id_obat" INTEGER NOT NULL,
    "jumlah_stok" INTEGER NOT NULL DEFAULT 0,
    "tanggal_update" DATE,
    "keterangan" VARCHAR(225),

    CONSTRAINT "stok_obat_pkey" PRIMARY KEY ("id_stok")
);

-- CreateIndex
CREATE INDEX "idx_transaksi_tanggal" ON "transaksi"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_username_key" ON "admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "apoteker_email_key" ON "apoteker"("email");

-- CreateIndex
CREATE UNIQUE INDEX "apoteker_username_key" ON "apoteker"("username");

-- CreateIndex
CREATE UNIQUE INDEX "asisten_apoteker_email_key" ON "asisten_apoteker"("email");

-- CreateIndex
CREATE UNIQUE INDEX "asisten_apoteker_username_key" ON "asisten_apoteker"("username");

-- CreateIndex
CREATE INDEX "idx_laporan_tanggal" ON "laporan"("tanggal_laporan");

-- CreateIndex
CREATE INDEX "idx_obat_golongan" ON "obat"("golongan_obat_id_golongan");

-- CreateIndex
CREATE INDEX "idx_obat_nama" ON "obat"("nama_obat");

-- CreateIndex
CREATE UNIQUE INDEX "owner_email_key" ON "owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "owner_username_key" ON "owner"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pelanggan_email_key" ON "pelanggan"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pelanggan_username_key" ON "pelanggan"("username");

-- CreateIndex
CREATE INDEX "idx_permintaan_tanggal" ON "permintaan_obat"("tanggal_permintaan");

-- CreateIndex
CREATE INDEX "idx_resep_tanggal" ON "resep_obat"("tanggal_resep");

-- CreateIndex
CREATE INDEX "idx_retur_tanggal" ON "retur_obat"("tanggal_retur");

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "fk_transaksi_apoteker" FOREIGN KEY ("apoteker_id_pengguna") REFERENCES "apoteker"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "fk_transaksi_laporan" FOREIGN KEY ("laporan_id_laporan") REFERENCES "laporan"("id_laporan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "fk_admin_menu" FOREIGN KEY ("menu_id_menu") REFERENCES "menu"("id_menu") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "fk_admin_retur" FOREIGN KEY ("retur_obat_id_retur") REFERENCES "retur_obat"("id_retur") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "fk_admin_transaksi" FOREIGN KEY ("transaksi_id_transaksi") REFERENCES "transaksi"("id_transaksi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apoteker" ADD CONSTRAINT "fk_apoteker_menu" FOREIGN KEY ("menu_id_menu") REFERENCES "menu"("id_menu") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asisten_apoteker" ADD CONSTRAINT "fk_asisten_menu" FOREIGN KEY ("menu_id_menu") REFERENCES "menu"("id_menu") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_permintaan_obat" ADD CONSTRAINT "fk_detail_permintaan_header" FOREIGN KEY ("permintaan_obat_id_permintaan") REFERENCES "permintaan_obat"("id_permintaan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_permintaan_obat" ADD CONSTRAINT "fk_detail_permintaan_obat" FOREIGN KEY ("id_obat") REFERENCES "obat"("id_obat") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_resep_obat" ADD CONSTRAINT "fk_detail_resep_obat" FOREIGN KEY ("id_obat") REFERENCES "obat"("id_obat") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_retur_obat" ADD CONSTRAINT "fk_detail_retur_header" FOREIGN KEY ("retur_obat_id_retur") REFERENCES "retur_obat"("id_retur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_retur_obat" ADD CONSTRAINT "fk_detail_retur_obat" FOREIGN KEY ("id_obat") REFERENCES "obat"("id_obat") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "fk_detail_transaksi_header" FOREIGN KEY ("transaksi_id_transaksi") REFERENCES "transaksi"("id_transaksi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "fk_laporan_admin" FOREIGN KEY ("admin_id_pengguna") REFERENCES "admin"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "fk_laporan_asisten" FOREIGN KEY ("asisten_apoteker_id_pengguna") REFERENCES "asisten_apoteker"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "fk_laporan_owner" FOREIGN KEY ("owner_id_pengguna") REFERENCES "owner"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu" ADD CONSTRAINT "fk_menu_laporan" FOREIGN KEY ("laporan_id_laporan") REFERENCES "laporan"("id_laporan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "fk_obat_apoteker" FOREIGN KEY ("apoteker_id_pengguna") REFERENCES "apoteker"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "fk_obat_asisten" FOREIGN KEY ("asisten_apoteker_id_pengguna") REFERENCES "asisten_apoteker"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "fk_obat_golongan" FOREIGN KEY ("golongan_obat_id_golongan") REFERENCES "golongan_obat"("id_golongan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "fk_obat_permintaan" FOREIGN KEY ("permintaan_obat_id_permintaan") REFERENCES "permintaan_obat"("id_permintaan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "fk_obat_resep" FOREIGN KEY ("resep_obat_id_resep") REFERENCES "resep_obat"("id_resep") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "fk_obat_retur" FOREIGN KEY ("retur_obat_id_retur") REFERENCES "retur_obat"("id_retur") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "fk_obat_transaksi" FOREIGN KEY ("transaksi_id_transaksi") REFERENCES "transaksi"("id_transaksi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner" ADD CONSTRAINT "fk_owner_menu" FOREIGN KEY ("menu_id_menu") REFERENCES "menu"("id_menu") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggan" ADD CONSTRAINT "fk_pelanggan_menu" FOREIGN KEY ("menu_id_menu") REFERENCES "menu"("id_menu") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggan" ADD CONSTRAINT "fk_pelanggan_transaksi" FOREIGN KEY ("transaksi_id_transaksi") REFERENCES "transaksi"("id_transaksi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permintaan_obat" ADD CONSTRAINT "fk_permintaan_pelanggan" FOREIGN KEY ("pelanggan_id_pengguna") REFERENCES "pelanggan"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resep_obat" ADD CONSTRAINT "fk_resep_apoteker" FOREIGN KEY ("apoteker_id_pengguna") REFERENCES "apoteker"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resep_obat" ADD CONSTRAINT "fk_resep_pelanggan" FOREIGN KEY ("pelanggan_id_pengguna") REFERENCES "pelanggan"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur_obat" ADD CONSTRAINT "fk_retur_apoteker" FOREIGN KEY ("apoteker_id_pengguna") REFERENCES "apoteker"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur_obat" ADD CONSTRAINT "fk_retur_asisten" FOREIGN KEY ("asisten_apoteker_id_pengguna") REFERENCES "asisten_apoteker"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur_obat" ADD CONSTRAINT "fk_retur_pelanggan" FOREIGN KEY ("pelanggan_id_pengguna") REFERENCES "pelanggan"("id_pengguna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur_obat" ADD CONSTRAINT "fk_retur_transaksi" FOREIGN KEY ("transaksi_id_transaksi") REFERENCES "transaksi"("id_transaksi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_obat" ADD CONSTRAINT "fk_stok_obat" FOREIGN KEY ("obat_id_obat") REFERENCES "obat"("id_obat") ON DELETE CASCADE ON UPDATE CASCADE;
