const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

// Public route - no auth required
router.get('/:trackingId', shipmentController.trackShipment);

module.exports = router;