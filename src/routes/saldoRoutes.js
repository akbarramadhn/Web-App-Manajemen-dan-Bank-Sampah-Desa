const express = require('express');
const router = express.Router();

const saldoController = require('../controllers/saldoController');

router.get('/', saldoController.getAllSaldo);
router.get('/riwayat/:id_nasabah', saldoController.getRiwayatSaldo);
router.get('/:id_nasabah', saldoController.getSaldoByNasabah);

module.exports = router;