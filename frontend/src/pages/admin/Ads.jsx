import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Search, Check, X, Trash2, UploadCloud, PackageX, PackageCheck, Tag } from 'lucide-react';

const Ads = () => {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/products/all');
      const data = await response.json();
      if (data.success) setAds(data.products);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const standardCategories = ['Mobiles', 'Laptops', 'Audio', 'Accessories', 'General'];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/products/bulk', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              products: results.data,
              shopName: 'Admin Online', // 🚀 MAGIC DISCRIMINATOR: Tags these as Online Products
              status: 'approved' // Auto-approves Admin uploads
            })
          });
          const data = await response.json();
          if (data.success) { alert(`Successfully imported!`); fetchAds(); }
        } catch (error) {
          alert('Failed to upload CSV.');
        } finally {
          setIsUploading(false);
          event.target.value = null; 
        }
      }
    });
  };

  const handleCategoryChange = async (id, newCategory) => {
    try {
      const res = await fetch(`https://pricecompare-1-lrr8.onrender.com/api/products/category/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }) 
      });
      const data = await res.json();
      if (data.success) fetchAds(); 
    } catch (err) { console.error('Error swapping category:', err); }
  };

  const handleToggleStock = async (id, currentStock) => {
    const isCurrentlyInStock = currentStock === undefined ? true : Boolean(currentStock);
    try {
      const res = await fetch(`https://pricecompare-1-lrr8.onrender.com/api/products/stock/${id}`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !isCurrentlyInStock }) 
      });
      const data = await res.json();
      if (data.success) fetchAds();
    } catch (err) {}
  };

  const handleApprove = async (id) => {
    const res = await fetch(`https://pricecompare-1-lrr8.onrender.com/api/products/approve/${id}`, { method: 'PUT' });
    if ((await res.json()).success) fetchAds();
  };

  const handleReject = async (id) => {
    const res = await fetch(`https://pricecompare-1-lrr8.onrender.com/api/products/reject/${id}`, { method: 'PUT' });
    if ((await res.json()).success) fetchAds();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const res = await fetch(`https://pricecompare-1-lrr8.onrender.com/api/products/${id}`, { method: 'DELETE' });
    if ((await res.json()).success) fetchAds();
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = (ad.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          <p className="text-gray-400 mt-1">CSVs uploaded here will become your exclusive Online Products.</p>
        </div>
        <div>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="px-4 py-2 rounded-lg bg-pink-600 text-white flex items-center justify-center space-x-2 disabled:opacity-70">
            {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            <span>{isUploading ? 'Importing Online Data...' : 'Import Online CSV'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search inventory..." className="w-full pl-12 pr-4 py-3 bg-[#151b2b] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-[#151b2b] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-700 border-t-pink-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAds.map((ad) => {
            const isAvailable = ad.inStock === 1 || ad.inStock === true || ad.inStock === undefined;
            const isOnlineAdmin = ad.shopName === 'Admin Online';
            
            return (
              <div key={ad.id} className={`bg-[#151b2b] border ${isOnlineAdmin ? 'border-pink-500/50' : 'border-gray-800'} rounded-xl overflow-hidden flex flex-col`}>
                
                <div className="relative h-48 bg-gray-900">
                  <img src={ad.image} alt={ad.name} className={`w-full h-full object-cover ${!isAvailable && 'grayscale'}`} onError={(e) => e.target.src = 'https://via.placeholder.com/400'} />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-white bg-black/60 backdrop-blur-sm border border-white/10 uppercase">
                    {ad.status}
                  </div>
                  {isOnlineAdmin && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white bg-pink-600 shadow-md">
                      Online Catalog
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-white font-semibold line-clamp-1 mb-1">{ad.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">Seller: {isOnlineAdmin ? 'Platform (Online)' : ad.shopName}</p>
                  <p className="text-pink-400 font-bold mb-4">₹{ad.price}</p>

                  <div className="flex items-center bg-[#0a0f1c] border border-gray-700 rounded-lg px-3 py-1 mb-4">
                    <Tag className="w-4 h-4 text-gray-400 mr-2" />
                    <select
                      value={ad.category || 'General'}
                      onChange={(e) => handleCategoryChange(ad.id, e.target.value)}
                      className="bg-transparent text-sm text-white w-full outline-none py-1 cursor-pointer"
                    >
                      {standardCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                      ))}
                      {!standardCategories.includes(ad.category) && ad.category && (
                        <option value={ad.category} className="bg-gray-900">{ad.category}</option>
                      )}
                    </select>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button onClick={() => handleToggleStock(ad.id, ad.inStock)} className={`col-span-2 px-3 py-2 rounded-lg text-sm flex justify-center items-center ${isAvailable ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                      {isAvailable ? <PackageX className="w-4 h-4 mr-2" /> : <PackageCheck className="w-4 h-4 mr-2" />}
                      {isAvailable ? 'Mark Out of Stock' : 'Mark In Stock'}
                    </button>
                    {ad.status !== 'approved' && (
                      <button onClick={() => handleApprove(ad.id)} className="py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 flex justify-center"><Check className="w-4 h-4"/></button>
                    )}
                    {ad.status !== 'rejected' && (
                      <button onClick={() => handleReject(ad.id)} className="py-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 flex justify-center"><X className="w-4 h-4"/></button>
                    )}
                    <button onClick={() => handleDelete(ad.id)} className="col-span-2 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 flex justify-center mt-2"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Ads;