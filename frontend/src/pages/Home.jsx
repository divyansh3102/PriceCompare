import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Shield, Zap, 
  ArrowRight, Smartphone, 
  Laptop, Headphones, Monitor, Store,
  CheckCircle2
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/products');
        const data = await response.json();
        if (data.success) {
          setFeaturedProducts(data.products.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const topCategories = [
    { id: '1', name: 'Mobiles', icon: <Smartphone className="w-6 h-6" /> },
    { id: '2', name: 'Laptops', icon: <Laptop className="w-6 h-6" /> },
    { id: '3', name: 'Audio', icon: <Headphones className="w-6 h-6" /> },
    { id: '4', name: 'Accessories', icon: <Monitor className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      
      {/* 1. HERO BANNER - Clean and Static */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="w-full rounded-2xl bg-[#151b2b] border border-gray-800 overflow-hidden flex flex-col md:flex-row">
          
          <div className="p-8 md:p-12 lg:p-16 flex-1 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Stop Overpaying Online.<br />
              <span className="text-pink-500">Buy Locally Today.</span>
            </h1>
            
            <p className="text-lg text-gray-400 mb-8 max-w-lg">
              Compare electronics prices from verified local shops in your city. Reserve online, pick up in-store, and secure the best deals immediately.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Link to="/products" className="bg-pink-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-pink-700 transition-colors flex items-center w-full sm:w-auto justify-center">
                Browse All Deals <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <div className="flex items-center text-gray-500 text-sm mt-2 sm:mt-0">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                No upfront payment required
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-1 bg-[#1a2133] items-center justify-center p-8 border-l border-gray-800">
            <div className="text-center">
              <Store className="w-24 h-24 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium text-lg">Connecting you with<br/>top-rated local sellers</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topCategories.map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.name}`} className="flex items-center p-4 rounded-xl bg-[#151b2b] border border-gray-800 hover:border-gray-600 transition-colors">
              <div className="p-3 rounded-lg bg-[#1a2133] text-pink-500 mr-4">
                {cat.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold">{cat.name}</h3>
                <p className="text-gray-500 text-sm">View all →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. TRENDING DEALS */}
      <section className="py-16 border-t border-gray-800 bg-[#0c1222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Trending Local Deals</h2>
              <p className="text-gray-400 mt-1 text-sm">Most popular items available near you.</p>
            </div>
            <Link to="/products" className="text-pink-500 hover:text-pink-400 text-sm font-medium flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
               <div className="col-span-full flex justify-center py-12">
                 <div className="w-8 h-8 border-4 border-gray-700 border-t-pink-500 rounded-full animate-spin" />
               </div>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-[#151b2b] rounded-xl border border-gray-800">
                <p className="text-gray-500">No deals available right now. Check back later.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#151b2b] border border-gray-800">
            <Shield className="w-8 h-8 text-pink-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Verified Sellers Only</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Every shop is physically verified by our team to ensure authentic products and valid warranties.</p>
          </div>
          <div className="p-6 rounded-xl bg-[#151b2b] border border-gray-800">
            <Zap className="w-8 h-8 text-pink-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Same Day Pickup</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Skip the shipping wait times. Find the item locally, reserve it, and pick it up immediately.</p>
          </div>
          <div className="p-6 rounded-xl bg-[#151b2b] border border-gray-800">
            <TrendingUp className="w-8 h-8 text-pink-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Beat Online Prices</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Local shops frequently offer better cash discounts and combo deals than major e-commerce platforms.</p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER BANNER */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-2xl p-8 sm:p-12 text-center bg-[#151b2b] border border-gray-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Own an Electronics Shop?</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            List your inventory and connect directly with buyers in your city searching for your products.
          </p>
          <Link to="/register" className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors">
            <Store className="w-5 h-5 mr-2" /> Start Selling
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;