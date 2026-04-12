import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import { fetchPendingRequests, fetchAdminServiceRequests } from "../../store/adminSlice";
import { LayoutDashboard, ClipboardList, Users, CheckCircle } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { pendingRequests } = useSelector(s => s.admin);

  const pendingCount = (pendingRequests?.listings?.length || 0) + (pendingRequests?.services?.length || 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  useEffect(() => {
    dispatch(fetchPendingRequests());
    dispatch(fetchAdminServiceRequests());
  }, [dispatch]);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { to: '/admin/requests', label: 'Requests', icon: CheckCircle, badge: pendingCount },
    { to: '/admin/users', label: 'User Management', icon: Users, badge: 0 },
    { to: '/admin/edit-profile', label: 'Edit Profile', icon: ClipboardList, badge: 0 }
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0b16] text-white">
      <aside className="w-72 bg-[#141428] border-r border-gray-800 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-black text-[#7C3AED] uppercase tracking-tighter cursor-pointer" onClick={() => navigate("/")}>
            Axia Event Planner
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-6 space-y-3">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                location.pathname === item.to
                  ? "bg-[#7C3AED] text-white shadow-xl shadow-[#7C3AED]/20 scale-[1.05]"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <item.icon size={20} /> {item.label}
              {item.badge > 0 && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] ${
                  location.pathname === item.to ? "bg-white text-[#7C3AED]" : "bg-red-500 text-white"
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div className="pt-8 border-t border-gray-800 mt-8">
            <button
              onClick={() => navigate('/feed')}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all"
            >
              <LayoutDashboard size={20} /> Back to Feed
            </button>
          </div>
        </nav>

        <div className="p-8 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
