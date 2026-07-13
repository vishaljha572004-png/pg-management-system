import pool from '../config/db.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const studentId = req.user.id;

    
    const [bedRows] = await pool.execute(`
      SELECT b.bed_number, r.room_number, r.rent_per_bed, r.id as room_id
      FROM beds b 
      JOIN rooms r ON b.room_id = r.id 
      WHERE b.student_id = ?
    `, [studentId]);
    const roomInfo = bedRows.length > 0 ? bedRows[0] : null;

    
    const [rentRows] = await pool.execute(`
      SELECT amount, billing_month, status, payment_date 
      FROM rent_payments 
      WHERE student_id = ? 
      ORDER BY id DESC LIMIT 1
    `, [studentId]);
    const latestRent = rentRows.length > 0 ? rentRows[0] : null;

    
    const [complaintRows] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE student_id = ? AND status != 'resolved'
    `, [studentId]);
    const activeComplaints = complaintRows[0].count;

    
    let latestElectricity = null;
    if (roomInfo) {
      const [elecRows] = await pool.execute(`
        SELECT amount, billing_month, status, due_date 
        FROM electricity_bills 
        WHERE room_id = ?
        ORDER BY id DESC LIMIT 1
      `, [roomInfo.room_id]);
      latestElectricity = elecRows.length > 0 ? elecRows[0] : null;
    }

    
    const [profileRows] = await pool.execute(`
      SELECT profile_status, police_status 
      FROM student_profiles 
      WHERE user_id = ?
    `, [studentId]);
    const profileStatuses = profileRows.length > 0 ? profileRows[0] : { profile_status: 'incomplete', police_status: 'pending' };

    res.json({
      roomInfo,
      latestRent,
      activeComplaints,
      latestElectricity,
      ...profileStatuses
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
