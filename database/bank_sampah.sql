-- =========================================
-- DATABASE : db_bank_sampah
-- PROJECT  : Web App Manajemen Bank Sampah
-- TABLE    : jenis_sampah dan transaksi_bank_sampah
-- =========================================

-- 1. TABEL MASTER JENIS SAMPAH
CREATE TABLE jenis_sampah (
    id SERIAL PRIMARY KEY,
    nama_jenis_sampah VARCHAR(100) NOT NULL UNIQUE,
    harga_per_kg NUMERIC(12,2) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT cek_harga_positif
    CHECK (harga_per_kg > 0)
);

-- 2. TABEL TRANSAKSI BANK SAMPAH
CREATE TABLE transaksi_bank_sampah (
    id SERIAL PRIMARY KEY,
    kode_transaksi VARCHAR(30),
    nama_nasabah VARCHAR(100) NOT NULL,
    jenis_transaksi VARCHAR(20) NOT NULL,
    jenis_sampah_id INTEGER,
    berat_kg NUMERIC(10,2),
    total_nilai NUMERIC(12,2) NOT NULL,
    tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    keterangan TEXT,

    CONSTRAINT fk_transaksi_jenis_sampah
    FOREIGN KEY (jenis_sampah_id)
    REFERENCES jenis_sampah(id),

    CONSTRAINT cek_jenis_transaksi
    CHECK (jenis_transaksi IN ('setoran', 'penarikan')),

    CONSTRAINT cek_total_nilai
    CHECK (total_nilai > 0),

    CONSTRAINT cek_detail_transaksi
    CHECK (
        (
            jenis_transaksi = 'setoran'
            AND jenis_sampah_id IS NOT NULL
            AND berat_kg > 0
        )
        OR
        (
            jenis_transaksi = 'penarikan'
            AND jenis_sampah_id IS NULL
            AND berat_kg IS NULL
        )
    )
);

-- 3. DATA MASTER AWAL
INSERT INTO jenis_sampah
(nama_jenis_sampah, harga_per_kg, keterangan)
VALUES
('Plastik', 3000, 'Sampah plastik'),
('Kardus', 2000, 'Sampah kardus'),
('Botol', 3000, 'Botol plastik atau botol bekas');