const pool = require('../db/db');

const getAllBukti = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                b.*,
                t.kode_transaksi,
                t.jenis_transaksi,
                n.nama_nasabah
            FROM bukti_transaksi b
            JOIN transaksi_bank_sampah t
                ON b.id_transaksi = t.id
            JOIN nasabah n
                ON t.id_nasabah = n.id_nasabah
            ORDER BY b.id_bukti ASC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua data bukti transaksi',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data bukti transaksi',
            error: error.message
        });
    }
};

const getBuktiById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                b.*,
                t.kode_transaksi,
                t.jenis_transaksi,
                n.nama_nasabah
            FROM bukti_transaksi b
            JOIN transaksi_bank_sampah t
                ON b.id_transaksi = t.id
            JOIN nasabah n
                ON t.id_nasabah = n.id_nasabah
            WHERE b.id_bukti = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Bukti transaksi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail bukti transaksi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail bukti transaksi',
            error: error.message
        });
    }
};

const getBuktiByTransaksi = async (req, res) => {
    try {
        const { id_transaksi } = req.params;

        const transaksi = await pool.query(
            `SELECT id, kode_transaksi
             FROM transaksi_bank_sampah
             WHERE id = $1`,
            [id_transaksi]
        );

        if (transaksi.rows.length === 0) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        const result = await pool.query(`
            SELECT *
            FROM bukti_transaksi
            WHERE id_transaksi = $1
            ORDER BY tanggal_upload DESC
        `, [id_transaksi]);

        res.status(200).json({
            message: 'Berhasil mengambil bukti berdasarkan transaksi',
            kode_transaksi: transaksi.rows[0].kode_transaksi,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil bukti berdasarkan transaksi',
            error: error.message
        });
    }
};

const createBukti = async (req, res) => {
    try {
        const {
            id_transaksi,
            nama_file,
            file_bukti,
            tipe_file
        } = req.body;

        if (!id_transaksi || !nama_file || !file_bukti) {
            return res.status(400).json({
                message: 'ID transaksi, nama file, dan file bukti wajib diisi'
            });
        }

        const transaksi = await pool.query(
            `SELECT id
             FROM transaksi_bank_sampah
             WHERE id = $1`,
            [id_transaksi]
        );

        if (transaksi.rows.length === 0) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        const result = await pool.query(
            `INSERT INTO bukti_transaksi
                (id_transaksi, nama_file, file_bukti, tipe_file)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                id_transaksi,
                nama_file.trim(),
                file_bukti,
                tipe_file || null
            ]
        );

        res.status(201).json({
            message: 'Bukti transaksi berhasil ditambahkan',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal menambahkan bukti transaksi',
            error: error.message
        });
    }
};

const updateBukti = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_transaksi,
            nama_file,
            file_bukti,
            tipe_file
        } = req.body;

        if (!id_transaksi || !nama_file || !file_bukti) {
            return res.status(400).json({
                message: 'ID transaksi, nama file, dan file bukti wajib diisi'
            });
        }

        const result = await pool.query(
            `UPDATE bukti_transaksi
             SET
                id_transaksi = $1,
                nama_file = $2,
                file_bukti = $3,
                tipe_file = $4
             WHERE id_bukti = $5
             RETURNING *`,
            [
                id_transaksi,
                nama_file.trim(),
                file_bukti,
                tipe_file || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Bukti transaksi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Bukti transaksi berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        res.status(500).json({
            message: 'Gagal memperbarui bukti transaksi',
            error: error.message
        });
    }
};

const deleteBukti = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM bukti_transaksi
             WHERE id_bukti = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Bukti transaksi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Bukti transaksi berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal menghapus bukti transaksi',
            error: error.message
        });
    }
};

module.exports = {
    getAllBukti,
    getBuktiById,
    getBuktiByTransaksi,
    createBukti,
    updateBukti,
    deleteBukti
};