
const pool = require('../db/db');

// GET: Menampilkan semua transaksi
const getAllTransaksi = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.*,
                j.nama_jenis_sampah,
                j.harga_per_kg
            FROM transaksi_bank_sampah t
            LEFT JOIN jenis_sampah j
                ON t.jenis_sampah_id = j.id
            ORDER BY t.id ASC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua data transaksi',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data transaksi',
            error: error.message
        });
    }
};


// GET: Menampilkan transaksi berdasarkan ID
const getTransaksiById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                t.*,
                j.nama_jenis_sampah,
                j.harga_per_kg
            FROM transaksi_bank_sampah t
            LEFT JOIN jenis_sampah j
                ON t.jenis_sampah_id = j.id
            WHERE t.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail transaksi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail transaksi',
            error: error.message
        });
    }
};


// GET: Menampilkan transaksi berdasarkan nama nasabah
const getTransaksiByNasabah = async (req, res) => {
    try {
        const { nama } = req.params;

        const result = await pool.query(`
            SELECT
                t.*,
                j.nama_jenis_sampah,
                j.harga_per_kg
            FROM transaksi_bank_sampah t
            LEFT JOIN jenis_sampah j
                ON t.jenis_sampah_id = j.id
            WHERE t.nama_nasabah ILIKE $1
            ORDER BY t.id ASC
        `, [nama]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Nasabah tidak ditemukan atau belum memiliki transaksi'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil data transaksi nasabah',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data transaksi nasabah',
            error: error.message
        });
    }
};


// POST: Menambahkan transaksi baru
const createTransaksi = async (req, res) => {
    try {
        const {
            kode_transaksi,
            nama_nasabah,
            jenis_transaksi,
            jenis_sampah_id,
            berat_kg,
            total_nilai,
            keterangan
        } = req.body;

        if (!kode_transaksi || !nama_nasabah) {
            return res.status(400).json({
                message: 'Kode transaksi dan nama nasabah wajib diisi'
            });
        }

        let idJenisSampah = null;
        let berat = null;
        let nilaiTransaksi;

        if (jenis_transaksi === 'setoran') {

            if (
                jenis_sampah_id === undefined ||
                berat_kg === undefined ||
                !Number.isFinite(Number(berat_kg)) ||
                Number(berat_kg) <= 0
            ) {
                return res.status(400).json({
                    message: 'Setoran harus memiliki jenis sampah dan berat lebih dari 0'
                });
            }

            // Mengambil harga dari tabel master jenis_sampah
            const master = await pool.query(
                `SELECT id, harga_per_kg
                 FROM jenis_sampah
                 WHERE id = $1`,
                [jenis_sampah_id]
            );

            if (master.rows.length === 0) {
                return res.status(404).json({
                    message: 'Jenis sampah tidak ditemukan di tabel master'
                });
            }

            idJenisSampah = master.rows[0].id;
            berat = Number(berat_kg);

            const harga = Number(master.rows[0].harga_per_kg);
            nilaiTransaksi = berat * harga;

        } else if (jenis_transaksi === 'penarikan') {

            nilaiTransaksi = Number(total_nilai);

            if (
                !Number.isFinite(nilaiTransaksi) ||
                nilaiTransaksi <= 0
            ) {
                return res.status(400).json({
                    message: 'Nominal penarikan harus lebih dari 0'
                });
            }

        } else {
            return res.status(400).json({
                message: 'Jenis transaksi harus setoran atau penarikan'
            });
        }

        const result = await pool.query(`
            INSERT INTO transaksi_bank_sampah
            (
                kode_transaksi,
                nama_nasabah,
                jenis_transaksi,
                jenis_sampah_id,
                berat_kg,
                total_nilai,
                keterangan
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [
            kode_transaksi,
            nama_nasabah,
            jenis_transaksi,
            idJenisSampah,
            berat,
            nilaiTransaksi,
            keterangan || null
        ]);

        // Mengambil kembali transaksi beserta data master
        const transaksi = await pool.query(`
            SELECT
                t.*,
                j.nama_jenis_sampah,
                j.harga_per_kg
            FROM transaksi_bank_sampah t
            LEFT JOIN jenis_sampah j
                ON t.jenis_sampah_id = j.id
            WHERE t.id = $1
        `, [result.rows[0].id]);

        res.status(201).json({
            message: 'Transaksi berhasil ditambahkan',
            data: transaksi.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: 'Gagal menambahkan transaksi',
            error: error.message
        });
    }
};


// PUT: Memperbarui transaksi berdasarkan ID
const updateTransaksi = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            kode_transaksi,
            nama_nasabah,
            jenis_transaksi,
            jenis_sampah_id,
            berat_kg,
            total_nilai,
            keterangan
        } = req.body;

        if (!kode_transaksi || !nama_nasabah) {
            return res.status(400).json({
                message: 'Kode transaksi dan nama nasabah wajib diisi'
            });
        }

        let idJenisSampah = null;
        let berat = null;
        let nilaiTransaksi;

        if (jenis_transaksi === 'setoran') {

            if (
                jenis_sampah_id === undefined ||
                berat_kg === undefined ||
                !Number.isFinite(Number(berat_kg)) ||
                Number(berat_kg) <= 0
            ) {
                return res.status(400).json({
                    message: 'Setoran harus memiliki jenis sampah dan berat lebih dari 0'
                });
            }

            // Mengambil harga terbaru dari tabel master
            const master = await pool.query(
                `SELECT id, harga_per_kg
                 FROM jenis_sampah
                 WHERE id = $1`,
                [jenis_sampah_id]
            );

            if (master.rows.length === 0) {
                return res.status(404).json({
                    message: 'Jenis sampah tidak ditemukan di tabel master'
                });
            }

            idJenisSampah = master.rows[0].id;
            berat = Number(berat_kg);

            const harga = Number(master.rows[0].harga_per_kg);
            nilaiTransaksi = berat * harga;

        } else if (jenis_transaksi === 'penarikan') {

            nilaiTransaksi = Number(total_nilai);

            if (
                !Number.isFinite(nilaiTransaksi) ||
                nilaiTransaksi <= 0
            ) {
                return res.status(400).json({
                    message: 'Nominal penarikan harus lebih dari 0'
                });
            }

        } else {
            return res.status(400).json({
                message: 'Jenis transaksi harus setoran atau penarikan'
            });
        }

        const result = await pool.query(`
            UPDATE transaksi_bank_sampah
            SET
                kode_transaksi = $1,
                nama_nasabah = $2,
                jenis_transaksi = $3,
                jenis_sampah_id = $4,
                berat_kg = $5,
                total_nilai = $6,
                keterangan = $7
            WHERE id = $8
            RETURNING id
        `, [
            kode_transaksi,
            nama_nasabah,
            jenis_transaksi,
            idJenisSampah,
            berat,
            nilaiTransaksi,
            keterangan || null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        const transaksi = await pool.query(`
            SELECT
                t.*,
                j.nama_jenis_sampah,
                j.harga_per_kg
            FROM transaksi_bank_sampah t
            LEFT JOIN jenis_sampah j
                ON t.jenis_sampah_id = j.id
            WHERE t.id = $1
        `, [id]);

        res.status(200).json({
            message: 'Transaksi berhasil diperbarui',
            data: transaksi.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: 'Gagal memperbarui transaksi',
            error: error.message
        });
    }
};


// DELETE: Menghapus transaksi berdasarkan ID
const deleteTransaksi = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM transaksi_bank_sampah
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Transaksi berhasil dihapus',
            data: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: 'Gagal menghapus transaksi',
            error: error.message
        });
    }
};


// Export seluruh controller
module.exports = {
    getAllTransaksi,
    getTransaksiById,
    getTransaksiByNasabah,
    createTransaksi,
    updateTransaksi,
    deleteTransaksi
};