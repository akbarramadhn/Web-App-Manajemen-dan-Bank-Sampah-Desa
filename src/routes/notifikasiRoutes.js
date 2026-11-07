const express = require('express');
const router = express.Router();

const notifikasiController = require('../controllers/notifikasiController');

router.get('/', notifikasiController.getAllNotifikasi);
router.get('/nasabah/:id_nasabah', notifikasiController.getNotifikasiByNasabah);
router.get('/:id', notifikasiController.getNotifikasiById);

router.post('/', notifikasiController.createNotifikasi);
router.put('/:id', notifikasiController.updateNotifikasi);
router.delete('/:id', notifikasiController.deleteNotifikasi);

module.exports = router;