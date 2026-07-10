import pool from '../config/db.js';

// Get all pending profile verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.status, sp.*
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE r.name = 'Student' AND (sp.profile_status = 'submitted' OR sp.police_status = 'submitted') AND u.pg_id = ?
    `, [pg_id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve or reject identity verification
export const verifyIdentity = async (req, res) => {
  try {
    const { studentId, action, remarks } = req.body; // action: 'approve' or 'reject'
    const pg_id = req.user.pg_id;
    if (!studentId || !action) return res.status(400).json({ message: 'Missing required fields' });

    if (action === 'approve') {
      await pool.execute("UPDATE users SET status = 'verified' WHERE id = ? AND pg_id = ?", [studentId, pg_id]);
      await pool.execute("UPDATE student_profiles SET profile_status = 'approved' WHERE user_id = ? AND user_id IN (SELECT id FROM users WHERE pg_id = ?)", [studentId, pg_id]);
      
      // Notify student
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id)
        VALUES (?, 'Profile Approved', 'Your identity verification has been approved. You can now access the full dashboard.', 'verification', ?)
      `, [studentId, pg_id]);
      
      res.json({ message: 'Identity verification approved' });
    } else if (action === 'reject') {
      await pool.execute("UPDATE student_profiles SET profile_status = 'rejected', rejection_reason = ? WHERE user_id = ? AND user_id IN (SELECT id FROM users WHERE pg_id = ?)", [remarks || 'Invalid documents', studentId, pg_id]);
      // Just notify them to re-upload. Keep users.status pending.
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id)
        VALUES (?, 'Profile Rejected', 'Your identity verification was rejected. Reason: ${remarks || 'Invalid documents'}. Please update your profile.', 'verification', ?)
      `, [studentId, pg_id]);
      
      res.json({ message: 'Identity verification rejected' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error verifying identity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve or reject police verification
export const verifyPolice = async (req, res) => {
  try {
    const { studentId, action, remarks } = req.body;
    const pg_id = req.user.pg_id;
    
    if (action === 'approve') {
      await pool.execute("UPDATE student_profiles SET police_status = 'approved', police_remarks = ? WHERE user_id = ? AND user_id IN (SELECT id FROM users WHERE pg_id = ?)", [remarks || '', studentId, pg_id]);
      
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id)
        VALUES (?, 'Police Verification Approved', 'Your police verification documents have been approved.', 'police_verification', ?)
      `, [studentId, pg_id]);
      
      res.json({ message: 'Police verification approved' });
    } else if (action === 'reject') {
      await pool.execute("UPDATE student_profiles SET police_status = 'rejected', police_remarks = ? WHERE user_id = ? AND user_id IN (SELECT id FROM users WHERE pg_id = ?)", [remarks || '', studentId, pg_id]);
      
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id)
        VALUES (?, 'Police Verification Rejected', 'Your police verification was rejected. Reason: ${remarks}. Please re-submit.', 'police_verification', ?)
      `, [studentId, pg_id]);
      
      res.json({ message: 'Police verification rejected' });
    }
  } catch (error) {
    console.error('Error verifying police:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Vacate Student
export const vacateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { exit_reason } = req.body;
    const pg_id = req.user.pg_id;

    // 1. Mark as vacated and save exit reason
    await pool.execute("UPDATE users SET status = 'vacated' WHERE id = ? AND pg_id = ?", [id, pg_id]);
    await pool.execute("UPDATE student_profiles SET exit_date = CURRENT_DATE, exit_reason = ? WHERE user_id = ? AND user_id IN (SELECT id FROM users WHERE pg_id = ?)", [exit_reason || 'No reason provided', id, pg_id]);
    
    // 2. Release room & bed
    await pool.execute("UPDATE beds SET status = 'available', student_id = NULL WHERE student_id = ? AND pg_id = ?", [id, pg_id]);
    
    // Stop billing happens automatically since status is 'vacated' and they have no bed.

    // Notify student
    await pool.execute(`
      INSERT INTO notifications (user_id, title, message, type, pg_id)
      VALUES (?, 'Room Vacated', 'You have been vacated from your room by the admin.', 'system', ?)
    `, [id, pg_id]);

    res.json({ message: 'Student vacated successfully. Bed released.' });
  } catch (error) {
    console.error('Error vacating student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove Student
export const removeStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'soft' or 'permanent'
    const pg_id = req.user.pg_id;

    if (type === 'permanent') {
      // Check pending payments
      const [pendingPayments] = await pool.execute(`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM rent_payments WHERE student_id = ? AND status IN ('pending', 'overdue')
          UNION ALL
          SELECT e.id FROM electricity_bills e JOIN beds b ON e.room_id = b.room_id WHERE b.student_id = ? AND e.status IN ('pending', 'overdue')
        ) as t
      `, [id, id]);

      if (pendingPayments[0].count > 0) {
        return res.status(400).json({ message: 'Cannot permanently delete. Student has pending dues.' });
      }

      // Release room & bed
      await pool.execute("UPDATE beds SET status = 'available', student_id = NULL WHERE student_id = ? AND pg_id = ?", [id, pg_id]);
      
      await pool.execute("DELETE FROM users WHERE id = ? AND pg_id = ?", [id, pg_id]);
      res.json({ message: 'Student permanently deleted' });
    } else {
      // Soft delete
      await pool.execute("UPDATE users SET status = 'removed' WHERE id = ? AND pg_id = ?", [id, pg_id]);
      await pool.execute("UPDATE beds SET status = 'available', student_id = NULL WHERE student_id = ? AND pg_id = ?", [id, pg_id]);
      
      // Notify student
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id)
        VALUES (?, 'Account Access Removed', 'Your access to the hostel system has been restricted by the admin.', 'system', ?)
      `, [id, pg_id]);
      
      res.json({ message: 'Student access removed (Soft Delete)' });
    }
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
