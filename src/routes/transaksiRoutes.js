
const express = require('express');
const router = express.Router();

const transaksiController = require('../controllers/transaksiController');

// GET
router.get('/', transaksiController.getAllTransaksi);
router.get('/nasabah/:nama', transaksiController.getTransaksiByNasabah);
router.get('/:id', transaksiController.getTransaksiById);

// POST
router.post('/', transaksiController.createTransaksi);

// PUT
router.put('/:id', transaksiController.updateTransaksi);

// DELETE
router.delete('/:id', transaksiController.deleteTransaksi);

module.exports = router;
