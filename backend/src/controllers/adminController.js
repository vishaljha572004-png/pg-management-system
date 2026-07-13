import pool from '../config/db.js';

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    const [studentRows] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) as activeStudents,
        SUM(CASE WHEN u.status = 'pending' THEN 1 ELSE 0 END) as pendingVerification,
        SUM(CASE WHEN u.status = 'vacated' THEN 1 ELSE 0 END) as vacatedStudents,
        SUM(CASE WHEN u.status = 'removed' THEN 1 ELSE 0 END) as removedStudents,
        COUNT(*) as totalStudents
      FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Student' AND u.pg_id = ?
    `, [pg_id]);
    const stats = studentRows[0];

    
    const [roomRows] = await pool.execute(`SELECT COUNT(*) as count FROM rooms WHERE pg_id = ?`, [pg_id]);
    const totalRooms = roomRows[0].count;

    const [bedRows] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableBeds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupiedBeds
      FROM beds WHERE pg_id = ?
    `, [pg_id]);
    const availableBeds = bedRows[0].availableBeds || 0;
    const occupiedBeds = bedRows[0].occupiedBeds || 0;

    
    const [rentRows] = await pool.execute(`
      SELECT COUNT(*) as count, IFNULL(SUM(amount), 0) as totalPending 
      FROM rent_payments 
      WHERE (status = 'pending' OR status = 'overdue') AND pg_id = ?
    `, [pg_id]);
    const pendingRentCount = rentRows[0].count;
    const totalPendingAmount = rentRows[0].totalPending;

    
    const [complaintRows] = await pool.execute(`SELECT COUNT(*) as count FROM complaints WHERE status = 'open' AND pg_id = ?`, [pg_id]);
    const openComplaints = complaintRows[0].count;

    
    const [policeRows] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM student_profiles sp 
      JOIN users u ON sp.user_id = u.id 
      WHERE sp.police_status = 'submitted' AND u.pg_id = ?
    `, [pg_id]);
    const pendingPoliceVerification = policeRows[0].count;

    
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const [revenueRows] = await pool.execute(`
      SELECT IFNULL(SUM(amount), 0) as revenue 
      FROM rent_payments 
      WHERE status = 'paid' AND billing_month = ? AND pg_id = ?
    `, [currentMonth, pg_id]);
    const monthlyRevenue = revenueRows[0].revenue;

    
    const [pgRows] = await pool.execute('SELECT name, org_code FROM pgs WHERE id = ?', [pg_id]);
    const pgName = pgRows[0]?.name || 'My PG';
    const orgCode = pgRows[0]?.org_code || '';

    res.json({
      totalStudents: stats.totalStudents,
      activeStudents: stats.activeStudents || 0,
      pendingVerification: stats.pendingVerification || 0,
      vacatedStudents: stats.vacatedStudents || 0,
      removedStudents: stats.removedStudents || 0,
      pendingPoliceVerification,
      totalRooms,
      availableBeds,
      occupiedBeds,
      pendingRentCount,
      totalPendingAmount,
      openComplaints,
      monthlyRevenue,
      pgName,
      orgCode
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getAllStudents = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    const [students] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at, u.status,
             b.bed_number, r.room_number, r.rent_per_bed
      FROM users u
      JOIN roles ro ON u.role_id = ro.id
      LEFT JOIN beds b ON u.id = b.student_id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE ro.name = 'Student' AND u.pg_id = ?
      ORDER BY u.created_at DESC
    `, [pg_id]);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
