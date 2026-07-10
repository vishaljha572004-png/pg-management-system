import pool from '../config/db.js';

// Admin: Generate Rent for all occupied beds for a specific month
export const generateMonthlyRent = async (req, res) => {
  const { billing_month } = req.body; // e.g., 'July 2026'
  const pg_id = req.user.pg_id;

  if (!billing_month) {
    return res.status(400).json({ message: 'Billing month is required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Find all occupied beds and their rent amounts
    const [occupiedBeds] = await connection.execute(`
      SELECT b.student_id, r.rent_per_bed 
      FROM beds b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.status = 'occupied' AND b.student_id IS NOT NULL AND b.pg_id = ?
    `, [pg_id]);

    if (occupiedBeds.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'No students currently assigned to beds.' });
    }

    let generatedCount = 0;

    for (let bed of occupiedBeds) {
      // Check if rent is already generated for this student for this month
      const [existingRent] = await connection.execute(
        'SELECT id FROM rent_payments WHERE student_id = ? AND billing_month = ?',
        [bed.student_id, billing_month]
      );

      if (existingRent.length === 0) {
        // Insert pending rent with pg_id
        await connection.execute(
          'INSERT INTO rent_payments (student_id, amount, billing_month, status, pg_id) VALUES (?, ?, ?, ?, ?)',
          [bed.student_id, bed.rent_per_bed, billing_month, 'pending', pg_id]
        );
        
        // Notify student
        await connection.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [bed.student_id, 'Rent Bill Generated', `Your rent bill for ${billing_month} has been generated. Amount: ₹${bed.rent_per_bed}`, 'billing']
        );
        
        generatedCount++;
      }
    }

    await connection.commit();
    res.json({ message: `Rent generated successfully for ${generatedCount} students for ${billing_month}` });
  } catch (error) {
    await connection.rollback();
    console.error('Error generating rent:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Admin: Get all rent records (Filterable)
export const getAllRentRecords = async (req, res) => {
  try {
    const { month, status } = req.query;
    const pg_id = req.user.pg_id;
    
    let query = `
      SELECT rp.*, u.name as student_name, r.room_number, b.bed_number
      FROM rent_payments rp
      JOIN users u ON rp.student_id = u.id
      JOIN beds b ON b.student_id = u.id
      JOIN rooms r ON b.room_id = r.id
      WHERE rp.pg_id = ?
    `;
    const params = [pg_id];

    if (month) {
      query += ` AND rp.billing_month = ?`;
      params.push(month);
    }
    
    if (status) {
      query += ` AND rp.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY rp.id DESC`;

    const [records] = await pool.execute(query, params);
    res.json(records);
  } catch (error) {
    console.error('Error fetching rent records:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Mark rent as paid
export const markRentAsPaid = async (req, res) => {
  try {
    const { payment_id, transaction_id } = req.body;
    const pg_id = req.user.pg_id;

    if (!payment_id) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    const [result] = await pool.execute(
      `UPDATE rent_payments 
       SET status = 'paid', transaction_id = ?, payment_date = CURRENT_TIMESTAMP 
       WHERE id = ? AND pg_id = ?`,
      [transaction_id || 'CASH', payment_id, pg_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rent record not found' });
    }

    // Get student_id to notify
    const [rentRecord] = await pool.execute('SELECT student_id, billing_month FROM rent_payments WHERE id = ?', [payment_id]);
    if (rentRecord.length > 0) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [rentRecord[0].student_id, 'Rent Payment Received', `Your rent payment for ${rentRecord[0].billing_month} has been marked as paid by the admin.`, 'billing']
      );
    }

    res.json({ message: 'Rent marked as paid successfully' });
  } catch (error) {
    console.error('Error updating rent status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Student: Get my rent records
export const getMyRentRecords = async (req, res) => {
  try {
    const studentId = req.user.id;
    const [records] = await pool.execute(
      'SELECT * FROM rent_payments WHERE student_id = ? ORDER BY id DESC',
      [studentId]
    );
    res.json(records);
  } catch (error) {
    console.error('Error fetching student rent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Student: Simulate Rent Payment
export const studentPayRent = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { payment_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    // Verify the payment belongs to the student and is pending
    const [existing] = await pool.execute(
      'SELECT id, status FROM rent_payments WHERE id = ? AND student_id = ?',
      [payment_id, studentId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Rent record not found' });
    }

    if (existing[0].status === 'paid') {
      return res.status(400).json({ message: 'Rent is already paid' });
    }

    // Generate a random mock transaction ID
    const mockTransactionId = 'TXN' + Math.floor(Math.random() * 1000000000);

    const [result] = await pool.execute(
      `UPDATE rent_payments 
       SET status = 'paid', transaction_id = ?, payment_date = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [mockTransactionId, payment_id]
    );

    res.json({ message: 'Payment successful', transaction_id: mockTransactionId });
  } catch (error) {
    console.error('Error processing student payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
