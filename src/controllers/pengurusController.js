const pool = require('../db/db');

const getAllPengurus = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM pengurus
            ORDER BY id_pengurus ASC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua data pengurus',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data pengurus',
            error: error.message
        });
    }
};

const getPengurusById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM pengurus
             WHERE id_pengurus = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Pengurus tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail pengurus',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail pengurus',
            error: error.message
        });
    }
};

const createPengurus = async (req, res) => {
    try {
        const {
            nama_pengurus,
            no_telepon,
            alamat,
            jabatan
        } = req.body;

        if (!nama_pengurus || !nama_pengurus.trim()) {
            return res.status(400).json({
                message: 'Nama pengurus wajib diisi'
            });
        }

        const result = await pool.query(
            `INSERT INTO pengurus
                (nama_pengurus, no_telepon, alamat, jabatan)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                nama_pengurus.trim(),
                no_telepon || null,
                alamat || null,
                jabatan || null
            ]
        );

        res.status(201).json({
            message: 'Pengurus berhasil ditambahkan',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal menambahkan pengurus',
            error: error.message
        });
    }
};

const updatePengurus = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama_pengurus,
            no_telepon,
            alamat,
            jabatan
        } = req.body;

        if (!nama_pengurus || !nama_pengurus.trim()) {
            return res.status(400).json({
                message: 'Nama pengurus wajib diisi'
            });
        }

        const result = await pool.query(
            `UPDATE pengurus
             SET
                nama_pengurus = $1,
                no_telepon = $2,
                alamat = $3,
                jabatan = $4
             WHERE id_pengurus = $5
             RETURNING *`,
            [
                nama_pengurus.trim(),
                no_telepon || null,
                alamat || null,
                jabatan || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Pengurus tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Data pengurus berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal memperbarui data pengurus',
            error: error.message
        });
    }
};

const deletePengurus = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM pengurus
             WHERE id_pengurus = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Pengurus tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Pengurus berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({
                message: 'Pengurus tidak dapat dihapus karena masih terhubung dengan akun'
            });
        }

        res.status(500).json({
            message: 'Gagal menghapus pengurus',
            error: error.message
        });
    }
};

module.exports = {
    getAllPengurus,
    getPengurusById,
    createPengurus,
    updatePengurus,
    deletePengurus
};
