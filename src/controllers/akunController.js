const pool = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getAllAkun = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                a.id_akun,
                a.username,
                a.role,
                a.status_akun,
                a.created_at,
                a.id_nasabah,
                n.nama_nasabah,
                a.id_pengurus,
                p.nama_pengurus
            FROM akun a
            LEFT JOIN nasabah n
                ON a.id_nasabah = n.id_nasabah
            LEFT JOIN pengurus p
                ON a.id_pengurus = p.id_pengurus
            ORDER BY a.id_akun ASC
        `);

        res.status(200).json({
            message: 'Berhasil mengambil semua data akun',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data akun',
            error: error.message
        });
    }
};

const getAkunById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                a.id_akun,
                a.username,
                a.role,
                a.status_akun,
                a.created_at,
                a.id_nasabah,
                n.nama_nasabah,
                a.id_pengurus,
                p.nama_pengurus
            FROM akun a
            LEFT JOIN nasabah n
                ON a.id_nasabah = n.id_nasabah
            LEFT JOIN pengurus p
                ON a.id_pengurus = p.id_pengurus
            WHERE a.id_akun = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Akun tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail akun',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail akun',
            error: error.message
        });
    }
};

const createAkun = async (req, res) => {
    try {
        const {
            username,
            password,
            role,
            id_nasabah,
            id_pengurus
        } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({
                message: 'Username, password, dan role wajib diisi'
            });
        }

        if (!['nasabah', 'pengurus'].includes(role)) {
            return res.status(400).json({
                message: 'Role harus nasabah atau pengurus'
            });
        }

        if (role === 'nasabah' && (!id_nasabah || id_pengurus)) {
            return res.status(400).json({
                message: 'Akun nasabah harus memiliki id_nasabah dan tidak boleh memiliki id_pengurus'
            });
        }

        if (role === 'pengurus' && (!id_pengurus || id_nasabah)) {
            return res.status(400).json({
                message: 'Akun pengurus harus memiliki id_pengurus dan tidak boleh memiliki id_nasabah'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password minimal 8 karakter'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO akun
                (username, password, role, id_nasabah, id_pengurus)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING
                id_akun,
                username,
                role,
                status_akun,
                created_at,
                id_nasabah,
                id_pengurus`,
            [
                username.trim(),
                passwordHash,
                role,
                role === 'nasabah' ? id_nasabah : null,
                role === 'pengurus' ? id_pengurus : null
            ]
        );

        res.status(201).json({
            message: 'Akun berhasil ditambahkan',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Username atau relasi akun sudah terdaftar'
            });
        }

        if (error.code === '23503') {
            return res.status(404).json({
                message: 'Data nasabah atau pengurus tidak ditemukan'
            });
        }

        res.status(500).json({
            message: 'Gagal menambahkan akun',
            error: error.message
        });
    }
};

const updateAkun = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, status_akun } = req.body;

        if (!username || !username.trim()) {
            return res.status(400).json({
                message: 'Username wajib diisi'
            });
        }

        if (status_akun && !['aktif', 'nonaktif'].includes(status_akun)) {
            return res.status(400).json({
                message: 'Status akun harus aktif atau nonaktif'
            });
        }

        if (password !== undefined && password.length < 8) {
            return res.status(400).json({
                message: 'Password minimal 8 karakter'
            });
        }

        const akunLama = await pool.query(
            `SELECT id_akun
             FROM akun
             WHERE id_akun = $1`,
            [id]
        );

        if (akunLama.rows.length === 0) {
            return res.status(404).json({
                message: 'Akun tidak ditemukan'
            });
        }

        let result;

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);

            result = await pool.query(
                `UPDATE akun
                 SET username = $1,
                     password = $2,
                     status_akun = COALESCE($3, status_akun)
                 WHERE id_akun = $4
                 RETURNING id_akun, username, role, status_akun, created_at, id_nasabah, id_pengurus`,
                [username.trim(), passwordHash, status_akun || null, id]
            );
        } else {
            result = await pool.query(
                `UPDATE akun
                 SET username = $1,
                     status_akun = COALESCE($2, status_akun)
                 WHERE id_akun = $3
                 RETURNING id_akun, username, role, status_akun, created_at, id_nasabah, id_pengurus`,
                [username.trim(), status_akun || null, id]
            );
        }

        res.status(200).json({
            message: 'Akun berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Username sudah digunakan'
            });
        }

        res.status(500).json({
            message: 'Gagal memperbarui akun',
            error: error.message
        });
    }
};

const deleteAkun = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM akun
             WHERE id_akun = $1
             RETURNING id_akun, username, role`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Akun tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Akun berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal menghapus akun',
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username dan password wajib diisi'
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'JWT_SECRET belum dikonfigurasi'
            });
        }

        const result = await pool.query(`
            SELECT
                a.id_akun,
                a.username,
                a.password,
                a.role,
                a.status_akun,
                a.id_nasabah,
                n.nama_nasabah,
                a.id_pengurus,
                p.nama_pengurus
            FROM akun a
            LEFT JOIN nasabah n
                ON a.id_nasabah = n.id_nasabah
            LEFT JOIN pengurus p
                ON a.id_pengurus = p.id_pengurus
            WHERE a.username = $1
        `, [username.trim()]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Username atau password salah'
            });
        }

        const akun = result.rows[0];

        if (akun.status_akun !== 'aktif') {
            return res.status(403).json({
                message: 'Akun tidak aktif'
            });
        }

        const passwordCocok = await bcrypt.compare(
            password,
            akun.password
        );

        if (!passwordCocok) {
            return res.status(401).json({
                message: 'Username atau password salah'
            });
        }

        const token = jwt.sign(
            {
                id_akun: akun.id_akun,
                username: akun.username,
                role: akun.role,
                id_nasabah: akun.id_nasabah,
                id_pengurus: akun.id_pengurus
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login berhasil',
            token,
            data: {
                id_akun: akun.id_akun,
                username: akun.username,
                role: akun.role,
                id_nasabah: akun.id_nasabah,
                nama_nasabah: akun.nama_nasabah,
                id_pengurus: akun.id_pengurus,
                nama_pengurus: akun.nama_pengurus
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal melakukan login',
            error: error.message
        });
    }
};

module.exports = {
    getAllAkun,
    getAkunById,
    createAkun,
    updateAkun,
    deleteAkun,
    login
};
