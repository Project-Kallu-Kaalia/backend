const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, address, city, role, status FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Find user by ID with password
  static async findByIdWithPassword(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  // Create new user
  static async create(userData) {
    const { name, email, phone, password, address, city, role = 'user' } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password, address, city, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, address, city, role]
    );
    
    return result.insertId;
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user profile
  static async updateProfile(userId, data) {
    const { name, email, phone, address, city } = data;
    
    await db.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, city = ? WHERE id = ?',
      [name, email, phone, address, city, userId]
    );
  }

  // Update password
  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
  }

  // Get user statistics
  static async getUserStats(userId) {
    // Get total shipments
    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM shipments WHERE sender_id = ?',
      [userId]
    );

    // Get active shipments (not delivered)
    const [activeResult] = await db.query(
      `SELECT COUNT(*) as active FROM shipments 
       WHERE sender_id = ? AND status != 'Delivered'`,
      [userId]
    );

    // Get delivered shipments
    const [deliveredResult] = await db.query(
      `SELECT COUNT(*) as delivered FROM shipments 
       WHERE sender_id = ? AND status = 'Delivered'`,
      [userId]
    );

    return {
      totalShipments: totalResult[0].total,
      activeShipments: activeResult[0].active,
      deliveredShipments: deliveredResult[0].delivered
    };
  }
}

module.exports = User;