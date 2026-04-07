import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import SellerLayout from './layouts/SellerLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Products from './pages/Products';
import Cart from "./pages/Cart";

// Seller Pages
import SellerDashboard from './pages/seller/Dashboard';
import SellerAnalytics from './pages/seller/Analytics';
import SellerMyAds from './pages/seller/MyAds';
import SellerEditAd from './pages/seller/EditAd';
import SellerProfile from './pages/seller/Profile';
import Orders from "./pages/seller/Orders";

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'; // ✅ FIXED
import AdminUsers from './pages/admin/Users';
import AdminSellers from './pages/admin/Sellers';
import AdminAds from './pages/admin/Ads';
import AdminPayments from './pages/admin/Payments';
import ProductApproval from "./pages/admin/ProductApproval";
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>

          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Seller Routes */}
          <Route
            path="/seller"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="my-ads" element={<SellerMyAds />} />
            <Route path="edit-ad/:id" element={<SellerEditAd />} />
            <Route path="profile" element={<SellerProfile />} />
            <Route path="orders" element={<Orders />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="ads" element={<AdminAds />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="approval" element={<ProductApproval />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;