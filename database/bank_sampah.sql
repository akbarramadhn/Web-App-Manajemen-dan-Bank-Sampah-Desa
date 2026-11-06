
-- =========================================
-- DATABASE : db_bank_sampah
-- PROJECT  : Web App Manajemen Bank Sampah
-- TABLE    : transaksi_bank_sampah
-- =========================================

CREATE TABLE transaksi_bank_sampah (
    id SERIAL PRIMARY KEY,
    nama_nasabah VARCHAR(100) NOT NULL,
    jenis_transaksi VARCHAR(20) NOT NULL,
    jenis_sampah VARCHAR(100),
    berat_kg NUMERIC(10,2),
    harga_per_kg NUMERIC(12,2),
    total_nilai NUMERIC(12,2) NOT NULL,
    tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    keterangan TEXT,

    CONSTRAINT cek_jenis_transaksi
    CHECK (jenis_transaksi IN ('setoran', 'penarikan')),

    CONSTRAINT cek_total_nilai
    CHECK (total_nilai > 0),

    CONSTRAINT cek_detail_transaksi
    CHECK (
        (jenis_transaksi = 'setoran'
            AND jenis_sampah IS NOT NULL
            AND berat_kg > 0
            AND harga_per_kg > 0)
        OR
        (jenis_transaksi = 'penarikan'
            AND jenis_sampah IS NULL
            AND berat_kg IS NULL
            AND harga_per_kg IS NULL)
    )
);