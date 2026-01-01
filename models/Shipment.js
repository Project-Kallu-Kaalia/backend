const db = require('../config/db');

class Shipment {
  // Generate tracking ID
  static generateTrackingId() {
    const prefix = 'TRK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Create new shipment
  static async create(shipmentData) {
    const {
      userId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      weight,
      packageType,
      description
    } = shipmentData;

    const trackingId = this.generateTrackingId();

    // Get sender info from user
    const [users] = await db.query('SELECT name, phone, email, address, city FROM users WHERE id = ?', [userId]);
    const sender = users[0];

    if (!sender) {
      throw new Error('User not found');
    }

    const [result] = await db.query(
      `INSERT INTO shipments (
        tracking_id, sender_id, sender_name, sender_phone, sender_email, sender_address, sender_city,
        receiver_name, receiver_phone, receiver_address, receiver_city, 
        weight, package_type, description, status, booking_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Booked', CURDATE())`,
      [
        trackingId, userId, sender.name, sender.phone, sender.email, sender.address, sender.city,
        recipientName, recipientPhone, recipientAddress, recipientCity,
        weight, packageType, description
      ]
    );

    // Add initial timeline entry
    await db.query(
      `INSERT INTO shipment_timeline (shipment_id, status, location, description, timestamp, created_by)
       VALUES (?, 'Booked', ?, 'Shipment booked successfully', NOW(), ?)`,
      [result.insertId, sender.city, userId]
    );

    return result.insertId;
  }

  // Find shipment by ID
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM shipments WHERE id = ?', [id]);
    return rows[0];
  }

  // Find shipment by tracking ID
  static async findByTrackingId(trackingId) {
    const [rows] = await db.query(
      `SELECT * FROM shipments WHERE tracking_id = ?`,
      [trackingId]
    );
    return rows[0];
  }

  // Find shipments by user ID (sender_id in shipments table)
  static async findByUserId(userId) {
    const [rows] = await db.query(
      `SELECT * FROM shipments WHERE sender_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  // Find all shipments (Admin)
  static async findAll() {
    const [rows] = await db.query(
      `SELECT s.*, u.name as sender_name_user, u.email as sender_email_user 
       FROM shipments s 
       LEFT JOIN users u ON s.sender_id = u.id 
       ORDER BY s.created_at DESC`
    );
    return rows;
  }

  // Find shipments by agent ID
  static async findByAgentId(agentId) {
    const [rows] = await db.query(
      `SELECT s.*, u.name as sender_name_user 
       FROM shipments s 
       LEFT JOIN users u ON s.sender_id = u.id 
       WHERE s.agent_id = ? 
       ORDER BY s.created_at DESC`,
      [agentId]
    );
    return rows;
  }

  // Update shipment status
  static async updateStatus(trackingId, status, location, description) {
    const shipment = await this.findByTrackingId(trackingId);
    
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    await db.query(
      `UPDATE shipments SET status = ?, updated_at = NOW() WHERE tracking_id = ?`,
      [status, trackingId]
    );

    // Add timeline entry
    await db.query(
      `INSERT INTO shipment_timeline (shipment_id, status, location, description, timestamp)
       VALUES (?, ?, ?, ?, NOW())`,
      [shipment.id, status, location, description]
    );
  }

  // Assign agent to shipment
  static async assignAgent(trackingId, agentId) {
    await db.query(
      `UPDATE shipments SET agent_id = ?, updated_at = NOW() WHERE tracking_id = ?`,
      [agentId, trackingId]
    );
  }

  // Get shipment timeline
  static async getTimeline(shipmentId) {
    const [rows] = await db.query(
      `SELECT * FROM shipment_timeline 
       WHERE shipment_id = ? 
       ORDER BY timestamp DESC`,
      [shipmentId]
    );
    return rows;
  }

  // Calculate progress percentage
  static getProgressPercentage(status) {
    const progressMap = {
      'Booked': 10,
      'Picked Up': 30,
      'In-Transit': 60,
      'Out for Delivery': 85,
      'Delivered': 100
    };
    return progressMap[status] || 0;
  }

  // Get city code (first 3 letters uppercase)
  static getCityCode(city) {
    return city.substring(0, 3).toUpperCase();
  }
}

module.exports = Shipment;