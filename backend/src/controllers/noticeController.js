import pool from '../config/db.js';


export const getNotices = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const pg_id = req.user.pg_id;
    
    if (role === 'Admin') {
      const [rows] = await pool.execute('SELECT * FROM notices WHERE pg_id = ? ORDER BY is_pinned DESC, created_at DESC', [pg_id]);
      return res.json(rows);
    }
    
    
    const [bed] = await pool.execute('SELECT room_id FROM beds WHERE student_id = ?', [userId]);
    const roomId = bed.length > 0 ? bed[0].room_id : null;
    
    const query = `
      SELECT * FROM notices 
      WHERE pg_id = ? AND (
         (target_type = 'all') 
         OR (target_type = 'individual' AND target_id = ?) 
         OR (target_type = 'room' AND target_id = ?)
      ) AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
      ORDER BY is_pinned DESC, created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [pg_id, userId, roomId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const createNotice = async (req, res) => {
  try {
    const { title, description, target_type, target_id, is_pinned, expiry_date } = req.body;
    const pg_id = req.user.pg_id;
    
    const [result] = await pool.execute(`
      INSERT INTO notices (title, description, target_type, target_id, is_pinned, expiry_date, pg_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, description, target_type || 'all', target_id || null, is_pinned || false, expiry_date || null, pg_id]);
    
    
    if (target_type === 'individual' && target_id) {
      await pool.execute('INSERT INTO notifications (user_id, title, message, type, pg_id) VALUES (?, ?, ?, ?, ?)', [target_id, 'New Notice: ' + title, description, 'notice', pg_id]);
    } else if (target_type === 'room' && target_id) {
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id) 
        SELECT student_id, ?, ?, 'notice', ? FROM beds WHERE room_id = ? AND student_id IS NOT NULL AND pg_id = ?
      `, ['New Notice: ' + title, description, pg_id, target_id, pg_id]);
    } else {
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id) 
        SELECT id, ?, ?, 'notice', ? FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Student') AND status IN ('verified', 'active', 'notice_period') AND pg_id = ?
      `, ['New Notice: ' + title, description, pg_id, pg_id]);
    }

    res.status(201).json({ message: 'Notice created successfully' });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const pg_id = req.user.pg_id;
    await pool.execute('DELETE FROM notices WHERE id = ? AND pg_id = ?', [id, pg_id]);
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
