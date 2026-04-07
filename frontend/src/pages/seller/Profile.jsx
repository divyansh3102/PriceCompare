import React, { useState, useEffect } from 'react';
import { Store, MapPin, Phone, User, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState({ shop_name: '', shop_address: '', phone: '', name: '' });
  const [formData, setFormData] = useState({});
  const [pendingUpdates, setPendingUpdates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In a real app, pull the logged-in user's email from context or localStorage
  const userEmail = localStorage.getItem('userEmail') || 'test@seller.com'; 

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/seller/profile/${userEmail}`);
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          setFormData(data.profile);
          if (data.profile.pending_updates) {
            setPendingUpdates(JSON.parse(data.profile.pending_updates));
          }
        }
      } catch (error) {
        console.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [userEmail]);

  const handleRequestUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/seller/profile/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, requestedChanges: formData })
      });
      const data = await response.json();
      if (data.success) {
        setPendingUpdates(formData);
        alert("Profile update request sent to Admin for review!");
      }
    } catch (error) {
      console.error("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Store Profile</h1>
        <p className="text-gray-400 mt-1">Manage your public shop details. Changes require admin approval.</p>
      </div>

      {/* PRO APPROVAL BANNER */}
      {pendingUpdates && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-5 rounded-xl flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-500 font-bold mb-1">Updates Under Admin Review</h3>
            <p className="text-gray-400 text-sm">Your requested changes to your profile are currently being reviewed by our moderation team. Your old profile will remain public until approved.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleRequestUpdate} className="bg-[#151b2b] border border-gray-800 rounded-xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center"><User className="w-4 h-4 mr-2"/> Owner Name</label>
            <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0a0f1c] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500" disabled={!!pendingUpdates} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center"><Store className="w-4 h-4 mr-2"/> Public Shop Name</label>
            <input type="text" value={formData.shop_name || ''} onChange={(e) => setFormData({...formData, shop_name: e.target.value})} className="w-full bg-[#0a0f1c] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500" disabled={!!pendingUpdates} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-400 flex items-center"><MapPin className="w-4 h-4 mr-2"/> Shop Address</label>
            <input type="text" value={formData.shop_address || ''} onChange={(e) => setFormData({...formData, shop_address: e.target.value})} className="w-full bg-[#0a0f1c] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500" disabled={!!pendingUpdates} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center"><Phone className="w-4 h-4 mr-2"/> Public Contact Number</label>
            <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#0a0f1c] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500" disabled={!!pendingUpdates} />
          </div>

        </div>

        <div className="pt-6 border-t border-gray-800 flex justify-end">
          <button type="submit" disabled={isSubmitting || !!pendingUpdates} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center">
            {isSubmitting ? 'Submitting...' : <><ShieldAlert className="w-5 h-5 mr-2" /> Request Profile Update</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;