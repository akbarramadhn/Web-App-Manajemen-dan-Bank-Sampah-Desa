const express = require('express');

const akunRoutes = require('./routes/akunRoutes');
const nasabahRoutes = require('./routes/nasabahRoutes');
const pengurusRoutes = require('./routes/pengurusRoutes');
const jenisSampahRoutes = require('./routes/jenisSampahRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const saldoRoutes = require('./routes/saldoRoutes');
const buktiRoutes = require('./routes/buktiRoutes');
const notifikasiRoutes = require('./routes/notifikasiRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/akun', akunRoutes);
app.use('/nasabah', nasabahRoutes);
app.use('/pengurus', pengurusRoutes);
app.use('/jenis-sampah', jenisSampahRoutes);
app.use('/transaksi', transaksiRoutes);
app.use('/saldo', saldoRoutes);
app.use('/bukti', buktiRoutes);
app.use('/notifikasi', notifikasiRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'API Bank Sampah Desa berhasil berjalan!'
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});