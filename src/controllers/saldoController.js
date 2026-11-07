const pool = require('../db/db');

const getAllSaldo = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                s.*,
                n.nama_nasabah,
                n.no_telepon
            FROM saldo_nasabah s
            JOIN nasabah n
                ON s.id_nasabah = n.id_nasabah
            ORDER BY s.id_saldo ASC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua data saldo nasabah',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data saldo nasabah',
            error: error.message
        });
    }
};

const getSaldoByNasabah = async (req, res) => {
    try {
        const { id_nasabah } = req.params;

        const result = await pool.query(`
            SELECT
                s.*,
                n.nama_nasabah,
                n.no_telepon
            FROM saldo_nasabah s
            JOIN nasabah n
                ON s.id_nasabah = n.id_nasabah
            WHERE s.id_nasabah = $1
        `, [id_nasabah]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Data saldo nasabah tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil saldo nasabah',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil saldo nasabah',
            error: error.message
        });
    }
};

const getRiwayatSaldo = async (req, res) => {
    try {
        const { id_nasabah } = req.params;

        const nasabah = await pool.query(
            `SELECT id_nasabah, nama_nasabah
             FROM nasabah
             WHERE id_nasabah = $1`,
            [id_nasabah]
        );

        if (nasabah.rows.length === 0) {
            return res.status(404).json({
                message: 'Nasabah tidak ditemukan'
            });
        }

        const result = await pool.query(`
            SELECT
                id,
                kode_transaksi,
                jenis_transaksi,
                total_nilai,
                tanggal_transaksi,
                keterangan,
                CASE
                    WHEN jenis_transaksi = 'setoran' THEN total_nilai
                    WHEN jenis_transaksi = 'penarikan' THEN -total_nilai
                END AS perubahan_saldo
            FROM transaksi_bank_sampah
            WHERE id_nasabah = $1
            ORDER BY tanggal_transaksi DESC, id DESC
        `, [id_nasabah]);

        res.status(200).json({
            message: 'Berhasil mengambil riwayat saldo nasabah',
            nama_nasabah: nasabah.rows[0].nama_nasabah,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil riwayat saldo nasabah',
            error: error.message
        });
    }
};

module.exports = {
    getAllSaldo,
    getSaldoByNasabah,
    getRiwayatSaldo
};