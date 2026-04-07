import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Truck, Lock } from "lucide-react";
import { motion } from "framer-motion";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Cart = () => {
  const { cart, removeFromCart, increaseQty, decreaseQty, clearCart } = useContext(CartContext) || { cart: [], clearCart: () => {} };
  const navigate = useNavigate();

  // Multi-Step Checkout State
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Cart Review, 2 = Address & Payment
  
  // Form States
  const [deliveryMethod, setDeliveryMethod] = useState('Pickup'); 
  const [paymentMethod, setPaymentMethod] = useState('Store Pickup'); 
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [codAvailable, setCodAvailable] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const tax = subtotal * 0.18; 
  const deliveryFee = deliveryMethod === 'Delivery' ? 150 : 0; 
  const total = subtotal + tax + deliveryFee;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);
  };

  // 🚀 PRO AUTH GUARD
  const handleProceedToCheckout = () => {
    // Check if user is logged in (using localStorage simulation for now)
    const token = localStorage.getItem('token') || localStorage.getItem('userEmail');
    
    if (!token) {
      alert("🔒 Authentication Required: You must be logged in to place an order securely.");
      navigate('/login'); // Redirects unauthorized users
      return;
    }
    
    setUserEmail(token);
    setCheckoutStep(2); // Move to Step 2 if logged in
  };

  const verifyLocation = async () => {
    if (!pincode || pincode.length !== 6) return alert("Please enter a valid 6-digit Pincode.");
    try {
      const res = await fetch('https://pricecompare-1-lrr8.onrender.com/api/checkout/validate-cod', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pincode })
      });
      const data = await res.json();
      setCodAvailable(data.available);
      if (!data.available) setPaymentMethod('Online'); 
      else setPaymentMethod('COD');
    } catch (error) { console.error("Verification error", error); }
  };

  const handleFinalCheckout = async () => {
    if (deliveryMethod === 'Delivery' && (!address || !pincode)) {
      return alert("Please enter your full delivery address and verify your pincode.");
    }

    setIsProcessing(true);

    const orderData = {
      cartItems: cart,
      totalAmount: total,
      buyerEmail: userEmail || 'user@example.com', 
      buyerAddress: deliveryMethod === 'Delivery' ? `${address}, Pincode: ${pincode}` : 'Store Pickup',
      deliveryType: deliveryMethod,
      paymentMethod: paymentMethod
    };

    try {
      if (deliveryMethod === 'Pickup' || paymentMethod === 'COD') {
        const res = await fetch('https://pricecompare-1-lrr8.onrender.com/api/orders/checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData)
        });
        const data = await res.json();
        if (data.success) {
          alert(`Order Placed! The seller has been notified. 🎉 Order ID: ${data.orderId}`);
          if (clearCart) clearCart();
          navigate('/'); 
        }
      } 
      else if (deliveryMethod === 'Delivery' && paymentMethod === 'Online') {
        const res = await loadRazorpay();
        if (!res) return alert("Razorpay SDK failed to load.");

        const initRes = await fetch('https://pricecompare-1-lrr8.onrender.com/api/checkout/create-payment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData)
        });
        const paymentData = await initRes.json();

        if (!paymentData.success) return alert("Failed to initialize payment.");

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY', 
          amount: paymentData.amount,
          currency: "INR",
          name: "PriceCompare Marketplace",
          description: "Secure Order Payment",
          order_id: paymentData.orderId,
          handler: async function (response) {
            const verifyRes = await fetch('https://pricecompare-1-lrr8.onrender.com/api/checkout/verify-payment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId: paymentData.dbOrderId
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert("Payment Successful! The seller has been notified.");
              if (clearCart) clearCart();
              navigate('/');
            } else alert("Payment verification failed!");
          },
          theme: { color: "#ec4899" } 
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      }
    } catch (error) {
      alert("Something went wrong during checkout.");
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
        <ShoppingBag className="w-8 h-8 mr-3 text-pink-500" />
        Secure Checkout
      </h1>

      {cart.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-3xl p-16 text-center border border-white/10">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-white/30" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">Looks like you haven't added any local deals to your cart yet.</p>
          <Link to="/products" className="inline-flex items-center px-8 py-4 rounded-xl btn-gradient font-bold text-white">
            Start Shopping <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN: Cart Items */}
          <div className="flex-1 space-y-4">
            {cart.map((item, index) => (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} key={item.id} className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6 border border-white/10">
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
                </div>
                <div className="flex-1 w-full text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">{item.name}</h3>
                  <p className="text-white/50 text-sm mb-2">Sold by: <span className="text-pink-400 font-medium">{item.shopName || 'Verified Seller'}</span></p>
                  <p className="text-xl font-bold text-white">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1">
                  <button onClick={() => decreaseQty(item.id)} className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center text-white font-medium">{item.qty}</span>
                  <button onClick={() => increaseQty(item.id)} className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-colors ml-auto sm:ml-0"><Trash2 className="w-5 h-5" /></button>
              </motion.div>
            ))}
          </div>

          {/* RIGHT COLUMN: Step-by-Step Checkout Flow */}
          <div className="w-full lg:w-[400px]">
            <div className="glass-card p-6 rounded-3xl border border-white/10 sticky top-24">
              
              {/* STEP 1: CART REVIEW */}
              {checkoutStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
                  <div className="space-y-4 mb-6 text-sm border-b border-white/10 pb-6">
                    <div className="flex justify-between text-white/70"><span>Subtotal ({cart.length} items)</span><span>{formatPrice(subtotal)}</span></div>
                    <div className="flex justify-between text-white/70"><span>Estimated Tax (18%)</span><span>{formatPrice(tax)}</span></div>
                  </div>
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-lg text-white font-medium">Total Price</span>
                    <span className="text-2xl font-bold gradient-text-pink">{formatPrice(subtotal + tax)}</span>
                  </div>
                  <button onClick={handleProceedToCheckout} className="w-full py-4 rounded-xl btn-gradient font-bold text-white text-lg hover:shadow-lg hover:shadow-pink-500/25 transition-all mb-4 flex items-center justify-center">
                    Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  <div className="flex items-center justify-center text-white/40 text-xs mt-4">
                    <Lock className="w-4 h-4 mr-1" /><span>Login required for secure checkout.</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: ADDRESS & PAYMENT */}
              {checkoutStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-xl font-bold text-white mb-4">Delivery & Payment</h3>
                  
                  <div className="flex bg-[#0a0f1c] p-1 rounded-xl mb-6">
                    <button onClick={() => { setDeliveryMethod('Pickup'); setPaymentMethod('Store Pickup'); }} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${deliveryMethod === 'Pickup' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}>Store Pickup</button>
                    <button onClick={() => setDeliveryMethod('Delivery')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${deliveryMethod === 'Delivery' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}>Home Delivery</button>
                  </div>

                  {deliveryMethod === 'Delivery' && (
                    <div className="mb-6 space-y-3 animate-fade-in">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Enter 6-Digit Pincode" maxLength="6" value={pincode} onChange={(e) => setPincode(e.target.value)} className="flex-1 bg-[#0a0f1c] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none text-sm" />
                        <button onClick={verifyLocation} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">Verify</button>
                      </div>
                      
                      {codAvailable !== null && (
                        <p className={`text-xs ${codAvailable ? 'text-green-400' : 'text-red-400'}`}>
                          {codAvailable ? '✓ Cash on Delivery available!' : '✗ COD not available. Online payment only.'}
                        </p>
                      )}

                      <textarea placeholder="Full Delivery Address (House No, Street, Landmark)" rows="3" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-[#0a0f1c] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none text-sm resize-none"></textarea>

                      <div className="pt-2">
                        <p className="text-gray-400 text-sm mb-2">Select Payment Method</p>
                        <div className="space-y-2">
                          <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'Online' ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 hover:border-gray-500'}`}>
                            <input type="radio" name="payment" value="Online" checked={paymentMethod === 'Online'} onChange={() => setPaymentMethod('Online')} className="hidden" />
                            <CreditCard className="w-5 h-5 mr-3 text-pink-400" /><span className="text-white text-sm">Pay Online (Card/UPI)</span>
                          </label>
                          <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${!codAvailable ? 'opacity-50 cursor-not-allowed border-gray-800' : paymentMethod === 'COD' ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 hover:border-gray-500'}`}>
                            <input type="radio" name="payment" value="COD" disabled={!codAvailable} checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="hidden" />
                            <Truck className="w-5 h-5 mr-3 text-pink-400" /><span className="text-white text-sm">Cash on Delivery</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mb-6 text-sm border-t border-white/10 pt-4">
                    <div className="flex justify-between text-white/70"><span>Total Price</span><span>{formatPrice(total)}</span></div>
                  </div>

                  <button onClick={handleFinalCheckout} disabled={isProcessing} className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all mb-4 ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'btn-gradient hover:shadow-lg hover:shadow-pink-500/25'}`}>
                    {isProcessing ? 'Processing...' : deliveryMethod === 'Pickup' ? 'Confirm Store Pickup' : paymentMethod === 'Online' ? 'Pay & Place Order' : 'Place COD Order'}
                  </button>
                  <button onClick={() => setCheckoutStep(1)} className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors">← Back to Cart</button>
                </motion.div>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Cart;