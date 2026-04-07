import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, Filter, ChevronDown, 
  ChevronUp, Clock, Package, CheckCircle, XCircle
} from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Tracks which order row is expanded to show cart items
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/seller/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Format Date beautifully
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);
  };

  // ✅ Update the status in the backend instantly
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Optimistic UI update for instant feedback
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      await fetch(`https://pricecompare-1-lrr8.onrender.com/api/seller/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      fetchOrders(); // Revert on failure
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchQuery) || 
                          order.cartItems.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // UI Helper for Status Colors
  const getStatusColor = (status) => {
    if (status.includes('Pending')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (status.includes('Processing') || status.includes('Ready')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (status.includes('Completed')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (status.includes('Cancelled')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  const statusOptions = ['Pending Payment (Store Pickup)', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Order Management</h1>
          <p className="text-gray-400 mt-1">Process customer orders and update pickup statuses.</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-400 text-sm mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="bg-[#151b2b] border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-400 text-sm mb-1">Action Required</p>
          <p className="text-2xl font-bold text-yellow-400">
            {orders.filter(o => o.status.includes('Pending')).length}
          </p>
        </div>
        <div className="bg-[#151b2b] border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-400 text-sm mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">
            {orders.filter(o => o.status === 'Completed').length}
          </p>
        </div>
        <div className="bg-[#151b2b] border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-pink-500">
            {formatPrice(orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.total_amount, 0))}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Product Name..."
            className="w-full pl-12 pr-4 py-3 bg-[#151b2b] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-pink-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[#151b2b] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-pink-500 cursor-pointer min-w-[200px]"
        >
          <option value="All">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-pink-500 rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-[#151b2b] border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
              
              {/* Main Order Row (Clickable) */}
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0a0f1c] border border-gray-800 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Order #{order.id}</h3>
                    <p className="text-gray-400 text-sm flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                  <div className="text-left md:text-right">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Amount</p>
                    <p className="text-white font-bold">{formatPrice(order.total_amount)}</p>
                  </div>

                  {/* STATUS DROPDOWN (Stops click propagation so it doesn't toggle the accordion) */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer outline-none appearance-none pr-8 relative ${getStatusColor(order.status)}`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                    >
                      {statusOptions.map(opt => <option key={opt} value={opt} className="bg-gray-900 text-white">{opt}</option>)}
                    </select>
                  </div>

                  <button className="text-gray-500 hover:text-white transition-colors">
                    {expandedOrderId === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Order Details (Cart Items) */}
              <AnimatePresence>
                {expandedOrderId === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-800 bg-[#0a0f1c]"
                  >
                    <div className="p-5">
                      <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Ordered Items</h4>
                      <div className="space-y-3">
                        {order.cartItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-[#151b2b] p-3 rounded-lg border border-gray-800/50">
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover bg-gray-900" />
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                              <p className="text-gray-500 text-xs">Category: {item.category || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white text-sm font-bold">{formatPrice(item.price)}</p>
                              <p className="text-gray-500 text-xs">Qty: {item.qty}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#151b2b] rounded-2xl border border-gray-800">
          <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No orders found</h3>
          <p className="text-gray-500">When customers place orders, they will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default Orders;