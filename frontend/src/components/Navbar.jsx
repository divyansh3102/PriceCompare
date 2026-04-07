import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Store, Search, LogOut, Globe, MapPin, Navigation } from 'lucide-react';
import { CartContext } from '../context/CartContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Geolocation States
  const [userLocation, setUserLocation] = useState('Select Location');
  const [isDetecting, setIsDetecting] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentMode = searchParams.get('mode') || 'local';
  const { cart } = useContext(CartContext) || { cart: [] };

  const [auth, setAuth] = useState({
    isAuthenticated: true,
    user: { name: 'User', role: 'user' }
  });

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null });
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}&mode=${currentMode}`);
      setSearchQuery('');
    }
  };

  const handleModeToggle = (mode) => {
    if (location.pathname === '/products') {
      const params = new URLSearchParams(location.search);
      params.set('mode', mode);
      navigate(`/products?${params.toString()}`);
    } else {
      navigate(`/products?mode=${mode}`);
    }
  };

  // 🚀 ADVANCED GEOLOCATION HANDLER
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setUserLocation('Detecting...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding using free OpenStreetMap API
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          // Extract the best matching city/region name
          const city = data.address.city || data.address.town || data.address.state_district || 'Unknown Area';
          setUserLocation(city);
          
          // Optional: You can save this to localStorage or context to persist it
          localStorage.setItem('userCity', city);
          
        } catch (error) {
          console.error("Error fetching location details", error);
          setUserLocation('Detection Failed');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error("Error detecting location", error);
        setUserLocation('Location Denied');
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Load saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userCity');
    if (savedLocation) setUserLocation(savedLocation);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0f1c] border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* LOGO & AUTO-DETECT LOCATION */}
          <div className="flex items-center space-x-6 flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <Store className="w-7 h-7 text-pink-500" />
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">PriceCompare</span>
            </Link>

            {/* LOCATION DETECTOR (Desktop) */}
            <button 
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="hidden md:flex items-center group cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors"
            >
              <MapPin className="w-5 h-5 text-pink-500 mr-2" />
              <div className="text-left flex flex-col">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Delivering to</span>
                <span className="text-sm text-white font-semibold flex items-center mt-0.5">
                  {userLocation}
                  {isDetecting ? (
                    <div className="ml-2 w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3 ml-1.5 text-gray-500 group-hover:text-pink-400 transition-colors" />
                  )}
                </span>
              </div>
            </button>
          </div>

          {/* GLOBAL SEARCH */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${currentMode === 'online' ? 'Online MegaStore' : 'Local Stores'}...`} className="w-full bg-[#151b2b] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors" />
              <button type="submit" className="hidden">Search</button>
            </form>
          </div>

          {/* OMNICHANNEL TOGGLE */}
          <div className="hidden lg:flex items-center bg-[#151b2b] rounded-full p-1 border border-gray-800 mr-4">
            <button onClick={() => handleModeToggle('local')} className={`flex items-center px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${currentMode === 'local' ? 'bg-pink-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <Store className="w-3.5 h-3.5 mr-1.5" /> Local
            </button>
            <button onClick={() => handleModeToggle('online')} className={`flex items-center px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${currentMode === 'online' ? 'bg-pink-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <Globe className="w-3.5 h-3.5 mr-1.5" /> Online
            </button>
          </div>

          {/* DESKTOP NAVIGATION (Cleaned Up) */}
          <div className="hidden md:flex items-center space-x-5">
            <Link to="/cart" className="text-gray-300 hover:text-white transition-colors relative flex items-center">
              <ShoppingCart className="w-5 h-5 mr-1.5" />
              <span className="text-sm font-medium">Cart</span>
              {cart.length > 0 && (<span className="absolute -top-2 -left-2 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{cart.length}</span>)}
            </Link>
            
            <div className="h-6 w-px bg-gray-700" />
            
            {auth.isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm font-medium text-gray-300"><User className="w-4 h-4 mr-1" /><span>{auth.user.name}</span></div>
                {auth.user.role === 'seller' && (<Link to="/seller/dashboard" className="text-sm font-medium text-purple-400 hover:text-purple-300">Seller Panel</Link>)}
                <button onClick={handleLogout} className="text-gray-400 hover:text-white" title="Logout"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white">Login</Link>
                <Link to="/register" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 transition-colors">Sell</Link>
              </div>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/cart" className="relative text-gray-300">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (<span className="absolute -top-1 -right-2 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{cart.length}</span>)}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300">{isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0f1c] border-b border-gray-800 pb-4">
          <div className="px-4 pt-2 pb-3 space-y-1">
            
            {/* LOCATION DETECTOR (Mobile) */}
            <button 
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="w-full flex items-center bg-[#151b2b] p-3 rounded-lg border border-gray-800 mb-4 mt-2"
            >
              <MapPin className="w-5 h-5 text-pink-500 mr-3 flex-shrink-0" />
              <div className="text-left flex flex-col flex-1">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Delivering to</span>
                <span className="text-sm text-white font-semibold flex items-center">
                  {userLocation}
                  {isDetecting && <div className="ml-2 w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />}
                </span>
              </div>
              {!isDetecting && <Navigation className="w-4 h-4 text-gray-500" />}
            </button>

            <div className="flex bg-[#151b2b] rounded-lg p-1 border border-gray-800 mb-4">
              <button onClick={() => handleModeToggle('local')} className={`flex-1 flex justify-center items-center py-2 rounded-md text-sm font-medium transition-all ${currentMode === 'local' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                <Store className="w-4 h-4 mr-2" /> Local
              </button>
              <button onClick={() => handleModeToggle('online')} className={`flex-1 flex justify-center items-center py-2 rounded-md text-sm font-medium transition-all ${currentMode === 'online' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                <Globe className="w-4 h-4 mr-2" /> Online
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="relative w-full mb-4">
              <Search className="absolute inset-y-0 left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="w-full bg-[#151b2b] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-pink-500" />
            </form>
            
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Home</Link>
            
            <div className="h-px w-full bg-gray-800 my-2" />
            
            {auth.isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-400">Logged in as {auth.user.name}</div>
                {auth.user.role === 'seller' && (<Link to="/seller/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-purple-400 hover:bg-gray-800">Seller Dashboard</Link>)}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-800">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800">Login</Link>
                <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-pink-500 hover:bg-gray-800">Become a Seller</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;