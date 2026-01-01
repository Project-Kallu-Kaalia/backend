const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const shipmentController = require('../controllers/shipmentController');
const userController = require('../controllers/userController');

// Shipment routes
router.post('/shipments', auth.protect, shipmentController.createShipment);
router.get('/shipments', auth.protect, shipmentController.getUserShipments);

// Profile routes
router.get('/profile', auth.protect, userController.getUserProfile);
router.put('/profile', auth.protect, userController.updateUserProfile);
router.put('/password', auth.protect, userController.updatePassword);

// Stats route
router.get('/stats', auth.protect, userController.getUserStats);

module.exports = router;