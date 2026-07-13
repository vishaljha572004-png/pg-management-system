import bcrypt from 'bcrypt';
import pool from '../config/db.js';

export const inviteStudent = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const adminPgId = req.user.pg_id; 
    const role = req.user.role;

    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized. Only admins can onboard students.' });
    }

    if (!adminPgId) {
      return res.status(403).json({ message: 'Unauthorized. Admin not associated with a PG.' });
    }

    
    const [existing] = await pool.execute('SELECT id FROM users WHERE phone = ? AND pg_id = ?', [phone, adminPgId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A student with this phone number already exists in this PG.' });
    }

    
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    
    const [pgData] = await pool.execute('SELECT org_code, name FROM pgs WHERE id = ?', [adminPgId]);
    const orgCode = pgData[0].org_code;
    const pgName = pgData[0].name;

    
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, phone, password_hash, role_id, pg_id) 
       VALUES (?, ?, ?, ?, (SELECT id FROM roles WHERE name = 'Student'), ?)`,
      [name, email || null, phone, password_hash, adminPgId]
    );

    
    console.log(`
      --- SIMULATED INVITATION SMS ---
      Welcome to ${pgName}!
      Website: rentweb.com
      Organization Code: ${orgCode}
      Mobile: ${phone}
      Temporary Password: ${tempPassword}
      ---------------------------------
    `);

    res.status(201).json({ 
      message: 'Student invited successfully. Invitation sent.', 
      studentId: result.insertId,
      simulatedInvite: {
        orgCode,
        phone,
        tempPassword
      }
    });
  } catch (error) {
    console.error('Invite Student Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
