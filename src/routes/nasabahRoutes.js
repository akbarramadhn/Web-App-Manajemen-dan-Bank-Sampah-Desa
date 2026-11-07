const express = require('express');
const router = express.Router();

const nasabahController = require('../controllers/nasabahController');

router.get('/', nasabahController.getAllNasabah);
router.get('/:id', nasabahController.getNasabahById);
router.post('/', nasabahController.createNasabah);
router.put('/:id', nasabahController.updateNasabah);
router.delete('/:id', nasabahController.deleteNasabah);

module.exports = router;