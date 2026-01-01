const Shipment = require('../models/Shipment');

// Track shipment by tracking ID (Public route)
exports.trackShipment = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const shipment = await Shipment.findByTrackingId(trackingId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Tracking number not found in our system'
      });
    }

    const timeline = await Shipment.getTimeline(shipment.id);
    const progress = Shipment.getProgressPercentage(shipment.status);

    res.json({
      success: true,
      data: {
        id: shipment.tracking_id,
        status: shipment.status,
        progress,
        eta: shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : 'TBD',
        origin: {
          city: shipment.sender_city,
          code: Shipment.getCityCode(shipment.sender_city)
        },
        destination: {
          city: shipment.receiver_city,
          code: Shipment.getCityCode(shipment.receiver_city),
          address: shipment.receiver_address
        },
        details: {
          weight: shipment.weight ? `${shipment.weight} kg` : 'N/A',
          service: shipment.package_type,
          pieces: 1,
          description: shipment.description
        },
        history: timeline.map((t, index) => ({
          status: t.status,
          loc: t.location,
          description: t.description,
          time: new Date(t.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          date: new Date(t.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          active: index === 0
        }))
      }
    });
  } catch (error) {
    console.error('Track shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track shipment',
      error: error.message
    });
  }
};

// Create shipment (User)
exports.createShipment = async (req, res) => {
  try {
    const {
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      weight,
      packageType,
      description
    } = req.body;

    const userId = req.user.id;

    const shipmentId = await Shipment.create({
      userId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      weight,
      packageType,
      description
    });

    const shipment = await Shipment.findById(shipmentId);

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      shipment
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get user's shipments
exports.getUserShipments = async (req, res) => {
  try {
    const userId = req.user.id;
    const shipments = await Shipment.findByUserId(userId);

    res.json({
      success: true,
      shipments
    });
  } catch (error) {
    console.error('Get user shipments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get all shipments (Admin/Agent)
exports.getAllShipments = async (req, res) => {
  try {
    let shipments;
    
    if (req.user.role === 'agent') {
      // Agent sees only assigned shipments
      shipments = await Shipment.findByAgentId(req.user.id);
    } else {
      // Admin sees all shipments
      shipments = await Shipment.findAll();
    }

    res.json({
      success: true,
      shipments
    });
  } catch (error) {
    console.error('Get all shipments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get shipment details (Admin/Agent)
exports.getShipmentDetails = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const shipment = await Shipment.findByTrackingId(trackingId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Agent can only see assigned shipments
    if (req.user.role === 'agent' && shipment.agent_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const timeline = await Shipment.getTimeline(shipment.id);

    res.json({
      success: true,
      shipment: {
        ...shipment,
        timeline
      }
    });
  } catch (error) {
    console.error('Get shipment details error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update shipment status (Admin/Agent)
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { status, location, description } = req.body;

    const shipment = await Shipment.findByTrackingId(trackingId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Agent can only update assigned shipments
    if (req.user.role === 'agent' && shipment.agent_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Shipment.updateStatus(trackingId, status, location, description);

    res.json({
      success: true,
      message: 'Shipment status updated'
    });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Assign agent to shipment (Admin only)
exports.assignAgent = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { agentId } = req.body;

    await Shipment.assignAgent(trackingId, agentId);

    res.json({
      success: true,
      message: 'Agent assigned successfully'
    });
  } catch (error) {
    console.error('Assign agent error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};