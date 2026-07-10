import pool from '../config/db.js';

// --- Student: Raise a new complaint ---
export const raiseComplaint = async (req, res) => {
  try {
    const { title, description } = req.body;
    const student_id = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const pg_id = req.user.pg_id;

    await pool.execute(
      'INSERT INTO complaints (student_id, title, description, status, pg_id) VALUES (?, ?, ?, ?, ?)',
      [student_id, title, description, 'open', pg_id]
    );

    res.status(201).json({ message: 'Complaint raised successfully' });
  } catch (error) {
    console.error('Error raising complaint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Student: Get my complaints ---
export const getMyComplaints = async (req, res) => {
  try {
    const student_id = req.user.id;
    const [complaints] = await pool.execute(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [student_id]
    );
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching student complaints:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Admin: Get all complaints ---
export const getAllComplaints = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    const [complaints] = await pool.execute(`
      SELECT c.*, u.name as student_name, r.room_number, b.bed_number 
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN beds b ON b.student_id = u.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE c.pg_id = ?
      ORDER BY c.created_at DESC
    `, [pg_id]);
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Admin: Update complaint status ---
export const updateComplaintStatus = async (req, res) => {
  try {
    const { complaint_id, status, resolution_remark } = req.body;
    const pg_id = req.user.pg_id;

    if (!complaint_id || !status) {
      return res.status(400).json({ message: 'Complaint ID and status are required' });
    }

    const [result] = await pool.execute(
      'UPDATE complaints SET status = ?, resolution_remark = ? WHERE id = ? AND pg_id = ?',
      [status, resolution_remark || null, complaint_id, pg_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Get student_id to notify
    const [complaintData] = await pool.execute('SELECT student_id, title FROM complaints WHERE id = ?', [complaint_id]);
    if (complaintData.length > 0) {
      const { student_id, title } = complaintData[0];
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [student_id, 'Complaint Status Updated', `Your complaint "${title}" is now marked as ${status}. ${resolution_remark ? 'Remark: ' + resolution_remark : ''}`, 'system']
      );
    }

    res.json({ message: 'Complaint status updated successfully' });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
