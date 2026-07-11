import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { generateTokens } from '../utils/generateToken.js';
import pool from '../config/db.js';
import { generateOrgCode } from '../utils/generateOrgCode.js';

export const registerPG = async (req, res) => {
  try {
    const { pg_name, owner_name, email, phone, password } = req.body;

    // Check if user exists
    const existingUser = await UserModel.findByEmail(email);
    const existingPhone = await UserModel.findByPhone(phone);
    if (existingUser || existingPhone) {
      return res.status(400).json({ message: 'User with this email or phone already exists' });
    }

    let org_code = generateOrgCode(pg_name);
    
    // Ensure org code uniqueness
    let isUnique = false;
    while (!isUnique) {
      const [existing] = await pool.execute('SELECT id FROM pgs WHERE org_code = ?', [org_code]);
      if (existing.length === 0) {
        isUnique = true;
      } else {
        org_code = generateOrgCode(pg_name);
      }
    }

    // Insert PG
    const [pgResult] = await pool.execute(
      'INSERT INTO pgs (name, org_code, owner_name, contact_number, email) VALUES (?, ?, ?, ?, ?)',
      [pg_name, org_code, owner_name, phone, email]
    );
    const pg_id = pgResult.insertId;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create Admin User
    const userId = await UserModel.create({
      name: owner_name,
      email,
      phone,
      password_hash,
      role_name: 'Admin',
      pg_id
    });

    // Generate tokens for auto-login
    const { accessToken, refreshToken } = generateTokens(userId, 'Admin', pg_id);
    await UserModel.updateRefreshToken(userId, refreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ 
      message: 'PG Registered and Admin created successfully',
      accessToken,
      user: {
        id: userId,
        name: owner_name,
        email: email,
        role: 'Admin'
      }
    });
  } catch (error) {
    console.error('PG Registration Error:', error);
    res.status(500).json({ message: 'Internal server error', details: error.message, stack: error.stack });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const existingUser = await UserModel.findByEmail(email);
    const existingPhone = await UserModel.findByPhone(phone);
    if (existingUser || existingPhone) {
      return res.status(400).json({ message: 'User with this email or phone already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user strictly as Student
    const userId = await UserModel.create({
      name,
      email,
      phone,
      password_hash,
      role_name: 'Student'
    });

    res.status(201).json({ message: 'Student registered successfully', userId });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const handleLogin = async (req, res, allowedRoles) => {
  try {
    const { email, password, org_code } = req.body;
    let pg_id = undefined;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // For students, resolve org_code to pg_id
    if (allowedRoles.includes('Student')) {
      if (!org_code) {
        return res.status(400).json({ message: 'Organization Code is required for student login' });
      }
      const [pgRows] = await pool.execute("SELECT id FROM pgs WHERE org_code = ? AND status = 'active'", [org_code]);
      if (pgRows.length === 0) {
        return res.status(400).json({ message: 'Invalid Organization Code' });
      }
      pg_id = pgRows[0].id;
    }

    // Find user by email. Note: 'email' field actually receives either email or phone from frontend usually.
    // Wait, the frontend sends 'email' field but it can contain a phone number?
    // Let's assume the frontend sends 'email' and we search by email first, then phone.
    let user = await UserModel.findByEmail(email, pg_id);
    if (!user) {
        user = await UserModel.findByPhone(email, pg_id);
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(400).json({ message: 'Invalid credentials. Please reset your password or contact admin.' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Role Verification
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'You are not authorized to access this portal.' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.pg_id);

    // Save refresh token in DB
    await UserModel.updateRefreshToken(user.id, refreshToken);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    });
  }
};

export const login = (req, res) => handleLogin(req, res, ['Student']);
export const adminLogin = (req, res) => handleLogin(req, res, ['Admin']);
export const superAdminLogin = (req, res) => handleLogin(req, res, ['Super Admin']);

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Unauthorized, no refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    
    // Validate with DB (optional but secure)
    // Here we can fetch the user to get their role and verify if refresh_token matches DB
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized, invalid token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role, pg_id: user.pg_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(403).json({ message: 'Forbidden, invalid or expired refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      // Decode slightly to get user ID without enforcing expiration (for cleanup)
      const decoded = jwt.decode(refreshToken);
      if (decoded && decoded.id) {
        await UserModel.clearRefreshToken(decoded.id);
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const userId = req.user.id;

    let updateQuery = 'UPDATE users SET phone = ?';
    let params = [phone];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      updateQuery += ', password_hash = ?';
      params.push(password_hash);
    }

    updateQuery += ' WHERE id = ?';
    params.push(userId);

    // Using the internal pool for this quick update
    const pool = (await import('../config/db.js')).default;
    await pool.execute(updateQuery, params);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const findPG = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    // Simulate OTP verification
    if (otp !== '1234') { // Hardcoded for demo/simulation
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const [rows] = await pool.execute(`
      SELECT p.name, p.org_code 
      FROM users u 
      JOIN pgs p ON u.pg_id = p.id 
      JOIN roles r ON u.role_id = r.id
      WHERE u.phone = ? AND r.name = 'Student'
    `, [phone]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No PG associated with this mobile number.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Find PG Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
