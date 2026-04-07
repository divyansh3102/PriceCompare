import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Star, Heart } from 'lucide-react';
import { formatPrice } from '../data/electronicsCategories';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useContext(CartContext) || {};

  // ✅ NEW: Silent background function to track Views and Leads!
  const trackAction = async (type) => {
    try {
      await fetch(`https://pricecompare-1-lrr8.onrender.com/api/products/${product.id}/${type}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error(`Failed to track ${type}:`, error);
    }
  };

  const handleContact = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    // 🔥 Track this click as a 'lead' before calling!
    trackAction('lead');
    
    // Fallback phone number if the seller didn't provide one
    window.open(`tel:${product.contact || '+919876543210'}`, '_self');
  };

  const handleAddToCart = () => {
    if (addToCart && isAvailable) {
      addToCart({ ...product, qty: 1 }); 
      
      // 🔥 Track this click as a 'lead' when added to cart!
      trackAction('lead');
      
      alert(`🛒 ${product.name} added to your cart!`);
    }
  };

  // Track 'view' when clicking the image or title
  const handleView = () => {
    trackAction('view');
    // Note: If you have a product detail page, you can add navigation here later!
  };

  // 1. SAFELY HANDLE SQLITE BOOLEANS (1/0/undefined)
  const isAvailable = product.inStock === 1 || product.inStock === true || product.inStock === undefined;

  // 2. FALLBACK DATA 
  const displayRating = product.rating || "4.5";
  const displayReviews = product.reviews || Math.floor(Math.random() * 500) + 50;
  const displayShopName = product.shopName || 'Verified Local Shop';
  const displayAddress = product.shopAddress || product.city || 'Local Area';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass-card overflow-hidden card-glow group border border-white/5 hover:border-pink-500/30 transition-all duration-300 flex flex-col h-full bg-[#151b2b]"
    >
      {/* Image (Clickable for Views) */}
      <div 
        className="relative aspect-square overflow-hidden bg-[#0a0f1c] cursor-pointer"
        onClick={handleView}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'}
        />

        {/* Discount */}
        {product.discount > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-lg">
            -{product.discount}%
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[2px]">
            <span className="px-4 py-2 rounded-lg bg-red-500/80 text-white font-bold tracking-widest uppercase border border-red-400 shadow-xl">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button 
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-pink-500 transition-all z-10"
          onClick={(e) => { e.stopPropagation(); /* Add wishlist logic here later */ }}
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Name (Clickable for Views) */}
        <h3 
          onClick={handleView}
          className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-pink-400 transition-colors cursor-pointer"
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white/80 text-sm font-medium">{displayRating}</span>
          <span className="text-gray-500 text-sm">
            ({displayReviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-gray-500 text-sm line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Shop */}
        <div className="flex items-start space-x-2 mb-4">
          <MapPin className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-300 text-sm font-medium line-clamp-1">
              {displayShopName}
            </p>
            <p className="text-gray-500 text-xs line-clamp-1">
              {displayAddress}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-auto flex gap-2 pt-4 border-t border-gray-800">
          
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="flex-1 py-2.5 rounded-lg bg-pink-600 text-white font-medium text-sm hover:bg-pink-700 transition-all disabled:opacity-50 disabled:grayscale cursor-pointer disabled:cursor-not-allowed flex justify-center items-center"
          >
            Add to Cart
          </button>

          {/* Contact */}
          <button
            onClick={handleContact}
            disabled={!isAvailable}
            className="flex-1 py-2.5 rounded-lg border border-gray-600 text-white text-sm hover:bg-gray-800 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex justify-center items-center"
          >
            <Phone className="w-4 h-4 mr-2" /> Contact
          </button>

        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;