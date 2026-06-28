import { API_URL } from "../config";
import React, { useEffect, useState } from 'react';
import { User, Users, ArrowRight, Film, Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import StarRating from '../components/StarRating';

export default function UserSelect({ selectedUserId, setSelectedUserId, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/users?limit=50`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then(data => {
        setUsers(data.users);
        setLoading(false);
        if (selectedUserId) {
          const matched = data.users.find(u => u.userId === selectedUserId);
          if (matched) setSelectedUserDetail(matched);
        } else if (data.users.length > 0) {
          setSelectedUserId(data.users[0].userId);
          setSelectedUserDetail(data.users[0]);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedUserId, setSelectedUserId]);

  const handleSelectUser = (user) => {
    setSelectedUserId(user.userId);
    setSelectedUserDetail(user);
  };

  const filteredUsers = users.filter(user => 
    user.userId.toString().includes(searchQuery)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-2.5">
            <Users className="w-7 h-7 text-accentBlue" />
            <span className="text-accentBlue">Select a User Profile</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1.5 font-light">
            Choose a mock user profile to see their rating history and trigger recommendations.
          </p>
        </div>
        
        {/* Search user ID */}
        <div className="mt-4 md:mt-0 max-w-xs w-full relative">
          <input
            type="text"
            placeholder="Search User ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-darkCard border border-gray-800 hover:border-accentBlue/40 focus:border-accentBlue px-4 py-2 rounded-xl text-sm text-white focus:outline-none transition-all"
          />
          <User className="absolute right-3.5 top-2.5 text-gray-500 w-4 h-4" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-10 h-10 text-accentBlue animate-spin" />
          <p className="text-sm text-gray-500">Loading mock user profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User ID Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-darkCard/20 border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accentBlue">Mock Users (IDs 1–50)</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserId === user.userId;
                  return (
                    <button
                      key={user.userId}
                      onClick={() => handleSelectUser(user)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                        isSelected
                          ? 'bg-accentBlue/10 border-accentBlue text-white shadow-md shadow-accentBlue/5'
                          : 'bg-darkCard border-gray-800 hover:border-gray-700 text-gray-300'
                      }`}
                    >
                      <User className={`w-6 h-6 mb-2 ${isSelected ? 'text-accentBlue' : 'text-gray-500'}`} />
                      <span className="text-sm font-bold">User {user.userId}</span>
                      <span className="text-[10px] text-gray-500 mt-1">{user.watch_count} Ratings</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Watch History & Recommendations Trigger */}
          <div className="space-y-6">
            {selectedUserDetail ? (
              <div className="bg-darkCard/50 border border-gray-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 pb-4 border-b border-gray-850">
                    <div className="bg-accentBlue/10 p-2 rounded-xl text-accentBlue">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-lg">User {selectedUserDetail.userId} Profile</h3>
                      <p className="text-xs text-gray-500">{selectedUserDetail.watch_count} Total Watch Reviews</p>
                    </div>
                  </div>

                  {/* Watch History */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accentBlue flex items-center space-x-1">
                      <Film className="w-3.5 h-3.5" />
                      <span>Your Watch History</span>
                    </h4>
                    
                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {selectedUserDetail.top_history && selectedUserDetail.top_history.length > 0 ? (
                        selectedUserDetail.top_history.map((hist, idx) => (
                          <div 
                            key={idx} 
                            className="bg-black/40 hover:bg-black/60 border border-gray-850 p-2.5 rounded-xl flex items-start justify-between space-x-2 transition-all"
                          >
                            <div className="flex-grow min-w-0">
                              <p className="text-xs font-bold text-white truncate" title={hist.title}>
                                {hist.title.replace(/\s*\(\d{4}\)\s*/g, '')}
                              </p>
                              <div className="flex flex-wrap gap-0.5 mt-1">
                                {hist.genres.slice(0, 2).map((g, i) => (
                                  <span key={i} className="text-[8px] bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded border border-gray-850">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-0.5 text-xs text-accentBlue font-bold bg-black/40 px-1.5 py-0.5 rounded border border-gray-800 shrink-0">
                              <span>{hist.rating}</span>
                              <Star className="w-3 h-3 fill-accentBlue text-accentBlue" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No watch history found.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/80">
                  <button
                    onClick={() => onNavigate('recommendations')}
                    className="w-full group inline-flex items-center justify-center space-x-2 bg-accentBlue hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-accentBlue/20 transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <span>Get My Recommendations</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-darkCard/50 border border-gray-800 rounded-2xl p-6 text-center text-gray-500 flex flex-col justify-center items-center h-full min-h-[300px]">
                <User className="w-8 h-8 text-gray-700 mb-3" />
                <p className="text-sm">Select a user profile from the list to view watch history.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </motion.div>
  );
}
