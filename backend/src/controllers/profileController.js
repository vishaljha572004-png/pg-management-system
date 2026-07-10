import pool from '../config/db.js';

// Get current student's profile
export const getMyProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const pgId = req.user.pg_id;
    const [rows] = await pool.execute(`
      SELECT sp.*, u.status, u.name, u.email, u.phone 
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = ? AND u.pg_id = ?
    `, [studentId, pgId]);

    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message, stack: error.stack });
  }
};

// Update profile and submit for verification
export const updateProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      dob, gender, blood_group, permanent_address, current_address, occupation, student_id_number,
      father_name, father_mobile, mother_name, mother_mobile, local_guardian_name, local_guardian_mobile, emergency_contact,
      police_verification_number, police_station_name, police_verification_date, submitForVerification
    } = req.body;

    // Handle uploaded files
    const files = req.files || {};
    const aadhaar_front = files.aadhaar_front ? `/uploads/${files.aadhaar_front[0].filename}` : null;
    const aadhaar_back = files.aadhaar_back ? `/uploads/${files.aadhaar_back[0].filename}` : null;
    const pan_card = files.pan_card ? `/uploads/${files.pan_card[0].filename}` : null;
    const college_id_doc = files.college_id_doc ? `/uploads/${files.college_id_doc[0].filename}` : null;
    const photo = files.photo ? `/uploads/${files.photo[0].filename}` : null;
    const selfie = files.selfie ? `/uploads/${files.selfie[0].filename}` : null;
    const police_document = files.police_document ? `/uploads/${files.police_document[0].filename}` : null;

    // Check if profile exists
    const [existing] = await pool.execute('SELECT * FROM student_profiles WHERE user_id = ?', [studentId]);

    if (existing.length === 0) {
      // Insert new profile
      const newStatus = submitForVerification ? 'submitted' : 'incomplete';
      await pool.execute(`
        INSERT INTO student_profiles (
          user_id, dob, gender, blood_group, permanent_address, current_address, occupation, student_id_number,
          father_name, father_mobile, mother_name, mother_mobile, local_guardian_name, local_guardian_mobile, emergency_contact,
        aadhaar_front, aadhaar_back, pan_card, college_id_doc, photo, selfie,
          police_status, police_verification_number, police_station_name, police_verification_date, police_document, profile_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        studentId, dob || null, gender || null, blood_group || null, permanent_address || null, current_address || null, occupation || null, student_id_number || null,
        father_name || null, father_mobile || null, mother_name || null, mother_mobile || null, local_guardian_name || null, local_guardian_mobile || null, emergency_contact || null,
        aadhaar_front, aadhaar_back, pan_card, college_id_doc, photo, selfie,
        police_document ? 'submitted' : 'pending', police_verification_number || null, police_station_name || null, police_verification_date || null, police_document, newStatus
      ]);
    } else {
      // Update existing profile (keeping old files if not re-uploaded)
      const old = existing[0];
      const newStatus = submitForVerification ? 'submitted' : 'incomplete';
      await pool.execute(`
        UPDATE student_profiles SET 
          dob = ?, gender = ?, blood_group = ?, permanent_address = ?, current_address = ?, occupation = ?, student_id_number = ?,
          father_name = ?, father_mobile = ?, mother_name = ?, mother_mobile = ?, local_guardian_name = ?, local_guardian_mobile = ?, emergency_contact = ?,
          aadhaar_front = COALESCE(?, aadhaar_front), aadhaar_back = COALESCE(?, aadhaar_back), pan_card = COALESCE(?, pan_card), college_id_doc = COALESCE(?, college_id_doc), photo = COALESCE(?, photo), selfie = COALESCE(?, selfie),
          police_status = CASE WHEN ? IS NOT NULL THEN 'submitted' ELSE police_status END,
          police_verification_number = ?, police_station_name = ?, police_verification_date = ?, police_document = COALESCE(?, police_document),
          profile_status = ?, rejection_reason = CASE WHEN ? = 'submitted' THEN NULL ELSE rejection_reason END
        WHERE user_id = ?
      `, [
        dob || old.dob, gender || old.gender, blood_group || old.blood_group, permanent_address || old.permanent_address, current_address || old.current_address, occupation || old.occupation, student_id_number || old.student_id_number,
        father_name || old.father_name, father_mobile || old.father_mobile, mother_name || old.mother_name, mother_mobile || old.mother_mobile, local_guardian_name || old.local_guardian_name, local_guardian_mobile || old.local_guardian_mobile, emergency_contact || old.emergency_contact,
        aadhaar_front, aadhaar_back, pan_card, college_id_doc, photo, selfie,
        police_document,
        police_verification_number || old.police_verification_number, police_station_name || old.police_station_name, police_verification_date || old.police_verification_date, police_document,
        newStatus, newStatus,
        studentId
      ]);
    }

    if (submitForVerification) {
      // Set user status to pending
      await pool.execute('UPDATE users SET status = ? WHERE id = ? AND pg_id = ?', ['pending', studentId, req.user.pg_id]);

      // Trigger notification for admin of this specific PG
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type, pg_id)
        SELECT u.id, 'Profile Verification Pending', 'A new student has submitted their profile for verification.', 'verification', ?
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Admin' AND u.pg_id = ?
      `, [req.user.pg_id, req.user.pg_id]);
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message, stack: error.stack });
  }
};
