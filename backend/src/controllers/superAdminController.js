import { UserModel } from '../models/userModel.js';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';

// --- PG Management ---

import { generateOrgCode } from '../utils/generateOrgCode.js';

export const createPG = async (req, res) => {
  try {
    const { name, owner_name, contact_number, email } = req.body;
    let org_code = generateOrgCode(name);
    
    // Ensure org code uniqueness
    let isUnique = false;
    while (!isUnique) {
      const [existing] = await pool.execute('SELECT id FROM pgs WHERE org_code = ?', [org_code]);
      if (existing.length === 0) {
        isUnique = true;
      } else {
        org_code = generateOrgCode(name);
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO pgs (name, org_code, owner_name, contact_number, email) VALUES (?, ?, ?, ?, ?)',
      [name, org_code, owner_name, contact_number, email]
    );

    res.status(201).json({ message: 'PG created successfully', pgId: result.insertId, org_code });
  } catch (error) {
    console.error('Create PG Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPGs = async (req, res) => {
  try {
    const [pgs] = await pool.execute(`
      SELECT 
        p.id, p.name, p.org_code, p.owner_name, p.contact_number, p.email, p.status, p.created_at,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Student') as total_students,
        (SELECT name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Admin' LIMIT 1) as admin_name,
        (SELECT email FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Admin' LIMIT 1) as admin_email,
        (SELECT phone FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Admin' LIMIT 1) as admin_phone,
        (SELECT COUNT(*) FROM rooms r WHERE r.pg_id = p.id) as total_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'occupied') as occupied_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'available') as available_rooms
      FROM pgs p
      ORDER BY p.created_at DESC
    `);
    res.json(pgs);
  } catch (error) {
    console.error('Get PGs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getHostelDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get basic PG details and stats
    const [pgRows] = await pool.execute(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Student') as total_students,
        (SELECT COUNT(*) FROM rooms r WHERE r.pg_id = p.id) as total_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'occupied') as occupied_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'available') as available_rooms,
        (SELECT IFNULL(SUM(amount), 0) FROM rent_payments rp WHERE rp.pg_id = p.id AND rp.status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM complaints c WHERE c.pg_id = p.id AND c.status = 'open') as open_complaints
      FROM pgs p WHERE p.id = ?
    `, [id]);

    if (pgRows.length === 0) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    const pg = pgRows[0];

    // Get Admins for this PG
    const [admins] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at 
      FROM users u JOIN roles r ON u.role_id = r.id 
      WHERE u.pg_id = ? AND r.name = 'Admin'
    `, [id]);

    // Get Students for this PG
    const [students] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, b.bed_number, r.room_number 
      FROM users u 
      JOIN roles ro ON u.role_id = ro.id 
      LEFT JOIN beds b ON u.id = b.student_id 
      LEFT JOIN rooms r ON b.room_id = r.id 
      WHERE u.pg_id = ? AND ro.name = 'Student'
      ORDER BY u.created_at DESC
      LIMIT 50
    `, [id]); // Limiting to 50 for quick summary view

    res.json({
      hostel: pg,
      admins,
      students
    });
  } catch (error) {
    console.error('Get Hostel Details Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePGStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.execute('UPDATE pgs SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'PG status updated successfully' });
  } catch (error) {
    console.error('Update PG Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deletePG = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM pgs WHERE id = ?', [id]);
    res.json({ message: 'PG deleted successfully' });
  } catch (error) {
    console.error('Delete PG Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Admin Management ---

export const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, pg_id } = req.body;

    if (!pg_id) {
      return res.status(400).json({ message: 'pg_id is required to create an Admin' });
    }

    const existingUser = await UserModel.findByEmail(email, pg_id);
    const existingPhone = await UserModel.findByPhone(phone, pg_id);
    
    // Globally, admins shouldn't share emails/phones even across PGs to avoid login confusion, but let's enforce it locally at least.
    // Wait, the migration script created unique (phone, pg_id) so it will enforce uniqueness at DB level.
    if (existingUser || existingPhone) {
      return res.status(400).json({ message: 'User with this email or phone already exists in this PG' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const adminId = await UserModel.create({
      name,
      email,
      phone,
      password_hash,
      role_name: 'Admin',
      pg_id
    });

    res.status(201).json({ message: 'Admin created successfully', adminId });
  } catch (error) {
    console.error('Create Admin Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const [admins] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, p.name as pg_name, p.org_code FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN pgs p ON u.pg_id = p.id WHERE r.name = ?',
      ['Admin']
    );
    res.json(admins);
  } catch (error) {
    console.error('Get Admins Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Admin status updated successfully' });
  } catch (error) {
    console.error('Update Admin Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete Admin Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
