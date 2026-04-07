import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart3, 
  Package, 
  User, 
  LogOut,
  ShoppingBag,
  PlusCircle
} from 'lucide-react';

const SellerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ I added the Orders path right here in the menuItems!
  const menuItems = [
    { path: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/seller/my-ads', icon: Package, label: 'My Ads' },
    { path: '/seller/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/seller/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/seller/dashboard') {
      return location.pathname === '/seller/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed left-0 top-0 h-full w-64 bg-[#0b0e1a]/95 backdrop-blur-xl border-r border-white/10 z-40"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold gradient-text">PriceCompare</span>
            <p className="text-xs text-white/50">Seller Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="p-4">
        <Link
          to="/seller/my-ads"
          className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl btn-gradient"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="font-medium">Post New Ad</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                active
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-white border border-pink-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-pink-500' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="sellerActiveIndicator"
                  className="absolute left-0 w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-600 rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default SellerSidebar;