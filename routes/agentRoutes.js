const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const shipmentController = require('../controllers/shipmentController');

// Middleware to check if user is agent or admin
const isAgentOrAdmin = (req, res, next) => {
  if (req.user.role !== 'agent' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Agent or Admin only.'
    });
  }
  next();
};

// Agent routes
router.get('/shipments', auth.protect, isAgentOrAdmin, shipmentController.getAllShipments);
router.get('/shipments/:trackingId', auth.protect, isAgentOrAdmin, shipmentController.getShipmentDetails);
router.put('/shipments/:trackingId/status', auth.protect, isAgentOrAdmin, shipmentController.updateShipmentStatus);

module.exports = router;