import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import axios from "axios";

export default function Navbar({ scrollToSection, homeRef, servicesRef, contactRef, galleryRef, reviewsRef }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const name = user?.name;

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:3000/api/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(res.data || []);
            } catch (err) {}
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:3000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {}
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate("/");
    };

    return (
        <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md px-8 py-4 flex justify-between items-center text-white">
            <h1
                className="text-2xl font-bold text-[#7C3AED] cursor-pointer"
                onClick={() => navigate("/feed")}
            >
                Axia Event Planner
            </h1>

            <div className="flex gap-8 text-gray-300">
                <button onClick={() => homeRef ? scrollToSection(homeRef) : navigate("/feed")}>Home</button>
                <button onClick={() => servicesRef ? scrollToSection(servicesRef) : navigate("/feed")}>Services</button>
                <button onClick={() => galleryRef ? scrollToSection(galleryRef) : navigate("/gallery")}>Gallery</button>
                {isAuthenticated && (
                    <button onClick={() => {
                        const role = user?.role;
                        if (role === "admin") navigate("/admin");
                        else if (role === "serviceProvider") navigate("/organizer/dashboard");
                        else navigate("/user/dashboard");
                    }}>Profile</button>
                )}
                
                <button onClick={() => contactRef ? scrollToSection(contactRef) : navigate("/feed")}>Contact</button>
            </div>

            <div className="flex items-center gap-4">
                

                {isAuthenticated ? (
                    <>
                        {/* Bell notification */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-gray-400 hover:text-white transition"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 top-10 w-80 bg-[#141428] border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                    <div className="flex justify-between items-center p-4 border-b border-gray-800">
                                        <h3 className="font-black text-sm uppercase tracking-widest">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} className="text-xs text-[#7C3AED] font-bold hover:underline">
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500 text-sm">No notifications yet</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n._id}
                                                    className={`p-4 border-b border-gray-800 hover:bg-[#1f1f35] transition cursor-pointer ${!n.read ? 'bg-[#7C3AED]/5 border-l-2 border-l-[#7C3AED]' : ''}`}
                                                    onClick={() => {
                                                        if (n.link) navigate(n.link);
                                                        setShowNotifications(false);
                                                    }}
                                                >
                                                    <div className="font-bold text-sm">{n.title}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{n.message}</div>
                                                    <div className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <span className="text-gray-300 font-medium">Hi, {name}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500/20 border border-red-500/50 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition ml-2"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => navigate("/login")}
                        className="bg-[#7C3AED] px-4 py-2 rounded-xl hover:bg-[#6D28D9] ml-2"
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
}