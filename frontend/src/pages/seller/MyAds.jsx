import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { 
  Plus, 
  Search, 
  Trash2, 
  UploadCloud,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const MyAds = () => {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // CSV Upload States
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/products/all');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.products)) {
        setAds(data.products);
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // ✅ SELLER BULK UPLOAD LOGIC (Forces 'pending' status)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/products/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 🔥 This is the magic! We force the status to 'pending' for seller uploads
            body: JSON.stringify({ 
              products: results.data, 
              status: 'pending',
              shopName: 'My Local Shop' // You can link this to the logged-in seller's real shop name later
            }) 
          });
          
          const data = await response.json();
          if (data.success) {
            alert(`🎉 Successfully uploaded ${data.count} products! They are now Pending Admin Approval.`);
            fetchAds(); 
          }
        } catch (error) {
          console.error("Error uploading CSV:", error);
          alert('Failed to upload CSV data.');
        } finally {
          setIsUploading(false);
          event.target.value = null; 
        }
      }
    });
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = (ad.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (ad.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this listing?')) {
      try {
        const res = await fetch(`https://pricecompare-1-lrr8.onrender.com/api/products/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) fetchAds();
      } catch (error) {
        console.error("Error deleting ad:", error);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Inventory</h1>
          <p className="text-gray-400 mt-1">Manage your listings, upload bulk inventory, and track approvals.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          
          {/* CSV Bulk Upload Button */}
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-[#151b2b] border border-gray-700 text-white flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5 text-purple-400" />
            )}
            <span>{isUploading ? 'Uploading...' : 'Bulk Import CSV'}</span>
          </button>

          {/* Single Add Button */}
          <a
            href="/seller/edit-ad/new"
            className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Post Single Ad</span>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#151b2b] border border-gray-800">
          <p className="text-gray-400 text-sm">Total Listings</p>
          <p className="text-2xl font-bold text-white">{ads.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#151b2b] border border-gray-800">
          <p className="text-gray-400 text-sm">Live (Approved)</p>
          <p className="text-2xl font-bold text-green-400">{ads.filter(a => a.status === 'approved').length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#151b2b] border border-gray-800">
          <p className="text-gray-400 text-sm">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-400">{ads.filter(a => a.status === 'pending').length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#151b2b] border border-gray-800">
          <p className="text-gray-400 text-sm">Action Needed (Rejected)</p>
          <p className="text-2xl font-bold text-red-400">{ads.filter(a => a.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your inventory..."
            className="w-full pl-12 pr-4 py-3 bg-[#151b2b] border border-gray-800 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[#151b2b] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="approved">Live (Approved)</option>
          <option value="pending">Pending Approval</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Inventory Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
           <div className="w-8 h-8 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : filteredAds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAds.map((ad, index) => {
            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#151b2b] border border-gray-800 rounded-xl overflow-hidden flex flex-col group"
              >
                {/* Image & Status Badge */}
                <div className="relative aspect-video bg-gray-900 overflow-hidden">
                  <img
                    src={ad.image}
                    alt={ad.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'}
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {ad.status === 'approved' && (
                      <span className="flex items-center px-3 py-1.5 rounded-md text-xs font-bold bg-green-500/90 text-white backdrop-blur-md shadow-lg">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> LIVE
                      </span>
                    )}
                    {ad.status === 'pending' && (
                      <span className="flex items-center px-3 py-1.5 rounded-md text-xs font-bold bg-yellow-500/90 text-white backdrop-blur-md shadow-lg">
                        <Clock className="w-3 h-3 mr-1" /> PENDING REVIEW
                      </span>
                    )}
                    {ad.status === 'rejected' && (
                      <span className="flex items-center px-3 py-1.5 rounded-md text-xs font-bold bg-red-500/90 text-white backdrop-blur-md shadow-lg">
                        <XCircle className="w-3 h-3 mr-1" /> REJECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-semibold line-clamp-1 mb-1">{ad.name}</h3>
                  <p className="text-lg font-bold text-purple-400 mb-3">{formatPrice(ad.price)}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>{ad.category || 'General'}</span>
                    <span>{ad.city || 'Location N/A'}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-gray-800 flex justify-end">
                    <button 
                      onClick={() => handleDelete(ad.id)} 
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#151b2b] rounded-2xl border border-gray-800">
          <UploadCloud className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Your inventory is empty</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">Start by posting a single ad manually or import your entire store's inventory via CSV.</p>
        </div>
      )}
    </div>
  );
};

export default MyAds;