const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const shipmentController = require('../controllers/shipmentController');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Admin routes
router.get('/shipments', auth.protect, isAdmin, shipmentController.getAllShipments);
router.get('/shipments/:trackingId', auth.protect, isAdmin, shipmentController.getShipmentDetails);
router.put('/shipments/:trackingId/status', auth.protect, isAdmin, shipmentController.updateShipmentStatus);
router.put('/shipments/:trackingId/assign', auth.protect, isAdmin, shipmentController.assignAgent);

module.exports = router;