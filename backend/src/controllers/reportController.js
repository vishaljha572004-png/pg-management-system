import pool from '../config/db.js';

export const getFinancialReport = async (req, res) => {
  try {
    
    const [revenueData] = await pool.execute(`
      SELECT billing_month, 
             SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
             SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
      FROM rent_payments
      GROUP BY billing_month
      ORDER BY MIN(id) ASC
      LIMIT 12
    `);

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching financial report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOccupancyReport = async (req, res) => {
  try {
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(id) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching occupancy report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getComplaintReport = async (req, res) => {
  try {
    
    const [complaintStats] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM complaints
      GROUP BY status
    `);
    
    res.json(complaintStats);
  } catch (error) {
    console.error('Error fetching complaint report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
