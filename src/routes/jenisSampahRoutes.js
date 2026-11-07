const express = require('express');
const router = express.Router();

const jenisSampahController = require('../controllers/jenisSampahController');

router.get('/', jenisSampahController.getAllJenisSampah);
router.get('/:id', jenisSampahController.getJenisSampahById);
router.post('/', jenisSampahController.createJenisSampah);
router.put('/:id', jenisSampahController.updateJenisSampah);
router.delete('/:id', jenisSampahController.deleteJenisSampah);

module.exports = router;