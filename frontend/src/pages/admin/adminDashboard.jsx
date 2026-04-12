import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, Bell } from 'lucide-react';
import { logout } from "../../store/authSlice";
import { fetchAnalytics, fetchAllUsers } from "../../store/adminSlice";


export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, analytics } = useSelector((state) => state.admin);

  const [showNotifications, setShowNotifications] = useState(false);

  //poll for pending users (notification badge)
  const pendingCount = 0;

  useEffect(() => {
    dispatch(fetchAnalytics());
    dispatch(fetchAllUsers({}));
    //refresh interval
    const interval = setInterval(() => {
      dispatch(fetchAnalytics());
    }, 30000);//every 30 seconds it refreshes data

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // no filters on this simplified dashboard

  return (
    <div className="min-h-screen bg-[#0b0b16] text-white">
      {/* navbar */}
      <nav className="bg-[#141428] border-b border-gray-800 sticky top-0 z-10 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-10">
              <h1 className="text-3xl font-black text-[#7C3AED] uppercase tracking-tighter" onClick={() => navigate("/")}>Axia Event Planner</h1>
            </div>

            <div className="flex items-center space-x-6">
              {/*notifications*/}
              <div className="relative cursor-pointer group" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="h-6 w-6 text-gray-400 group-hover:text-[#7C3AED] transition-all" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>

              <button onClick={handleLogout} className="px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-12">

        {/*analytics section*/}
       {analytics && (
    <div className="space-y-8">
        <h2 className="text-3xl font-black">Dashboard Overview</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: "Total Users", value: analytics?.totalUsers ?? 0, icon: "👥", color: "text-[#7C3AED]", border: "hover:border-[#7C3AED]/50" },
                { label: "Total Events", value: analytics?.totalEvents ?? 0, icon: "🎉", color: "text-green-400", border: "hover:border-green-500/50" },
                { label: "Pending Users", value: users?.filter(u => u.status === 'PENDING').length ?? 0, icon: "⏳", color: "text-yellow-400", border: "hover:border-yellow-500/50" },
                { label: "Active Users", value: users?.filter(u => u.status === 'ACTIVE').length ?? 0, icon: "✅", color: "text-emerald-400", border: "hover:border-emerald-500/50" },
                { label: "Banned Users", value: users?.filter(u => u.status === 'BANNED').length ?? 0, icon: "🚫", color: "text-red-400", border: "hover:border-red-500/50" },
                { label: "Providers", value: users?.filter(u => u.role === 'serviceProvider').length ?? 0, icon: "🛎️", color: "text-blue-400", border: "hover:border-blue-500/50" },
                { label: "Participants", value: users?.filter(u => u.role === 'participant').length ?? 0, icon: "👤", color: "text-pink-400", border: "hover:border-pink-500/50" },
                { label: "Rejected Users", value: users?.filter(u => u.status === 'REJECTED').length ?? 0, icon: "❌", color: "text-orange-400", border: "hover:border-orange-500/50" },
            ].map((item, i) => (
                <div key={i} className={`bg-[#141428] p-6 rounded-2xl border border-gray-800 shadow-xl ${item.border} transition-all`}>
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                    <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                </div>
            ))}
        </div>

        {/* User status bars */}
        <div className="bg-[#141428] p-6 rounded-3xl border border-gray-800">
            <h3 className="font-black text-lg mb-4">📊 User Status Overview</h3>
            {[
                { label: "Active", value: users?.filter(u => u.status === 'ACTIVE').length ?? 0, color: "bg-emerald-400" },
                { label: "Pending", value: users?.filter(u => u.status === 'PENDING').length ?? 0, color: "bg-yellow-400" },
                { label: "Banned", value: users?.filter(u => u.status === 'BANNED').length ?? 0, color: "bg-red-400" },
                { label: "Rejected", value: users?.filter(u => u.status === 'REJECTED').length ?? 0, color: "bg-orange-400" },
            ].map((item, i) => (
                <div key={i} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 font-bold">{item.label}</span>
                        <span className="text-white font-black">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                            className={`${item.color} h-2 rounded-full transition-all`}
                            style={{ width: (users?.length ?? 0) > 0 ? `${(item.value / users.length) * 100}%` : '0%' }}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
            <div onClick={() => navigate("/admin/users")} className="bg-[#141428] p-6 rounded-2xl border border-gray-800 cursor-pointer hover:border-[#7C3AED]/50 transition-all text-center group">
                <div className="text-3xl mb-2">👥</div>
                <div className="font-black group-hover:text-[#A78BFA] transition-colors">User Management</div>
                <div className="text-xs text-gray-500 mt-1">{users?.length ?? 0} total users</div>
            </div>
            <div onClick={() => navigate("/admin/requests")} className="bg-[#141428] p-6 rounded-2xl border border-gray-800 cursor-pointer hover:border-yellow-500/50 transition-all text-center group">
                <div className="text-3xl mb-2">📋</div>
                <div className="font-black group-hover:text-yellow-400 transition-colors">Pending Requests</div>
                <div className="text-xs text-gray-500 mt-1">{users?.filter(u => u.status === 'PENDING').length ?? 0} pending</div>
            </div>
        </div>
    </div>
)}
        {/* Dashboard simplified — user management moved to AdminUsers page */}

      </div>
    </div>
  );
}
