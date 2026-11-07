const pool = require('../db/db');

const getAllNasabah = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                n.*,
                COALESCE(s.saldo, 0) AS saldo
            FROM nasabah n
            LEFT JOIN saldo_nasabah s
                ON n.id_nasabah = s.id_nasabah
            ORDER BY n.id_nasabah ASC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua data nasabah',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data nasabah',
            error: error.message
        });
    }
};

const getNasabahById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                n.*,
                COALESCE(s.saldo, 0) AS saldo
            FROM nasabah n
            LEFT JOIN saldo_nasabah s
                ON n.id_nasabah = s.id_nasabah
            WHERE n.id_nasabah = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Nasabah tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail nasabah',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail nasabah',
            error: error.message
        });
    }
};

const createNasabah = async (req, res) => {
    try {
        const {
            nama_nasabah,
            nik,
            alamat,
            no_telepon,
            status
        } = req.body;

        if (!nama_nasabah || !nama_nasabah.trim()) {
            return res.status(400).json({
                message: 'Nama nasabah wajib diisi'
            });
        }

        const result = await pool.query(`
            INSERT INTO nasabah
                (nama_nasabah, nik, alamat, no_telepon, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            nama_nasabah.trim(),
            nik || null,
            alamat || null,
            no_telepon || null,
            status || 'aktif'
        ]);

        res.status(201).json({
            message: 'Nasabah berhasil ditambahkan',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'NIK sudah terdaftar'
            });
        }

        res.status(500).json({
            message: 'Gagal menambahkan nasabah',
            error: error.message
        });
    }
};

const updateNasabah = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama_nasabah,
            nik,
            alamat,
            no_telepon,
            status
        } = req.body;

        if (!nama_nasabah || !nama_nasabah.trim()) {
            return res.status(400).json({
                message: 'Nama nasabah wajib diisi'
            });
        }

        const result = await pool.query(`
            UPDATE nasabah
            SET
                nama_nasabah = $1,
                nik = $2,
                alamat = $3,
                no_telepon = $4,
                status = $5
            WHERE id_nasabah = $6
            RETURNING *
        `, [
            nama_nasabah.trim(),
            nik || null,
            alamat || null,
            no_telepon || null,
            status || 'aktif',
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Nasabah tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Data nasabah berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'NIK sudah digunakan oleh nasabah lain'
            });
        }

        res.status(500).json({
            message: 'Gagal memperbarui data nasabah',
            error: error.message
        });
    }
};

const deleteNasabah = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            DELETE FROM nasabah
            WHERE id_nasabah = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Nasabah tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Nasabah berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({
                message: 'Nasabah tidak dapat dihapus karena masih memiliki relasi dengan data lain'
            });
        }

        res.status(500).json({
            message: 'Gagal menghapus nasabah',
            error: error.message
        });
    }
};

module.exports = {
    getAllNasabah,
    getNasabahById,
    createNasabah,
    updateNasabah,
    deleteNasabah
};
