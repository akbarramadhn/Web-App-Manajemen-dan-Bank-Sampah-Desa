const pool = require('../db/db');

const getAllNotifikasi = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                nt.*,
                n.nama_nasabah,
                t.kode_transaksi
            FROM notifikasi nt
            JOIN nasabah n
                ON nt.id_nasabah = n.id_nasabah
            LEFT JOIN transaksi_bank_sampah t
                ON nt.id_transaksi = t.id
            ORDER BY nt.tanggal_dibuat DESC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua notifikasi',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil notifikasi',
            error: error.message
        });
    }
};

const getNotifikasiById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                nt.*,
                n.nama_nasabah,
                t.kode_transaksi
            FROM notifikasi nt
            JOIN nasabah n
                ON nt.id_nasabah = n.id_nasabah
            LEFT JOIN transaksi_bank_sampah t
                ON nt.id_transaksi = t.id
            WHERE nt.id_notifikasi = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Notifikasi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail notifikasi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail notifikasi',
            error: error.message
        });
    }
};

const getNotifikasiByNasabah = async (req, res) => {
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
                nt.*,
                t.kode_transaksi
            FROM notifikasi nt
            LEFT JOIN transaksi_bank_sampah t
                ON nt.id_transaksi = t.id
            WHERE nt.id_nasabah = $1
            ORDER BY nt.tanggal_dibuat DESC
        `, [id_nasabah]);

        res.status(200).json({
            message: 'Berhasil mengambil notifikasi nasabah',
            nama_nasabah: nasabah.rows[0].nama_nasabah,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil notifikasi nasabah',
            error: error.message
        });
    }
};

const createNotifikasi = async (req, res) => {
    try {
        const {
            id_nasabah,
            id_transaksi,
            judul,
            pesan
        } = req.body;

        if (!id_nasabah || !judul || !pesan) {
            return res.status(400).json({
                message: 'ID nasabah, judul, dan pesan wajib diisi'
            });
        }

        const nasabah = await pool.query(
            `SELECT id_nasabah
             FROM nasabah
             WHERE id_nasabah = $1`,
            [id_nasabah]
        );

        if (nasabah.rows.length === 0) {
            return res.status(404).json({
                message: 'Nasabah tidak ditemukan'
            });
        }

        if (id_transaksi !== undefined && id_transaksi !== null) {
            const transaksi = await pool.query(
                `SELECT id, id_nasabah
                 FROM transaksi_bank_sampah
                 WHERE id = $1`,
                [id_transaksi]
            );

            if (transaksi.rows.length === 0) {
                return res.status(404).json({
                    message: 'Transaksi tidak ditemukan'
                });
            }

            if (Number(transaksi.rows[0].id_nasabah) !== Number(id_nasabah)) {
                return res.status(400).json({
                    message: 'Transaksi bukan milik nasabah tersebut'
                });
            }
        }

        const result = await pool.query(
            `INSERT INTO notifikasi
                (id_nasabah, id_transaksi, judul, pesan)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                id_nasabah,
                id_transaksi || null,
                judul.trim(),
                pesan.trim()
            ]
        );

        res.status(201).json({
            message: 'Notifikasi berhasil ditambahkan',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal menambahkan notifikasi',
            error: error.message
        });
    }
};

const updateNotifikasi = async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, pesan, status_baca } = req.body;

        if (
            judul === undefined &&
            pesan === undefined &&
            status_baca === undefined
        ) {
            return res.status(400).json({
                message: 'Tidak ada data notifikasi yang diperbarui'
            });
        }

        if (status_baca !== undefined && typeof status_baca !== 'boolean') {
            return res.status(400).json({
                message: 'Status baca harus berupa true atau false'
            });
        }

        const result = await pool.query(
            `UPDATE notifikasi
             SET
                judul = COALESCE($1, judul),
                pesan = COALESCE($2, pesan),
                status_baca = COALESCE($3, status_baca)
             WHERE id_notifikasi = $4
             RETURNING *`,
            [
                judul === undefined ? null : judul.trim(),
                pesan === undefined ? null : pesan.trim(),
                status_baca === undefined ? null : status_baca,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Notifikasi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Notifikasi berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal memperbarui notifikasi',
            error: error.message
        });
    }
};

const deleteNotifikasi = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM notifikasi
             WHERE id_notifikasi = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Notifikasi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Notifikasi berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal menghapus notifikasi',
            error: error.message
        });
    }
};

module.exports = {
    getAllNotifikasi,
    getNotifikasiById,
    getNotifikasiByNasabah,
    createNotifikasi,
    updateNotifikasi,
    deleteNotifikasi
};