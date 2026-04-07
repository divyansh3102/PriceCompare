import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  login, 
  verifyOTP, 
  resendOTP, 
  getCurrentUser,
  logout 
} from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';


const router = express.Router();
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: 'Too many OTP attempts, please try again after 5 minutes' }
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Route par limiter laga dein
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
// Protected routes
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', verifyToken, logout);

export default router;
