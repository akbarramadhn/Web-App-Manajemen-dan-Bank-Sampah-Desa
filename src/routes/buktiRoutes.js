const express = require('express');
const router = express.Router();

const buktiController = require('../controllers/buktiController');

router.get('/', buktiController.getAllBukti);
router.get('/transaksi/:id_transaksi', buktiController.getBuktiByTransaksi);
router.get('/:id', buktiController.getBuktiById);

router.post('/', buktiController.createBukti);
router.put('/:id', buktiController.updateBukti);
router.delete('/:id', buktiController.deleteBukti);

module.exports = router;