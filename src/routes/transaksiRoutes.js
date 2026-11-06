const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// GET: Menampilkan semua transaksi
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM transaksi_bank_sampah ORDER BY id ASC'
        );

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
});

// GET: Menampilkan transaksi berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM transaksi_bank_sampah WHERE id = $1',
            [id]
        );

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
});

// GET: Menampilkan transaksi berdasarkan nama nasabah
router.get('/nasabah/:nama', async (req, res) => {
    try {
        const { nama } = req.params;

        const result = await pool.query(
            'SELECT * FROM transaksi_bank_sampah WHERE nama_nasabah ILIKE $1 ORDER BY id ASC',
            [nama]
        );

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
});

// POST: Menambahkan transaksi baru
router.post('/', async (req, res) => {
    try {
        const {
            nama_nasabah,
            jenis_transaksi,
            jenis_sampah,
            berat_kg,
            harga_per_kg,
            total_nilai,
            keterangan
        } = req.body;

        const result = await pool.query(
            `INSERT INTO transaksi_bank_sampah
            (nama_nasabah, jenis_transaksi, jenis_sampah, berat_kg,
            harga_per_kg, total_nilai, keterangan)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                nama_nasabah,
                jenis_transaksi,
                jenis_sampah,
                berat_kg,
                harga_per_kg,
                total_nilai,
                keterangan
            ]
        );

        res.status(201).json({
            message: 'Transaksi berhasil ditambahkan',
            data: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: 'Gagal menambahkan transaksi',
            error: error.message
        });
    }
});

// PUT: Memperbarui transaksi berdasarkan ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama_nasabah,
            jenis_transaksi,
            jenis_sampah,
            berat_kg,
            harga_per_kg,
            total_nilai,
            keterangan
        } = req.body;

        const result = await pool.query(
            `UPDATE transaksi_bank_sampah
            SET nama_nasabah = $1,
                jenis_transaksi = $2,
                jenis_sampah = $3,
                berat_kg = $4,
                harga_per_kg = $5,
                total_nilai = $6,
                keterangan = $7
            WHERE id = $8
            RETURNING *`,
            [
                nama_nasabah,
                jenis_transaksi,
                jenis_sampah,
                berat_kg,
                harga_per_kg,
                total_nilai,
                keterangan,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Transaksi berhasil diperbarui',
            data: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: 'Gagal memperbarui transaksi',
            error: error.message
        });
    }
});

// DELETE: Menghapus transaksi berdasarkan ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM transaksi_bank_sampah WHERE id = $1 RETURNING *',
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
});

module.exports = router;