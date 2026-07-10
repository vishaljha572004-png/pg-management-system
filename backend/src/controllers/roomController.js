import pool from '../config/db.js';

export const createRoom = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { room_number, capacity, rent_per_bed } = req.body;

    const pg_id = req.user.pg_id;

    // Start Transaction
    await connection.beginTransaction();

    // 1. Check if room exists in THIS PG
    const [existing] = await connection.execute('SELECT * FROM rooms WHERE room_number = ? AND pg_id = ?', [room_number, pg_id]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Room number already exists' });
    }

    // 2. Insert Room with pg_id
    const [roomResult] = await connection.execute(
      'INSERT INTO rooms (room_number, capacity, rent_per_bed, pg_id) VALUES (?, ?, ?, ?)',
      [room_number, capacity, rent_per_bed, pg_id]
    );
    const roomId = roomResult.insertId;

    // 3. Automatically Create Beds for this Room with pg_id
    for (let i = 1; i <= capacity; i++) {
      const bedNumber = `${room_number}-${String.fromCharCode(64 + i)}`; // e.g., 101-A, 101-B
      await connection.execute(
        'INSERT INTO beds (room_id, bed_number, pg_id) VALUES (?, ?, ?)',
        [roomId, bedNumber, pg_id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Room and beds created successfully', roomId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const getRooms = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    // Fetch all rooms for THIS PG
    const [rooms] = await pool.execute('SELECT * FROM rooms WHERE pg_id = ? ORDER BY room_number ASC', [pg_id]);
    
    // Fetch beds for each room with student info if occupied (scoped by PG)
    const [beds] = await pool.execute(`
      SELECT b.id as bed_id, b.room_id, b.bed_number, b.status as bed_status, 
             u.id as student_id, u.name as student_name 
      FROM beds b 
      LEFT JOIN users u ON b.student_id = u.id
      WHERE b.pg_id = ?
      ORDER BY b.bed_number ASC
    `, [pg_id]);

    // Map beds to their respective rooms
    const roomsWithBeds = rooms.map(room => {
      room.beds = beds.filter(bed => bed.room_id === room.id);
      
      // Dynamic status calculation
      const occupiedBeds = room.beds.filter(b => b.bed_status === 'occupied').length;
      if (occupiedBeds === room.capacity) room.status = 'full';
      else room.status = 'available';

      return room;
    });

    res.json(roomsWithBeds);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignBed = async (req, res) => {
  try {
    const { bed_id, student_id } = req.body;
    const pg_id = req.user.pg_id;

    // Check if student already has a bed in THIS PG
    const [existingBed] = await pool.execute('SELECT * FROM beds WHERE student_id = ? AND pg_id = ?', [student_id, pg_id]);
    if (existingBed.length > 0) {
      // Unassign the existing bed
      await pool.execute(
        'UPDATE beds SET student_id = NULL, status = "available" WHERE id = ? AND pg_id = ?',
        [existingBed[0].id, pg_id]
      );
    }

    // Assign bed to student (ensure bed belongs to PG)
    await pool.execute(
      'UPDATE beds SET student_id = ?, status = "occupied" WHERE id = ? AND pg_id = ?',
      [student_id, bed_id, pg_id]
    );

    // Notify student
    const msg = existingBed.length > 0 
      ? 'Your bed assignment has been changed by the admin.'
      : 'You have been assigned a new bed in the hostel.';

    await pool.execute(`
      INSERT INTO notifications (user_id, title, message, type, pg_id)
      VALUES (?, 'Bed Assigned', ?, 'system', ?)
    `, [student_id, msg, pg_id]);

    res.json({ message: existingBed.length > 0 ? 'Room changed successfully' : 'Bed assigned successfully' });
  } catch (error) {
    console.error('Error assigning bed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const unassignBed = async (req, res) => {
  try {
    const { bed_id } = req.body;
    const pg_id = req.user.pg_id;

    // Get student_id before unassigning
    const [bedRows] = await pool.execute('SELECT student_id FROM beds WHERE id = ? AND pg_id = ?', [bed_id, pg_id]);
    const student_id = bedRows[0]?.student_id;

    await pool.execute(
      'UPDATE beds SET student_id = NULL, status = "available" WHERE id = ? AND pg_id = ?',
      [bed_id, pg_id]
    );

    if (student_id) {
      // Notify student
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'Bed Unassigned', 'Your bed assignment has been removed by the admin.', 'system')
      `, [student_id]);
    }

    res.json({ message: 'Bed unassigned successfully' });
  } catch (error) {
    console.error('Error unassigning bed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper endpoint for admin to get students (assigned and unassigned) for assignment dropdown
export const getUnassignedStudents = async (req, res) => {
  try {
    const pg_id = req.user.pg_id;
    const [students] = await pool.execute(`
      SELECT u.id, u.name, u.email, b.bed_number, r.room_number 
      FROM users u 
      JOIN roles ro ON u.role_id = ro.id
      LEFT JOIN beds b ON u.id = b.student_id 
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE ro.name = 'Student' AND u.status IN ('active', 'verified') AND u.pg_id = ?
    `, [pg_id]);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
