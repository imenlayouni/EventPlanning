import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyEvents, removeServiceFromEventAction } from "../../store/eventsSlice";
import Navbar from "../../components/Navbar";
import { Trash2, CreditCard } from "lucide-react";

export default function MyEvents() {
    const dispatch = useDispatch();
    const [selectedServices, setSelectedServices] = useState({}); // { [eventId]: [serviceIds] }
    const { myEvents, loading, error } = useSelector((state) => state.events);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchMyEvents());
        }
    }, [dispatch, isAuthenticated]);

    const handleRemoveService = (eventId, serviceId) => {
        if (window.confirm("Are you sure you want to remove this service?")) {
            dispatch(removeServiceFromEventAction({ eventId, serviceId }));
        }
    };

    const toggleServiceSelection = (eventId, serviceId) => {
        setSelectedServices(prev => {
            const eventSelections = prev[eventId] || [];
            const newSelections = eventSelections.includes(serviceId)
                ? eventSelections.filter(id => id !== serviceId)
                : [...eventSelections, serviceId];
            return { ...prev, [eventId]: newSelections };
        });
    };

    const calculateTotal = (services) => {
        return services.reduce((acc, s) => {
            const price = parseFloat(s.price?.replace(/[^0-9.]/g, '') || 0);
            return acc + price;
        }, 0);
    };

    const calculateSelectedTotal = (eventId, services) => {
        const selectedIds = selectedServices[eventId] || [];
        return services
            .filter(s => selectedIds.includes(s._id))
            .reduce((acc, s) => {
                const price = parseFloat(s.price?.replace(/[^0-9.]/g, '') || 0);
                return acc + price;
            }, 0);
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-[#0b0b16] text-white min-h-screen">
                <Navbar />
                <div className="pt-32 px-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Please login to view your events</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0b0b16] text-white min-h-screen">
            <Navbar />

            <div className="pt-32 px-8 md:px-16 mb-16 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <h1 className="text-4xl font-bold text-[#7C3AED]">My Event Dashboard</h1>
                    <button
                        onClick={() => dispatch(fetchMyEvents())}
                        className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2"
                    >
                        ↻ Refresh Events
                    </button>
                </div>

                {loading && <div className="text-gray-400 animate-pulse">Loading your special events...</div>}
                {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 mb-8">Error: {error}</div>}

                {!loading && myEvents.length === 0 && (
                    <div className="bg-[#141428] rounded-3xl p-16 text-center border border-gray-800 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4 opacity-80">Your dashboard is empty</h3>
                        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">Start planning your dream event today by adding services from our curated library.</p>
                        <button
                            onClick={() => window.location.href = '/feed'}
                            className="bg-[#7C3AED] px-8 py-3 rounded-xl font-bold hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20"
                        >
                            Explore Services
                        </button>
                    </div>
                )}

                <div className="grid gap-12">
                    {myEvents.map((event) => {
                        const totalAmount = calculateTotal(event.services || []);
                        const selectedTotal = calculateSelectedTotal(event._id, event.services || []);
                        const selectedCount = selectedServices[event._id]?.length || 0;

                        return (
                            <div key={event._id} className="bg-[#141428] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50 hover:border-[#7C3AED]/30 transition-all duration-300">
                                {/* Event Header */}
                                <div className="p-8 bg-gradient-to-r from-[#1f1f35] to-[#141428] border-b border-gray-800 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-1 uppercase tracking-tight">{event.name}</h2>
                                        <p className="text-gray-400 text-sm">{event.services?.length || 0} services attached</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Total Budget</p>
                                        <p className="text-2xl font-black text-[#7C3AED]">${totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Services Section */}
                                <div className="p-8">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {event.services && event.services.length > 0 ? (
                                            event.services.map((service) => (
                                                <div key={service._id} className="group bg-[#1f1f35] rounded-2xl overflow-hidden hover:ring-2 hover:ring-[#7C3AED] transition-all duration-300 relative">
                                                    {/* Selection Checkbox */}
                                                    <div className="absolute top-3 left-3 z-10">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 accent-[#7C3AED] rounded cursor-pointer ring-offset-0 focus:ring-0"
                                                            checked={selectedServices[event._id]?.includes(service._id)}
                                                            onChange={() => toggleServiceSelection(event._id, service._id)}
                                                        />
                                                    </div>

                                                    {service.images && service.images.length > 0 ? (
                                                        <img
                                                            src={service.images[0]}
                                                            alt={service.title}
                                                            className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="h-44 bg-[#2a2a4a] flex items-center justify-center text-gray-500 text-sm">
                                                            No Preview Available
                                                        </div>
                                                    )}

                                                    <div className="p-5">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-bold text-xl leading-tight mb-1">{service.title}</h3>
                                                                <span className="bg-[#7C3AED]/20 text-[#A78BFA] text-[10px] px-2 py-1 rounded-full uppercase font-black tracking-widest">
                                                                    {service.category}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveService(event._id, service._id)}
                                                                className="text-gray-600 hover:text-red-500 p-2 transition-colors"
                                                                title="Remove Service"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>

                                                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800/50">
                                                            <span className="text-xl font-black text-white">{service.price}</span>
                                                            <span className="text-[10px] text-gray-500 font-medium">
                                                                Provided by <br />
                                                                <span className="text-gray-300 font-bold">{service.organizer?.firstName} {service.organizer?.lastName}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                                                <p className="text-gray-600 text-lg">Empty event bucket. Browse the feed to add services.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer / Payment Section */}
                                {event.services && event.services.length > 0 && (
                                    <div className="bg-[#1a1a2e] p-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="text-center md:text-left">
                                            <p className="text-gray-400 text-sm mb-1">
                                                {selectedCount === 0
                                                    ? "Select items above to proceed with secure checkout"
                                                    : `${selectedCount} items selected for payment`}
                                            </p>
                                            <p className="text-3xl font-black">
                                                Total Payable: <span className="text-[#10B981]">${selectedTotal.toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <button
                                            disabled={selectedCount === 0}
                                            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${selectedCount > 0
                                                ? "bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20 scale-100"
                                                : "bg-gray-700 text-gray-400 cursor-not-allowed grayscale opacity-50"
                                                }`}
                                        >
                                            <CreditCard size={20} /> Secure Checkout
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
