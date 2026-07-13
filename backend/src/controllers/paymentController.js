import pool from '../config/db.js';


export const submitPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id, type, transaction_id, payment_date } = req.body; 
    
    if (!id || !type || !transaction_id || !payment_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let screenshot_url = null;
    if (req.file) {
      screenshot_url = `/uploads/${req.file.filename}`;
    }

    const table = type === 'rent' ? 'rent_payments' : 'electricity_bills';
    
    
    if (type === 'rent') {
      const [existing] = await pool.execute(`SELECT id, status FROM rent_payments WHERE id = ? AND student_id = ?`, [id, studentId]);
      if (existing.length === 0) return res.status(404).json({ message: 'Record not found' });
      if (existing[0].status === 'paid') return res.status(400).json({ message: 'Already paid' });
    } else {
      
      const [bed] = await pool.execute('SELECT room_id FROM beds WHERE student_id = ?', [studentId]);
      if (bed.length === 0) return res.status(404).json({ message: 'Student not assigned to any bed' });
      const [existing] = await pool.execute(`SELECT id, status FROM electricity_bills WHERE id = ? AND room_id = ?`, [id, bed[0].room_id]);
      if (existing.length === 0) return res.status(404).json({ message: 'Record not found' });
      if (existing[0].status === 'paid') return res.status(400).json({ message: 'Already paid' });
    }

    
    const query = `
      UPDATE ${table} 
      SET status = 'pending_verification', transaction_id = ?, payment_date = ?, screenshot_url = ? 
      WHERE id = ?
    `;
    await pool.execute(query, [transaction_id, payment_date, screenshot_url, id]);

    res.json({ message: 'Payment submitted for verification' });
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const { id, type, action, rejection_reason } = req.body; 
    const pg_id = req.user.pg_id;
    
    if (!id || !type || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const table = type === 'rent' ? 'rent_payments' : 'electricity_bills';

    if (action === 'approve') {
      await pool.execute(`UPDATE ${table} SET status = 'paid' WHERE id = ? AND pg_id = ?`, [id, pg_id]);
      res.json({ message: 'Payment approved successfully' });
    } else if (action === 'reject') {
      if (!rejection_reason) return res.status(400).json({ message: 'Rejection reason is required' });
      await pool.execute(`UPDATE ${table} SET status = 'rejected', rejection_reason = ? WHERE id = ? AND pg_id = ?`, [rejection_reason, id, pg_id]);
      res.json({ message: 'Payment rejected' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getPendingVerifications = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    
    const [rentRows] = await pool.execute(`
      SELECT r.id, r.amount, r.billing_month, r.transaction_id, r.payment_date, r.screenshot_url, 'rent' as type, u.name as student_name, u.id as student_id
      FROM rent_payments r
      JOIN users u ON r.student_id = u.id
      WHERE r.status = 'pending_verification' AND r.pg_id = ?
    `, [pg_id]);

    
    const [elecRows] = await pool.execute(`
      SELECT e.id, e.amount, e.billing_month, e.transaction_id, e.payment_date, e.screenshot_url, 'electricity' as type, rm.room_number
      FROM electricity_bills e
      JOIN rooms rm ON e.room_id = rm.id
      WHERE e.status = 'pending_verification' AND e.pg_id = ?
    `, [pg_id]);

    res.json({ rent: rentRows, electricity: elecRows });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const simulatePayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id, type, transaction_id, payment_date } = req.body;
    
    if (!id || !type || !transaction_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const table = type === 'rent' ? 'rent_payments' : 'electricity_bills';
    
    
    if (type === 'rent') {
      const [existing] = await pool.execute(`SELECT id, status FROM rent_payments WHERE id = ? AND student_id = ?`, [id, studentId]);
      if (existing.length === 0) return res.status(404).json({ message: 'Record not found' });
      if (existing[0].status === 'paid') return res.status(400).json({ message: 'Already paid' });
    } else {
      const [bed] = await pool.execute('SELECT room_id FROM beds WHERE student_id = ?', [studentId]);
      if (bed.length === 0) return res.status(404).json({ message: 'Student not assigned to any bed' });
      const [existing] = await pool.execute(`SELECT id, status FROM electricity_bills WHERE id = ? AND room_id = ?`, [id, bed[0].room_id]);
      if (existing.length === 0) return res.status(404).json({ message: 'Record not found' });
      if (existing[0].status === 'paid') return res.status(400).json({ message: 'Already paid' });
    }

    
    const query = `
      UPDATE ${table} 
      SET status = 'paid', transaction_id = ?, payment_date = ?
      WHERE id = ?
    `;
    await pool.execute(query, [transaction_id, payment_date || new Date(), id]);

    res.json({ message: 'Simulated payment completed successfully', transaction_id });
  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
