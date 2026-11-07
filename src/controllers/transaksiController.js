const pool = require('../db/db');

const queryTransaksi = `
    SELECT
        t.*,
        n.nama_nasabah,
        COALESCE(
            json_agg(
                json_build_object(
                    'id_detail', d.id_detail,
                    'id_jenis_sampah', d.id_jenis_sampah,
                    'nama_jenis_sampah', j.nama_jenis_sampah,
                    'berat_kg', d.berat_kg,
                    'harga_per_kg', d.harga_per_kg,
                    'subtotal', d.subtotal
                )
                ORDER BY d.id_detail
            ) FILTER (WHERE d.id_detail IS NOT NULL),
            '[]'::json
        ) AS details
    FROM transaksi_bank_sampah t
    JOIN nasabah n
        ON t.id_nasabah = n.id_nasabah
    LEFT JOIN detail_transaksi d
        ON t.id = d.id_transaksi
    LEFT JOIN jenis_sampah j
        ON d.id_jenis_sampah = j.id
`;

const getTransaksiData = async (condition = '', params = []) => {
    const result = await pool.query(`
        ${queryTransaksi}
        ${condition}
        GROUP BY t.id, n.id_nasabah
        ORDER BY t.id ASC
    `, params);

    return result.rows;
};

const getTransaksiByClient = async (client, id) => {
    const result = await client.query(`
        ${queryTransaksi}
        WHERE t.id = $1
        GROUP BY t.id, n.id_nasabah
    `, [id]);

    return result.rows[0];
};

const hitungDetailSetoran = async (client, details) => {
    if (!Array.isArray(details) || details.length === 0) {
        throw new Error('Setoran harus memiliki minimal satu detail sampah');
    }

    const detailValid = [];
    let totalNilai = 0;

    for (const item of details) {
        const idJenisSampah = Number(item.id_jenis_sampah);
        const berat = Number(item.berat_kg);

        if (
            !Number.isInteger(idJenisSampah) ||
            idJenisSampah <= 0 ||
            !Number.isFinite(berat) ||
            berat <= 0
        ) {
            throw new Error('Jenis sampah dan berat harus valid');
        }

        const master = await client.query(
            `SELECT id, harga_per_kg
             FROM jenis_sampah
             WHERE id = $1`,
            [idJenisSampah]
        );

        if (master.rows.length === 0) {
            throw new Error(`Jenis sampah dengan ID ${idJenisSampah} tidak ditemukan`);
        }

        const harga = Number(master.rows[0].harga_per_kg);
        const subtotal = berat * harga;

        detailValid.push({
            id_jenis_sampah: idJenisSampah,
            berat_kg: berat,
            harga_per_kg: harga,
            subtotal
        });

        totalNilai += subtotal;
    }

    return {
        details: detailValid,
        totalNilai
    };
};

const simpanDetailSetoran = async (client, idTransaksi, details) => {
    for (const item of details) {
        await client.query(
            `INSERT INTO detail_transaksi
                (
                    id_transaksi,
                    id_jenis_sampah,
                    berat_kg,
                    harga_per_kg,
                    subtotal
                )
             VALUES ($1, $2, $3, $4, $5)`,
            [
                idTransaksi,
                item.id_jenis_sampah,
                item.berat_kg,
                item.harga_per_kg,
                item.subtotal
            ]
        );
    }
};

const siapkanSaldo = async (client, idNasabah) => {
    await client.query(
        `INSERT INTO saldo_nasabah (id_nasabah, saldo)
         VALUES ($1, 0)
         ON CONFLICT (id_nasabah) DO NOTHING`,
        [idNasabah]
    );
};

const getAllTransaksi = async (req, res) => {
    try {
        const data = await getTransaksiData();

        res.status(200).json({
            message: 'Berhasil mengambil semua data transaksi',
            data
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data transaksi',
            error: error.message
        });
    }
};

const getTransaksiById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await getTransaksiData(
            'WHERE t.id = $1',
            [id]
        );

        if (data.length === 0) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil detail transaksi',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail transaksi',
            error: error.message
        });
    }
};

const getTransaksiByNasabah = async (req, res) => {
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

        const data = await getTransaksiData(
            'WHERE t.id_nasabah = $1',
            [id_nasabah]
        );

        res.status(200).json({
            message: 'Berhasil mengambil transaksi nasabah',
            nama_nasabah: nasabah.rows[0].nama_nasabah,
            data
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil data transaksi nasabah',
            error: error.message
        });
    }
};

const createTransaksi = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {
            kode_transaksi,
            id_nasabah,
            jenis_transaksi,
            details,
            total_nilai,
            keterangan
        } = req.body;

        if (!kode_transaksi || !id_nasabah || !jenis_transaksi) {
            throw new Error('Kode transaksi, ID nasabah, dan jenis transaksi wajib diisi');
        }

        const nasabah = await client.query(
            `SELECT id_nasabah
             FROM nasabah
             WHERE id_nasabah = $1`,
            [id_nasabah]
        );

        if (nasabah.rows.length === 0) {
            throw new Error('Nasabah tidak ditemukan');
        }

        await siapkanSaldo(client, id_nasabah);

        const saldoResult = await client.query(
            `SELECT saldo
             FROM saldo_nasabah
             WHERE id_nasabah = $1
             FOR UPDATE`,
            [id_nasabah]
        );

        const saldoSekarang = Number(saldoResult.rows[0].saldo);

        let nilaiTransaksi;
        let detailValid = [];
        let idJenisSampah = null;
        let berat = null;

        if (jenis_transaksi === 'setoran') {
            const hasil = await hitungDetailSetoran(client, details);

            detailValid = hasil.details;
            nilaiTransaksi = hasil.totalNilai;
            idJenisSampah = detailValid[0].id_jenis_sampah;
            berat = detailValid[0].berat_kg;
        } else if (jenis_transaksi === 'penarikan') {
            nilaiTransaksi = Number(total_nilai);

            if (!Number.isFinite(nilaiTransaksi) || nilaiTransaksi <= 0) {
                throw new Error('Nominal penarikan harus lebih dari 0');
            }

            if (saldoSekarang < nilaiTransaksi) {
                throw new Error('Saldo nasabah tidak mencukupi');
            }
        } else {
            throw new Error('Jenis transaksi harus setoran atau penarikan');
        }

        const transaksi = await client.query(
            `INSERT INTO transaksi_bank_sampah
                (
                    kode_transaksi,
                    id_nasabah,
                    jenis_transaksi,
                    jenis_sampah_id,
                    berat_kg,
                    total_nilai,
                    keterangan
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                kode_transaksi,
                id_nasabah,
                jenis_transaksi,
                idJenisSampah,
                berat,
                nilaiTransaksi,
                keterangan || null
            ]
        );

        const idTransaksi = transaksi.rows[0].id;

        if (jenis_transaksi === 'setoran') {
            await simpanDetailSetoran(client, idTransaksi, detailValid);
        }

        const perubahanSaldo = jenis_transaksi === 'setoran'
            ? nilaiTransaksi
            : -nilaiTransaksi;

        await client.query(
            `UPDATE saldo_nasabah
             SET saldo = saldo + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_nasabah = $2`,
            [perubahanSaldo, id_nasabah]
        );

        const data = await getTransaksiByClient(client, idTransaksi);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Transaksi berhasil ditambahkan',
            data
        });
    } catch (error) {
        await client.query('ROLLBACK');

        res.status(400).json({
            message: 'Gagal menambahkan transaksi',
            error: error.message
        });
    } finally {
        client.release();
    }
};

const updateTransaksi = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { id } = req.params;

        const {
            kode_transaksi,
            id_nasabah,
            jenis_transaksi,
            details,
            total_nilai,
            keterangan
        } = req.body;

        if (!kode_transaksi || !id_nasabah || !jenis_transaksi) {
            throw new Error('Kode transaksi, ID nasabah, dan jenis transaksi wajib diisi');
        }

        const transaksiLama = await client.query(
            `SELECT *
             FROM transaksi_bank_sampah
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (transaksiLama.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        const lama = transaksiLama.rows[0];

        const nasabahBaru = await client.query(
            `SELECT id_nasabah
             FROM nasabah
             WHERE id_nasabah = $1`,
            [id_nasabah]
        );

        if (nasabahBaru.rows.length === 0) {
            throw new Error('Nasabah tidak ditemukan');
        }

        await siapkanSaldo(client, lama.id_nasabah);
        await siapkanSaldo(client, id_nasabah);

        const daftarNasabah = [
            ...new Set([
                Number(lama.id_nasabah),
                Number(id_nasabah)
            ])
        ].sort((a, b) => a - b);

        for (const nasabahId of daftarNasabah) {
            await client.query(
                `SELECT id_saldo
                 FROM saldo_nasabah
                 WHERE id_nasabah = $1
                 FOR UPDATE`,
                [nasabahId]
            );
        }

        const efekLama = lama.jenis_transaksi === 'setoran'
            ? -Number(lama.total_nilai)
            : Number(lama.total_nilai);

        await client.query(
            `UPDATE saldo_nasabah
             SET saldo = saldo + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_nasabah = $2`,
            [efekLama, lama.id_nasabah]
        );

        let nilaiTransaksi;
        let detailValid = [];
        let idJenisSampah = null;
        let berat = null;

        if (jenis_transaksi === 'setoran') {
            const hasil = await hitungDetailSetoran(client, details);

            detailValid = hasil.details;
            nilaiTransaksi = hasil.totalNilai;
            idJenisSampah = detailValid[0].id_jenis_sampah;
            berat = detailValid[0].berat_kg;
        } else if (jenis_transaksi === 'penarikan') {
            nilaiTransaksi = Number(total_nilai);

            if (!Number.isFinite(nilaiTransaksi) || nilaiTransaksi <= 0) {
                throw new Error('Nominal penarikan harus lebih dari 0');
            }
        } else {
            throw new Error('Jenis transaksi harus setoran atau penarikan');
        }

        const saldoBaruResult = await client.query(
            `SELECT saldo
             FROM saldo_nasabah
             WHERE id_nasabah = $1`,
            [id_nasabah]
        );

        const saldoBaru = Number(saldoBaruResult.rows[0].saldo);

        if (
            jenis_transaksi === 'penarikan' &&
            saldoBaru < nilaiTransaksi
        ) {
            throw new Error('Saldo nasabah tidak mencukupi');
        }

        await client.query(
            `DELETE FROM detail_transaksi
             WHERE id_transaksi = $1`,
            [id]
        );

        await client.query(
            `UPDATE transaksi_bank_sampah
             SET
                kode_transaksi = $1,
                id_nasabah = $2,
                jenis_transaksi = $3,
                jenis_sampah_id = $4,
                berat_kg = $5,
                total_nilai = $6,
                keterangan = $7
             WHERE id = $8`,
            [
                kode_transaksi,
                id_nasabah,
                jenis_transaksi,
                idJenisSampah,
                berat,
                nilaiTransaksi,
                keterangan || null,
                id
            ]
        );

        if (jenis_transaksi === 'setoran') {
            await simpanDetailSetoran(client, id, detailValid);
        }

        const efekBaru = jenis_transaksi === 'setoran'
            ? nilaiTransaksi
            : -nilaiTransaksi;

        await client.query(
            `UPDATE saldo_nasabah
             SET saldo = saldo + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_nasabah = $2`,
            [efekBaru, id_nasabah]
        );

        const data = await getTransaksiByClient(client, id);

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Transaksi berhasil diperbarui',
            data
        });
    } catch (error) {
        await client.query('ROLLBACK');

        res.status(400).json({
            message: 'Gagal memperbarui transaksi',
            error: error.message
        });
    } finally {
        client.release();
    }
};

const deleteTransaksi = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { id } = req.params;

        const transaksi = await client.query(
            `SELECT *
             FROM transaksi_bank_sampah
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (transaksi.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
        }

        const dataLama = transaksi.rows[0];

        await siapkanSaldo(client, dataLama.id_nasabah);

        const saldo = await client.query(
            `SELECT saldo
             FROM saldo_nasabah
             WHERE id_nasabah = $1
             FOR UPDATE`,
            [dataLama.id_nasabah]
        );

        const perubahanSaldo = dataLama.jenis_transaksi === 'setoran'
            ? -Number(dataLama.total_nilai)
            : Number(dataLama.total_nilai);

        const saldoAkhir = Number(saldo.rows[0].saldo) + perubahanSaldo;

        if (saldoAkhir < 0) {
            throw new Error('Transaksi tidak dapat dihapus karena saldo sudah digunakan');
        }

        await client.query(
            `UPDATE saldo_nasabah
             SET saldo = saldo + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_nasabah = $2`,
            [perubahanSaldo, dataLama.id_nasabah]
        );

        await client.query(
            `DELETE FROM detail_transaksi
             WHERE id_transaksi = $1`,
            [id]
        );

        await client.query(
            `DELETE FROM bukti_transaksi
             WHERE id_transaksi = $1`,
            [id]
        );

        await client.query(
            `UPDATE notifikasi
             SET id_transaksi = NULL
             WHERE id_transaksi = $1`,
            [id]
        );

        await client.query(
            `DELETE FROM transaksi_bank_sampah
             WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Transaksi berhasil dihapus',
            data: {
                id: dataLama.id,
                kode_transaksi: dataLama.kode_transaksi
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');

        res.status(400).json({
            message: 'Gagal menghapus transaksi',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllTransaksi,
    getTransaksiById,
    getTransaksiByNasabah,
    createTransaksi,
    updateTransaksi,
    deleteTransaksi
};
