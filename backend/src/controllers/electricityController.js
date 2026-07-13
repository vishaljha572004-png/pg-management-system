import pool from '../config/db.js';

export const addElectricityBill = async (req, res) => {
  try {
    const { room_id, amount, billing_month, due_date } = req.body;

    if (!room_id || !amount || !billing_month || !due_date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const pg_id = req.user.pg_id;

    
    const [existing] = await pool.execute(
      'SELECT id FROM electricity_bills WHERE room_id = ? AND billing_month = ? AND pg_id = ?',
      [room_id, billing_month, pg_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: `Bill for ${billing_month} already exists for this room` });
    }

    await pool.execute(
      'INSERT INTO electricity_bills (room_id, amount, billing_month, due_date, status, pg_id) VALUES (?, ?, ?, ?, ?, ?)',
      [room_id, amount, billing_month, due_date, 'pending', pg_id]
    );

    
    const [studentsInRoom] = await pool.execute('SELECT student_id FROM beds WHERE room_id = ? AND student_id IS NOT NULL', [room_id]);
    for (const student of studentsInRoom) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [student.student_id, 'New Electricity Bill', `A new electricity bill for ${billing_month} has been generated for your room. Total Amount: ₹${amount}`, 'billing']
      );
    }

    res.status(201).json({ message: 'Electricity bill added successfully' });
  } catch (error) {
    console.error('Error adding electricity bill:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllElectricityBills = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    const [bills] = await pool.execute(`
      SELECT eb.*, r.room_number 
      FROM electricity_bills eb
      JOIN rooms r ON eb.room_id = r.id
      WHERE eb.pg_id = ?
      ORDER BY eb.id DESC
    `, [pg_id]);
    res.json(bills);
  } catch (error) {
    console.error('Error fetching electricity bills:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markElectricityBillPaid = async (req, res) => {
  try {
    const { bill_id } = req.body;
    const pg_id = req.user.pg_id;

    const [result] = await pool.execute(
      `UPDATE electricity_bills SET status = 'paid' WHERE id = ? AND pg_id = ?`,
      [bill_id, pg_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    
    const [billData] = await pool.execute('SELECT room_id, billing_month FROM electricity_bills WHERE id = ?', [bill_id]);
    if (billData.length > 0) {
      const [studentsInRoom] = await pool.execute('SELECT student_id FROM beds WHERE room_id = ? AND student_id IS NOT NULL', [billData[0].room_id]);
      for (const student of studentsInRoom) {
        await pool.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [student.student_id, 'Electricity Bill Paid', `The electricity bill for ${billData[0].billing_month} for your room has been marked as paid by the admin.`, 'billing']
        );
      }
    }

    res.json({ message: 'Bill marked as paid successfully' });
  } catch (error) {
    console.error('Error updating electricity bill:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
