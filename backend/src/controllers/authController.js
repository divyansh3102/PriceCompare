import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { sendOTP } from '../utils/sendEmail.js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ FIX: Crash the app early if JWT_SECRET is missing (Prevents login/register crashes later)
if (!process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET is not defined in .env file!");
  process.exit(1); 
}

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ✅ FIX: Helper function for email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ──────────────────────────────────────────────
// Register new user
// ──────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role, shopName } = req.body;

    // ✅ FIX: Basic validation for missing fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // ✅ FIX: Email format validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // ✅ FIX: Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const userRole = role || 'user';
    const userShopName = userRole === 'seller' ? (shopName || null) : null;

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, role, shop_name, is_verified)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    const result = insertUser.run(name, email.toLowerCase(), hashedPassword, userRole, userShopName);
    const userId = result.lastInsertRowid;

    // Generate OTP and store it (expires in 5 minutes)
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO otps (user_id, email, otp, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, email.toLowerCase(), otpCode, expiresAt);

    // Send OTP email
    const emailResult = await sendOTP(email, otpCode, name);

    // ✅ FIX: If email fails to send during registration, let the user know
    if (!emailResult.success) {
      console.warn('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Account created, but failed to send OTP email. Please try resending OTP.',
        userId,
        email: email.toLowerCase()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      userId,
      email: email.toLowerCase(),
      otpSent: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    // ✅ FIX: Hide detailed error messages in production
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ──────────────────────────────────────────────
// Verify OTP
// ──────────────────────────────────────────────
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: "User ID and OTP are required" });
    }

    // Find user
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // If already verified
    if (user.is_verified === 1) {
      return res.json({
        success: true,
        message: "User already verified"
      });
    }

    // Get OTP from otps table
    const otpRecord = db.prepare(
      "SELECT * FROM otps WHERE user_id = ? AND otp = ?"
    ).get(userId, otp);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      db.prepare("DELETE FROM otps WHERE id = ?").run(otpRecord.id);
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one."
      });
    }

    // Verify user
    db.prepare("UPDATE users SET is_verified = 1 WHERE id = ?").run(userId);

    // Delete OTP after use
    db.prepare("DELETE FROM otps WHERE id = ?").run(otpRecord.id);

    return res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ──────────────────────────────────────────────
// Resend OTP
// ──────────────────────────────────────────────
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Delete any existing OTPs for this user
    db.prepare('DELETE FROM otps WHERE user_id = ?').run(user.id);

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO otps (user_id, email, otp, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(user.id, user.email, otpCode, expiresAt);

    // Send OTP email
    const emailResult = await sendOTP(email, otpCode, user.name);

    // ✅ FIX: Throw actual 500 error if email fails to send, so frontend knows it failed
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      otpSent: true
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ──────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        needsVerification: true,
        userId: user.id
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shop_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ──────────────────────────────────────────────
// Get current user (protected)
// ──────────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, email, role, is_verified, shop_name, phone, address, city, avatar, created_at, updated_at FROM users WHERE id = ?'
    ).get(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ──────────────────────────────────────────────
// Logout (stateless)
// ──────────────────────────────────────────────
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};