const pool = require('../db/db');

const getAllJenisSampah = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM jenis_sampah
            ORDER BY id ASC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua data jenis sampah',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data jenis sampah',
            error: error.message
        });
    }
};

const getJenisSampahById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM jenis_sampah
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Jenis sampah tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail jenis sampah',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail jenis sampah',
            error: error.message
        });
    }
};

const createJenisSampah = async (req, res) => {
    try {
        const {
            nama_jenis_sampah,
            harga_per_kg,
            keterangan
        } = req.body;

        if (!nama_jenis_sampah || harga_per_kg === undefined) {
            return res.status(400).json({
                message: 'Nama jenis sampah dan harga per kg wajib diisi'
            });
        }

        const harga = Number(harga_per_kg);

        if (!Number.isFinite(harga) || harga <= 0) {
            return res.status(400).json({
                message: 'Harga per kg harus berupa angka lebih dari 0'
            });
        }

        const result = await pool.query(
            `INSERT INTO jenis_sampah
                (nama_jenis_sampah, harga_per_kg, keterangan)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
                nama_jenis_sampah.trim(),
                harga,
                keterangan || null
            ]
        );

        res.status(201).json({
            message: 'Jenis sampah berhasil ditambahkan',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Nama jenis sampah sudah terdaftar'
            });
        }

        res.status(500).json({
            message: 'Gagal menambahkan jenis sampah',
            error: error.message
        });
    }
};

const updateJenisSampah = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama_jenis_sampah,
            harga_per_kg,
            keterangan
        } = req.body;

        if (!nama_jenis_sampah || harga_per_kg === undefined) {
            return res.status(400).json({
                message: 'Nama jenis sampah dan harga per kg wajib diisi'
            });
        }

        const harga = Number(harga_per_kg);

        if (!Number.isFinite(harga) || harga <= 0) {
            return res.status(400).json({
                message: 'Harga per kg harus berupa angka lebih dari 0'
            });
        }

        const result = await pool.query(
            `UPDATE jenis_sampah
             SET
                nama_jenis_sampah = $1,
                harga_per_kg = $2,
                keterangan = $3
             WHERE id = $4
             RETURNING *`,
            [
                nama_jenis_sampah.trim(),
                harga,
                keterangan || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Jenis sampah tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Jenis sampah berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Nama jenis sampah sudah terdaftar'
            });
        }

        res.status(500).json({
            message: 'Gagal memperbarui jenis sampah',
            error: error.message
        });
    }
};

const deleteJenisSampah = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM jenis_sampah
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Jenis sampah tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Jenis sampah berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({
                message: 'Jenis sampah tidak dapat dihapus karena sudah digunakan dalam transaksi'
            });
        }

        res.status(500).json({
            message: 'Gagal menghapus jenis sampah',
            error: error.message
        });
    }
};

module.exports = {
    getAllJenisSampah,
    getJenisSampahById,
    createJenisSampah,
    updateJenisSampah,
    deleteJenisSampah
};