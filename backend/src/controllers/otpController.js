import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendSMS } from '../utils/smsService.js';
import { UserModel } from '../models/userModel.js';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

// Helper to generate a 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (req, res) => {
  try {
    const { phone, purpose } = req.body;
    
    if (!phone || !purpose) {
      return res.status(400).json({ message: 'Phone and purpose are required.' });
    }

    // Rate limit check for OTPs requested for this phone
    // Delete any expired OTPs for this phone first
    await pool.execute('DELETE FROM otp_verification WHERE mobile = ? AND expires_at < NOW()', [phone]);

    // Check if there is an active OTP that is not expired
    const [existingRows] = await pool.execute('SELECT id, created_at FROM otp_verification WHERE mobile = ? AND purpose = ?', [phone, purpose]);
    if (existingRows.length > 0) {
      const activeOtp = existingRows[0];
      const timeElapsed = (new Date() - new Date(activeOtp.created_at)) / 1000;
      // 60 second cooldown for resend
      if (timeElapsed < 60) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(60 - timeElapsed)} seconds before requesting a new OTP.` });
      }
      
      // Delete old OTP to replace it
      await pool.execute('DELETE FROM otp_verification WHERE id = ?', [activeOtp.id]);
    }

    // Generate new OTP
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Save to DB
    await pool.execute(
      'INSERT INTO otp_verification (mobile, otp, purpose, expires_at, attempts) VALUES (?, ?, ?, ?, ?)',
      [phone, hashedOtp, purpose, expiresAt, 0]
    );

    // Send SMS
    const message = `Your PG System verification code is ${otp}. It will expire in 5 minutes. Do not share this code.`;
    const smsResponse = await sendSMS(phone, message);

    if (!smsResponse.success && process.env.NODE_ENV === 'production') {
      // In prod, if SMS fails, we must fail the request so user knows.
      return res.status(500).json({ message: 'Failed to send OTP via SMS provider.', details: smsResponse.error });
    }

    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Internal server error while sending OTP.' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, purpose } = req.body;

    if (!phone || !otp || !purpose) {
      return res.status(400).json({ message: 'Phone, OTP, and purpose are required.' });
    }

    const [rows] = await pool.execute('SELECT * FROM otp_verification WHERE mobile = ? AND purpose = ?', [phone, purpose]);
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'No active OTP found for this number.' });
    }

    const otpRecord = rows[0];

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      await pool.execute('DELETE FROM otp_verification WHERE id = ?', [otpRecord.id]);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await pool.execute('DELETE FROM otp_verification WHERE id = ?', [otpRecord.id]);
      return res.status(400).json({ message: 'Maximum attempts reached. Please request a new OTP.' });
    }

    // Verify hash
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      await pool.execute('UPDATE otp_verification SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP matches!
    await pool.execute('DELETE FROM otp_verification WHERE id = ?', [otpRecord.id]);

    // Issue an OTP token (short lived JWT) that proves the phone was verified
    // This token is passed in the subsequent register request
    const otpToken = jwt.sign(
      { phone, verified: true, purpose },
      process.env.JWT_SECRET || 'super_secret_access_key_2026',
      { expiresIn: '15m' }
    );

    res.status(200).json({ 
      message: 'Mobile number verified successfully.',
      otpToken
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Internal server error while verifying OTP.' });
  }
};
