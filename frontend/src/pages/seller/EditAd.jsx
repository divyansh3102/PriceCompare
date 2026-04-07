import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, X, Check, Camera } from 'lucide-react';
import { electronicsCategories } from '../../data/electronicsCategories'; // Adjust path if needed

const EditAd = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    city: 'Jamshedpur'
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Store the actual file for the backend
      setImagePreview(URL.createObjectURL(file)); // Create a local preview URL for the UI
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select an image!");
      return;
    }

    setIsLoading(true);

    // Create FormData object to handle the file upload
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('price', formData.price);
    submitData.append('category', formData.category);
    submitData.append('city', formData.city);
    submitData.append('image', imageFile); // 'image' matches upload.single('image') in backend

    try {
      const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/products/upload', {
        method: 'POST',
        body: submitData, // Do NOT set Content-Type header; fetch handles it for FormData automatically
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Product submitted for admin approval!');
        setTimeout(() => navigate('/seller/my-ads'), 2000);
      } else {
        alert(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg glass hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Post New Ad</h1>
          <p className="text-white/50 text-sm">Create a new product listing (requires admin approval)</p>
        </div>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{success}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-6 glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          
          <div>
            <label className="block text-white/70 text-sm mb-2">Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50">
                <option value="" className="bg-[#0b0e1a]">Select category</option>
                <option value="Mobiles" className="bg-[#0b0e1a]">Mobiles</option>
                <option value="Laptops" className="bg-[#0b0e1a]">Laptops</option>
                <option value="Audio" className="bg-[#0b0e1a]">Audio</option>
              </select>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Price (₹) *</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Product Image *</h2>
            
            {!imagePreview ? (
              <label className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-pink-500/50 transition-colors cursor-pointer block">
                <Camera className="w-10 h-10 text-white/40 mx-auto mb-3" />
                <p className="text-white/60 text-sm mb-2">Click to browse image</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required />
              </label>
            ) : (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="w-full px-6 py-4 rounded-xl btn-gradient flex items-center justify-center space-x-2 disabled:opacity-70">
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Submit for Approval</span>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAd;