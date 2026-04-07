import React, { useEffect, useState } from "react";
import { Store, Globe, ArrowRightLeft } from "lucide-react";

const Compare = () => {
  const [local, setLocal] = useState([]);
  const [online, setOnline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("https://pricecompare-1-lrr8.onrender.com/api/products")
      .then(res => res.json())
      .then(data => setLocal(data.success ? data.products : []))
      .catch(err => console.error("Local fetch failed", err));
  }, []);

  const loadOnline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://dummyjson.com/products?limit=10");
      const data = await res.json();
      setOnline(data.products);
    } catch (err) {
      console.error("Online fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Price Compare Tool</h1>
            <p className="text-gray-400">See local store prices vs. online e-commerce prices side-by-side.</p>
          </div>
          
          <button 
            onClick={loadOnline} 
            disabled={isLoading}
            className="mt-4 sm:mt-0 flex items-center bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading Data...' : 'Fetch Online Prices'} <ArrowRightLeft className="w-5 h-5 ml-2" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LOCAL PRODUCTS COLUMN */}
          <div className="bg-[#151b2b] rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center border-b border-gray-800 pb-4">
              <Store className="w-6 h-6 text-blue-400 mr-2" /> Local Verified Stores
            </h2>
            
            <div className="space-y-4">
              {local.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No local products found.</p>
              ) : (
                local.map(p => (
                  <div key={p.id} className="bg-[#0a0f1c] border border-gray-800 p-4 rounded-xl flex items-center gap-4 hover:border-gray-600 transition-colors">
                    <div className="w-20 h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/80'} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{p.city || 'Local Area'}</p>
                      <p className="text-lg font-bold text-blue-400">{formatPrice(p.price)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ONLINE PRODUCTS COLUMN */}
          <div className="bg-[#151b2b] rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center border-b border-gray-800 pb-4">
              <Globe className="w-6 h-6 text-green-400 mr-2" /> Online MegaStores
            </h2>
            
            <div className="space-y-4">
              {online.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Click the button above to simulate online prices.</p>
                </div>
              ) : (
                online.map(p => (
                  <div key={p.id} className="bg-[#0a0f1c] border border-gray-800 p-4 rounded-xl flex items-center gap-4 hover:border-gray-600 transition-colors">
                    <div className="w-20 h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium line-clamp-1">{p.title}</h3>
                      <p className="text-xs text-gray-500 mb-2">Nationwide Delivery</p>
                      <p className="text-lg font-bold text-green-400">{formatPrice(Math.round(p.price * 83))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Compare;