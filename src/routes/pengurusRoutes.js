const express = require('express');
const router = express.Router();

const pengurusController = require('../controllers/pengurusController');

router.get('/', pengurusController.getAllPengurus);
router.get('/:id', pengurusController.getPengurusById);
router.post('/', pengurusController.createPengurus);
router.put('/:id', pengurusController.updatePengurus);
router.delete('/:id', pengurusController.deletePengurus);

module.exports = router;