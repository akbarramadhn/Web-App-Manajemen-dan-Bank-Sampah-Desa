const express = require('express');
const router = express.Router();

const transaksiController = require('../controllers/transaksiController');

router.get('/', transaksiController.getAllTransaksi);
router.get('/nasabah/:id_nasabah', transaksiController.getTransaksiByNasabah);
router.get('/:id', transaksiController.getTransaksiById);

router.post('/', transaksiController.createTransaksi);
router.put('/:id', transaksiController.updateTransaksi);
router.delete('/:id', transaksiController.deleteTransaksi);

module.exports = router;