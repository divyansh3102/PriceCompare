import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, DollarSign, Activity, Target } from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('https://pricecompare-1-lrr8.onrender.com/api/seller/analytics');
        const json = await response.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin"/></div>;
  if (!data) return <div className="text-white">Error loading analytics.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center"><Activity className="w-8 h-8 mr-3 text-cyan-500" /> Live Analytics</h1>
        <p className="text-gray-400 mt-1">Real-time performance metrics for your inventory.</p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#151b2b] border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium text-sm">Total Views</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Eye className="w-5 h-5 text-blue-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{data.totalViews.toLocaleString()}</p>
        </div>
        
        <div className="bg-[#151b2b] border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium text-sm">Total Leads</h3>
            <div className="p-2 bg-green-500/10 rounded-lg"><Users className="w-5 h-5 text-green-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{data.totalLeads.toLocaleString()}</p>
        </div>

        <div className="bg-[#151b2b] border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium text-sm">Conversion Rate</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg"><Target className="w-5 h-5 text-purple-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{data.conversionRate}%</p>
        </div>

        <div className="bg-[#151b2b] border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium text-sm">Total Revenue</h3>
            <div className="p-2 bg-pink-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-pink-500" /></div>
          </div>
          <p className="text-3xl font-bold text-pink-500">₹{data.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* TOP PERFORMING ADS */}
      <div className="bg-[#151b2b] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Top Performing Ads</h2>
        </div>
        <div className="p-6">
          {data.topAds.length > 0 ? (
            <div className="space-y-6">
              {data.topAds.map((ad, idx) => {
                // Calculate progress bar width based on highest views
                const maxViews = data.topAds[0].views || 1; 
                const percentage = Math.max((ad.views / maxViews) * 100, 5);

                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium truncate pr-4">{ad.name}</span>
                      <span className="text-gray-400 whitespace-nowrap">{ad.views} Views</span>
                    </div>
                    <div className="w-full bg-[#0a0f1c] rounded-full h-2">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Not enough data to display top ads yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;