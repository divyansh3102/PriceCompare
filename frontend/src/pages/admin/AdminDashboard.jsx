import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});

  const fetchStats = async () => {
    try {
      const res = await fetch("https://pricecompare-1-lrr8.onrender.com/api/admin/stats");
      const data = await res.json();
      setStats(data.stats || {});
    } catch (err) {
      console.error(err);
    }
  };

 useEffect(() => {
  fetchStats();

  // 🔥 AUTO REFRESH EVERY 3 SECONDS
  const interval = setInterval(() => {
    fetchStats();
  }, 3000);

  // CLEANUP
  return () => clearInterval(interval);
}, []);

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-blue-500 p-6 rounded-xl">
          <h2>Total Users</h2>
          <p className="text-2xl font-bold">{stats.users || 0}</p>
        </div>

        <div className="bg-green-500 p-6 rounded-xl">
          <h2>Total Sellers</h2>
          <p className="text-2xl font-bold">{stats.sellers || 0}</p>
        </div>

        <div className="bg-purple-500 p-6 rounded-xl">
          <h2>Total Products</h2>
          <p className="text-2xl font-bold">{stats.products || 0}</p>
        </div>

        <div className="bg-yellow-500 p-6 rounded-xl">
          <h2>Pending Approval</h2>
          <p className="text-2xl font-bold">{stats.pending || 0}</p>
        </div>

      </div>

      {/* NAVIGATION */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => window.location.href = "/admin/approval"}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Product Approval →
        </button>
      </div>

    </div>
  );
};

export default AdminDashboard;