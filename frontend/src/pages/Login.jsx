import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShoppingBag } from 'lucide-react';
import { authApi } from '../services/authApi';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ AUTO REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    const role = localStorage.getItem('role');

    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'seller') {
      navigate('/seller/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // ✅ FIXED LOGIN FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login(formData);

      if (response.success) {
        // ✅ SAVE DATA
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('userId', response.user.id);

        // ✅ ROLE BASED REDIRECT
        if (response.role === 'admin') {
          navigate('/admin');
        } else if (response.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/products');
        }
      } else {
        setError(response.message || 'Login failed ❌');
      }

    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);

      // OTP flow
      if (err.response?.data?.needsVerification) {
        localStorage.setItem('verifyUserId', err.response.data.userId);
        localStorage.setItem('verifyEmail', formData.email);
        navigate('/verify-otp');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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

        {/* Card */}
        <div className="glass-card p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Welcome Back!
          </h2>
          <p className="text-white/50 text-center mb-6">
            Sign in to continue
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-white/70 text-sm">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 text-white/40" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 py-3 bg-white/5 border rounded-xl text-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-white/70 text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 py-3 bg-white/5 border rounded-xl text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>

          {/* Register */}
          <p className="text-center text-white/60 mt-4">
            Don’t have an account?{' '}
            <Link to="/register" className="text-pink-400">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;