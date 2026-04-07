import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, X, Globe, Store } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentMode = searchParams.get('mode') || 'local';
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // 1. Fetch Proprietary Products Database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/products');
        const data = await response.json();
        
        if (data.success) {
          // 🚀 MAGIC SEPARATOR: Read the Discriminator from the DB
          const processedProducts = data.products.map(p => ({
            ...p,
            isOnline: p.shopName === 'Admin Online', // True if Admin uploaded via CSV
            city: p.shopName === 'Admin Online' ? 'Nationwide Delivery' : (p.city || 'Local')
          }));
          setAllProducts(processedProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Extract Categories & Cities dynamically (respecting the current mode!)
  const visibleProducts = allProducts.filter(p => currentMode === 'online' ? p.isOnline : !p.isOnline);
  const uniqueCategories = ['All', ...new Set(visibleProducts.map(p => p.category).filter(Boolean))];
  const uniqueCities = ['All', ...new Set(visibleProducts.map(p => p.city).filter(Boolean))];

  // 3. Apply Filters
  useEffect(() => {
    let result = [...allProducts];

    // A. Filter by Mode Toggle (Local vs Online)
    if (currentMode === 'online') {
      result = result.filter(p => p.isOnline === true);
    } else {
      result = result.filter(p => p.isOnline === false);
    }

    // B. Text Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.shopName && p.shopName.toLowerCase().includes(q))
      );
    }

    // C. Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // D. City
    if (selectedCity !== 'All') {
      result = result.filter(p => p.city === selectedCity);
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, selectedCity, allProducts, currentMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedCity !== 'All') params.set('city', selectedCity);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCity('All');
    const params = new URLSearchParams();
    params.set('mode', currentMode); // Preserve the mode
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="md:hidden flex items-center justify-center space-x-2 bg-[#151b2b] border border-gray-800 text-white p-3 rounded-xl">
          <Filter className="w-5 h-5" /> <span>{showMobileFilters ? 'Hide Filters' : 'Show Filters'}</span>
        </button>

        <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0 space-y-6`}>
          <div className="bg-[#151b2b] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4 flex items-center"><Search className="w-4 h-4 mr-2 text-pink-500"/> Search</h3>
            <form onSubmit={handleSearchSubmit}>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Product name..." className="w-full bg-[#0a0f1c] border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-pink-500 text-sm" />
            </form>
          </div>

          <div className="bg-[#151b2b] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Categories</h3>
            <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {uniqueCategories.map(category => (
                <label key={category} className="flex items-center space-x-3 cursor-pointer group">
                  <input type="radio" name="category" checked={selectedCategory === category} onChange={() => setSelectedCategory(category)} className="form-radio text-pink-500 focus:ring-pink-500 bg-[#0a0f1c] border-gray-700" />
                  <span className={`text-sm ${selectedCategory === category ? 'text-pink-400 font-medium' : 'text-gray-400 group-hover:text-white'}`}>{category}</span>
                </label>
              ))}
            </div>
          </div>

          {currentMode === 'local' && (
            <div className="bg-[#151b2b] border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center"><MapPin className="w-4 h-4 mr-2 text-pink-500"/> Location</h3>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-[#0a0f1c] border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-pink-500 text-sm">
                {uniqueCities.map(city => (<option key={city} value={city}>{city}</option>))}
              </select>
            </div>
          )}

          {(searchQuery || selectedCategory !== 'All' || selectedCity !== 'All') && (
            <button onClick={clearFilters} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center justify-center transition-colors">
              <X className="w-4 h-4 mr-1" /> Clear All Filters
            </button>
          )}
        </div>

        <div className="flex-1">
          <div className={`mb-6 flex justify-between items-center p-4 rounded-xl border border-gray-800 ${currentMode === 'online' ? 'bg-pink-900/20 border-pink-500/30' : 'bg-[#151b2b]'}`}>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                {currentMode === 'online' ? <Globe className="w-6 h-6 mr-2 text-pink-500"/> : <Store className="w-6 h-6 mr-2 text-blue-400"/>}
                {currentMode === 'online' ? 'Online Catalog' : 'Local Stores'}
              </h1>
              <span className="text-gray-400 text-sm mt-1 block">
                {currentMode === 'online' ? 'Shipped nationwide' : 'Available for immediate store pickup'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-white">{filteredProducts.length}</span>
              <span className="text-gray-400 text-sm block">Products</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gray-700 border-t-pink-500 rounded-full animate-spin" /></div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#151b2b] rounded-2xl border border-gray-800">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No {currentMode} products found</h3>
              <p className="text-gray-400 mb-6">Try removing some filters or checking the other catalog.</p>
              <button onClick={clearFilters} className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                Clear Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Products;