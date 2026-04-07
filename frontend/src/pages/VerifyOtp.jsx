import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw, CheckCircle, ShoppingBag } from 'lucide-react';
import { authApi } from '../services/authApi';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  
  const inputRefs = useRef([]);
  
  const userId = localStorage.getItem('verifyUserId');
  const email = localStorage.getItem('verifyEmail');

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      navigate('/register');
    }
  }, [userId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (index === 5 && value) {
      const otpString = [...newOtp.slice(0, 5), value].join('');
      if (otpString.length === 6) {
        setTimeout(() => handleVerify(otpString), 100);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }

    // Auto-submit if all digits are filled
    if (pastedData.length === 6) {
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (otpString = otp.join('')) => {
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyOTP({
        userId: Number(userId),
        otp: otpString
      });

      if (response.success) {
        setSuccess('Email verified successfully!');
        
        // Store auth data
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('userId', response.user.id);
        
        // Clear verification data
        localStorage.removeItem('verifyUserId');
        localStorage.removeItem('verifyEmail');

        // Redirect based on role
        setTimeout(() => {
          if (response.role === 'admin') {
            navigate('/admin');
          } else if (response.role === 'seller') {
            navigate('/seller/dashboard');
          } else {
            navigate('/products');
          }
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setError('');

    try {
      await authApi.resendOTP(email);
      setCountdown(300); // Reset countdown
      setSuccess('OTP resent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">PriceCompare</span>
          </Link>
        </div>

        {/* OTP Card */}
        <div className="glass-card p-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-pink-500" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Verify Your Email
          </h2>
          <p className="text-white/50 text-center mb-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-white font-medium text-center mb-6">
            {email}
          </p>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* OTP Inputs */}
            <div className="flex justify-center space-x-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Countdown */}
            <div className="text-center mb-6">
              <p className="text-white/50 text-sm">
                Code expires in{' '}
                <span className={`font-mono font-medium ${countdown < 60 ? 'text-red-400' : 'text-pink-400'}`}>
                  {formatTime(countdown)}
                </span>
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full py-3.5 rounded-xl btn-gradient font-semibold flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-white/50 text-sm mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className="text-pink-400 hover:text-pink-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : countdown > 0 ? (
                  <span>Resend in {formatTime(countdown)}</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend OTP</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Back to Register */}
        <div className="text-center mt-6">
          <Link to="/register" className="text-white/40 hover:text-white text-sm transition-colors">
            &larr; Back to Registration
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;
