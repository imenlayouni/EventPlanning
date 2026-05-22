import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell } from 'lucide-react';
import { logout } from "../../store/authSlice";
import { fetchAnalytics, fetchAllUsers } from "../../store/adminSlice";


export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, analytics } = useSelector((state) => state.admin);

  const [showNotifications, setShowNotifications] = useState(false);
  const pendingCount = 0;

  useEffect(() => {
    dispatch(fetchAnalytics());
    dispatch(fetchAllUsers({}));
    const interval = setInterval(() => {
      dispatch(fetchAnalytics());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Build provider stats map from analytics
  const providerStatsMap = {};
  if (analytics?.providerRequestStats) {
    analytics.providerRequestStats.forEach(item => {
      if (!providerStatsMap[item.providerName]) {
        providerStatsMap[item.providerName] = { accepted: 0, declined: 0 };
      }
      providerStatsMap[item.providerName][item.status] = item.count;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* topbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-10">
              <h1 className="text-3xl font-black text-[#7C3AED] uppercase tracking-tighter cursor-pointer" onClick={() => navigate("/")}>Axia Event Planner</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="relative cursor-pointer group" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="h-6 w-6 text-gray-400 group-hover:text-[#7C3AED] transition-all" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>
              <button onClick={handleLogout} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl border border-red-200 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-12">

        {analytics && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-gray-900">Dashboard Overview</h2>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: analytics?.totalUsers ?? 0, icon: "👥", color: "text-[#7C3AED]", border: "hover:border-[#7C3AED]/50" },
                { label: "Total Events", value: analytics?.totalEvents ?? 0, icon: "🎉", color: "text-green-600", border: "hover:border-green-500/50" },
                { label: "Platform Income", value: `${(analytics?.platformIncome || 0).toLocaleString()} TND`, icon: "💰", color: "text-emerald-600", border: "hover:border-emerald-500/50" },
                { label: "Total Listings", value: analytics?.totalListings ?? 0, icon: "📋", color: "text-blue-600", border: "hover:border-blue-500/50" },
                { label: "Pending Users", value: users?.filter(u => u.status === 'PENDING').length ?? 0, icon: "⏳", color: "text-yellow-600", border: "hover:border-yellow-500/50" },
                { label: "Active Users", value: users?.filter(u => u.status === 'ACTIVE').length ?? 0, icon: "✅", color: "text-emerald-600", border: "hover:border-emerald-500/50" },
                { label: "Banned Users", value: users?.filter(u => u.status === 'BANNED').length ?? 0, icon: "🚫", color: "text-red-600", border: "hover:border-red-500/50" },
                { label: "Rejected Users", value: users?.filter(u => u.status === 'REJECTED').length ?? 0, icon: "❌", color: "text-orange-600", border: "hover:border-orange-500/50" },
              ].map((item, i) => (
                <div key={i} className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm ${item.border} transition-all hover:shadow-md`}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Platform Income highlight */}
            <div className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] p-8 rounded-3xl text-white shadow-xl shadow-[#7C3AED]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-2">Total Platform Revenue</p>
                  <p className="text-5xl font-black">{(analytics?.platformIncome || 0).toLocaleString()} TND</p>
                  <p className="text-purple-200 text-sm mt-2">From all accepted service requests</p>
                </div>
                <div className="text-7xl opacity-30">💰</div>
              </div>
            </div>

            {/* User status bars */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="font-black text-lg mb-4 text-gray-900">📊 User Status Overview</h3>
              {[
                { label: "Active", value: users?.filter(u => u.status === 'ACTIVE').length ?? 0, color: "bg-emerald-400" },
                { label: "Pending", value: users?.filter(u => u.status === 'PENDING').length ?? 0, color: "bg-yellow-400" },
                { label: "Banned", value: users?.filter(u => u.status === 'BANNED').length ?? 0, color: "bg-red-400" },
                { label: "Rejected", value: users?.filter(u => u.status === 'REJECTED').length ?? 0, color: "bg-orange-400" },
              ].map((item, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-bold">{item.label}</span>
                    <span className="text-gray-900 font-black">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: (users?.length ?? 0) > 0 ? `${(item.value / users.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Provider accepted/rejected services */}
            {Object.keys(providerStatsMap).length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="font-black text-lg mb-6 text-gray-900">🛎️ Provider Service Request Stats</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-xs font-black text-gray-400 uppercase tracking-widest pb-3">Provider</th>
                        <th className="text-center text-xs font-black text-emerald-600 uppercase tracking-widest pb-3">Accepted</th>
                        <th className="text-center text-xs font-black text-red-500 uppercase tracking-widest pb-3">Declined</th>
                        <th className="text-center text-xs font-black text-gray-400 uppercase tracking-widest pb-3">Accept Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(providerStatsMap).map(([name, counts], i) => {
                        const total = counts.accepted + counts.declined;
                        const rate = total > 0 ? Math.round((counts.accepted / total) * 100) : 0;
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 font-bold text-gray-900">{name}</td>
                            <td className="py-4 text-center">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-black">{counts.accepted}</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-black">{counts.declined}</span>
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs font-black text-gray-600">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => navigate("/admin/users")} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-[#7C3AED]/50 hover:shadow-md transition-all text-center group">
                <div className="text-3xl mb-2">👥</div>
                <div className="font-black text-gray-900 group-hover:text-[#7C3AED] transition-colors">User Management</div>
                <div className="text-xs text-gray-400 mt-1">{users?.length ?? 0} total users</div>
              </div>
              <div onClick={() => navigate("/admin/requests")} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-yellow-500/50 hover:shadow-md transition-all text-center group">
                <div className="text-3xl mb-2">📋</div>
                <div className="font-black text-gray-900 group-hover:text-yellow-600 transition-colors">Pending Requests</div>
                <div className="text-xs text-gray-400 mt-1">{users?.filter(u => u.status === 'PENDING').length ?? 0} pending</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
