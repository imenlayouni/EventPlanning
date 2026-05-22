import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from 'lucide-react';


export default function DashboardLayout({ subtitle, tabs, activeTab, onTabChange, onLogout, children }) {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen bg-[#F5F0FF] text-gray-900">
            {/* ── Sidebar ── */}
            <aside className="w-72 bg-[#1E0B3E] border-r border-[#3D1E7A] hidden md:flex flex-col sticky top-0 h-screen shadow-xl">
                {/* Logo */}
                <div className="p-8">
                    <h1
                        className="text-3xl font-black text-[#C4B5FD] uppercase tracking-tighter cursor-pointer hover:text-white transition-colors"
                        onClick={() => navigate('/feed')}
                    >
                        Axia Event Planner
                    </h1>
                    <p className="text-[10px] text-[#6B4FA0] font-bold uppercase tracking-widest mt-1">{subtitle}</p>
                </div>

                {/* Nav tabs */}
                <nav className="flex-1 px-6 space-y-3">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id
                                    ? "bg-[#7C3AED] text-white shadow-xl shadow-[#7C3AED]/30 scale-[1.05]"
                                    : "text-[#C4B5FD] hover:bg-[#7C3AED]/20 hover:text-white"
                            }`}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] ${
                                    activeTab === tab.id ? "bg-white text-[#7C3AED]" : "bg-red-500 text-white"
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}

                    {/* Back to Feed */}
                    <div className="pt-8 border-t border-[#3D1E7A] mt-8">
                        <button
                            onClick={() => navigate('/feed')}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-[#C4B5FD] hover:bg-[#7C3AED]/20 hover:text-white transition-all"
                        >
                            <LayoutDashboard size={20} /> Back to Feed
                        </button>
                    </div>
                </nav>

                {/* Logout */}
                <div className="p-8 border-t border-[#3D1E7A]">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 p-12 overflow-y-auto max-h-screen custom-scrollbar">
                {children}
            </main>
        </div>
    );
}
