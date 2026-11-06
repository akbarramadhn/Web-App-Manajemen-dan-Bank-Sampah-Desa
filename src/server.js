const express = require('express');
const transaksiRoutes = require('./routes/transaksiRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/transaksi', transaksiRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'API Bank Sampah Desa berhasil berjalan!'
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});