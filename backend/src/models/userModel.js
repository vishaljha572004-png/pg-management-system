import pool from '../config/db.js';

export const UserModel = {
  async findByEmail(email, pg_id = undefined) {
    let query = 'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?';
    const params = [email];
    if (pg_id !== undefined) {
      query += ' AND (u.pg_id = ? OR u.pg_id IS NULL)';
      params.push(pg_id);
    }
    const [rows] = await pool.execute(query, params);
    return rows[0];
  },

  async findByPhone(phone, pg_id = undefined) {
    let query = 'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.phone = ?';
    const params = [phone];
    if (pg_id !== undefined) {
      query += ' AND (u.pg_id = ? OR u.pg_id IS NULL)';
      params.push(pg_id);
    }
    const [rows] = await pool.execute(query, params);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT u.id, u.name, u.email, u.phone, u.is_phone_verified, r.name as role, u.profile_photo, u.status, u.pg_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [id]);
    return rows[0];
  },

  async create(user) {
    const { name, email, phone, password_hash, role_name = 'Student', pg_id = null, is_phone_verified = false } = user;
    const normalizedRoleName = role_name?.toString().trim() || 'Student';
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, phone, password_hash, role_id, pg_id, is_phone_verified) VALUES (?, ?, ?, ?, (SELECT id FROM roles WHERE name = ?), ?, ?)`,
      [name, email, phone, password_hash, normalizedRoleName, pg_id, is_phone_verified]
    );
    return result.insertId;
  },

  async updateRefreshToken(id, token) {
    await pool.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [token, id]);
  },

  async clearRefreshToken(id) {
    await pool.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [id]);
  },

  async markPhoneVerified(id) {
    await pool.execute('UPDATE users SET is_phone_verified = TRUE WHERE id = ?', [id]);
  }
};
