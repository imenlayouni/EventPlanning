import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyEvents, removeServiceFromEventAction, addEventAction } from "../../store/eventsSlice";
import Navbar from "../../components/Navbar";
import { Trash2, CreditCard, Search, Plus, X, CalendarPlus } from "lucide-react";

export default function MyEvents() {
    const dispatch = useDispatch();
    const [selectedServices, setSelectedServices] = useState({});
    const [searchTerms, setSearchTerms] = useState({});     // per-event service search
    const [globalSearch, setGlobalSearch] = useState("");
    const [searchMode, setSearchMode] = useState("events"); // "events" | "services"
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [newEventName, setNewEventName] = useState("");
    const [creating, setCreating] = useState(false);

    const { myEvents, loading, error } = useSelector((state) => state.events);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) dispatch(fetchMyEvents());
    }, [dispatch, isAuthenticated]);

    // ── Global filtering ─────────────────────────────────────────────────────
    const getVisibleEvents = () => {
        const term = globalSearch.toLowerCase().trim();
        if (!term) return myEvents;

        if (searchMode === "events") {
            return myEvents.filter(e => e.name?.toLowerCase().includes(term));
        }

        // services mode: keep events that have at least one matching service
        return myEvents.filter(e =>
            (e.services || []).some(s =>
                s.title?.toLowerCase().includes(term) ||
                s.category?.toLowerCase().includes(term) ||
                `${s.organizer?.firstName} ${s.organizer?.lastName}`.toLowerCase().includes(term)
            )
        );
    };

    // When in services-mode global search, restrict which services show per event
    const getServicesForEvent = (event) => {
        const globalTerm = globalSearch.toLowerCase().trim();
        const localTerm = (searchTerms[event._id] || "").toLowerCase();
        let services = event.services || [];

        if (globalTerm && searchMode === "services") {
            services = services.filter(s =>
                s.title?.toLowerCase().includes(globalTerm) ||
                s.category?.toLowerCase().includes(globalTerm) ||
                `${s.organizer?.firstName} ${s.organizer?.lastName}`.toLowerCase().includes(globalTerm)
            );
        }

        if (localTerm) {
            services = services.filter(s =>
                s.title?.toLowerCase().includes(localTerm) ||
                s.category?.toLowerCase().includes(localTerm) ||
                `${s.organizer?.firstName} ${s.organizer?.lastName}`.toLowerCase().includes(localTerm)
            );
        }

        return services;
    };

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newEventName.trim()) return;
        setCreating(true);
        await dispatch(addEventAction(newEventName.trim()));
        setNewEventName("");
        setCreating(false);
        setShowNewEventModal(false);
    };

    const handleRemoveService = (eventId, serviceId) => {
        if (window.confirm("Are you sure you want to remove this service?")) {
            dispatch(removeServiceFromEventAction({ eventId, serviceId }));
        }
    };

    const toggleServiceSelection = (eventId, serviceId) => {
        setSelectedServices(prev => {
            const current = prev[eventId] || [];
            const next = current.includes(serviceId)
                ? current.filter(id => id !== serviceId)
                : [...current, serviceId];
            return { ...prev, [eventId]: next };
        });
    };

    const handleCheckAll = (eventId, filteredServices) => {
        setSelectedServices(prev => {
            const allIds = filteredServices.map(s => s._id);
            const current = prev[eventId] || [];
            const allSelected = allIds.every(id => current.includes(id));
            return {
                ...prev,
                [eventId]: allSelected
                    ? current.filter(id => !allIds.includes(id))
                    : [...new Set([...current, ...allIds])]
            };
        });
    };

    const calculateTotal = (services) =>
        services.reduce((acc, s) => acc + parseFloat(s.price?.replace(/[^0-9.]/g, '') || 0), 0);

    const calculateSelectedTotal = (eventId, services) => {
        const selectedIds = selectedServices[eventId] || [];
        return services
            .filter(s => selectedIds.includes(s._id))
            .reduce((acc, s) => acc + parseFloat(s.price?.replace(/[^0-9.]/g, '') || 0), 0);
    };

    // ── Auth guard ────────────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="bg-[#F5F0FF] text-gray-900 min-h-screen">
                <Navbar />
                <div className="pt-32 px-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Please login to view your events</h2>
                </div>
            </div>
        );
    }

    const visibleEvents = getVisibleEvents();

    return (
        <div className="bg-[#F5F0FF] text-gray-900 min-h-screen">
            <Navbar />

            {/* New Event Modal */}
            {showNewEventModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md border border-[#E4D9FF] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                                    <CalendarPlus size={20} />
                                </div>
                                <h2 className="text-xl font-black text-gray-900">Create New Event</h2>
                            </div>
                            <button
                                onClick={() => { setShowNewEventModal(false); setNewEventName(""); }}
                                className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Event Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="e.g. Sarah's Wedding, Tech Conference 2026..."
                                    value={newEventName}
                                    onChange={e => setNewEventName(e.target.value)}
                                    className="w-full bg-[#F5F0FF] border border-[#E4D9FF] rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowNewEventModal(false); setNewEventName(""); }}
                                    className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newEventName.trim()}
                                    className="flex-1 py-3 rounded-2xl bg-[#7C3AED] text-white font-black uppercase tracking-widest hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? "Creating..." : "Create Event"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="pt-32 px-8 md:px-16 mb-16 max-w-7xl mx-auto">

                {/* ── Page header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-[#1E0B3E]">My Events</h1>
                        <p className="text-gray-500 mt-1">{myEvents.length} event{myEvents.length !== 1 ? "s" : ""} planned</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => dispatch(fetchMyEvents())}
                            className="text-gray-400 hover:text-gray-700 transition text-sm flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E4D9FF] bg-white"
                        >
                            ↻ Refresh
                        </button>
                        <button
                            onClick={() => setShowNewEventModal(true)}
                            className="flex items-center gap-2 bg-[#7C3AED] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20"
                        >
                            <Plus size={18} /> New Event
                        </button>
                    </div>
                </div>

                {/* ── Global search bar ── */}
                <div className="bg-white rounded-2xl border border-[#E4D9FF] shadow-sm p-4 mb-10 flex flex-col sm:flex-row gap-3 items-center">
                    {/* Mode toggle */}
                    <div className="flex bg-[#F5F0FF] rounded-xl p-1 shrink-0">
                        <button
                            onClick={() => { setSearchMode("events"); setGlobalSearch(""); }}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                searchMode === "events"
                                    ? "bg-[#7C3AED] text-white shadow-md"
                                    : "text-[#7C3AED] hover:bg-[#7C3AED]/10"
                            }`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => { setSearchMode("services"); setGlobalSearch(""); }}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                searchMode === "services"
                                    ? "bg-[#7C3AED] text-white shadow-md"
                                    : "text-[#7C3AED] hover:bg-[#7C3AED]/10"
                            }`}
                        >
                            Services
                        </button>
                    </div>

                    {/* Search input */}
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={
                                searchMode === "events"
                                    ? "Search your events by name..."
                                    : "Search services across all events by name, category or provider..."
                            }
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            className="w-full bg-[#F5F0FF] border border-[#E4D9FF] rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none"
                        />
                        {globalSearch && (
                            <button
                                onClick={() => setGlobalSearch("")}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Result hint */}
                    {globalSearch && (
                        <span className="text-xs text-[#7C3AED] font-bold shrink-0">
                            {visibleEvents.length} result{visibleEvents.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {loading && <div className="text-gray-400 animate-pulse">Loading your events...</div>}
                {error && <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 mb-8">Error: {error}</div>}

                {/* ── Empty state ── */}
                {!loading && myEvents.length === 0 && (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#E4D9FF] shadow-sm">
                        <div className="w-20 h-20 rounded-3xl bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-6">
                            <CalendarPlus size={36} className="text-[#7C3AED]" />
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-gray-800">No events yet</h3>
                        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">Create your first event and start adding services to plan something memorable.</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowNewEventModal(true)}
                                className="bg-[#7C3AED] px-8 py-3 rounded-xl font-bold text-white hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20"
                            >
                                Create Event
                            </button>
                            <button
                                onClick={() => window.location.href = '/feed'}
                                className="px-8 py-3 rounded-xl font-bold text-[#7C3AED] border border-[#7C3AED]/30 hover:bg-[#7C3AED]/10 transition"
                            >
                                Explore Services
                            </button>
                        </div>
                    </div>
                )}

                {/* ── No search results ── */}
                {!loading && myEvents.length > 0 && visibleEvents.length === 0 && (
                    <div className="bg-white rounded-3xl p-12 text-center border border-[#E4D9FF] shadow-sm">
                        <p className="text-gray-400 text-lg">No {searchMode} match "<span className="text-gray-600 font-bold">{globalSearch}</span>"</p>
                        <button onClick={() => setGlobalSearch("")} className="mt-4 text-[#7C3AED] text-sm font-bold hover:underline">Clear search</button>
                    </div>
                )}

                {/* ── Event cards ── */}
                <div className="grid gap-12">
                    {visibleEvents.map((event) => {
                        const filteredServices = getServicesForEvent(event);
                        const totalAmount = calculateTotal(event.services || []);
                        const selectedTotal = calculateSelectedTotal(event._id, event.services || []);
                        const selectedCount = selectedServices[event._id]?.length || 0;
                        const localTerm = searchTerms[event._id] || "";
                        const allFilteredSelected = filteredServices.length > 0 &&
                            filteredServices.every(s => (selectedServices[event._id] || []).includes(s._id));

                        return (
                            <div key={event._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E4D9FF] hover:border-[#7C3AED]/40 hover:shadow-md transition-all duration-300">
                                {/* Event Header */}
                                <div className="p-8 bg-gradient-to-r from-[#F5F0FF] to-white border-b border-[#E4D9FF] flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-[#1E0B3E] mb-1 uppercase tracking-tight">{event.name}</h2>
                                        <p className="text-gray-400 text-sm">{event.services?.length || 0} services attached</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Total Budget</p>
                                        <p className="text-2xl font-black text-[#7C3AED]">{totalAmount.toLocaleString()} TND</p>
                                    </div>
                                </div>

                                {/* Per-event service search + Check All */}
                                {event.services && event.services.length > 0 && (
                                    <div className="px-8 py-4 border-b border-[#E4D9FF] flex flex-col sm:flex-row gap-3 items-center bg-[#F5F0FF]/60">
                                        <div className="relative flex-1 w-full">
                                            <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Filter services in this event..."
                                                value={localTerm}
                                                onChange={e => setSearchTerms(prev => ({ ...prev, [event._id]: e.target.value }))}
                                                className="w-full bg-white border border-[#E4D9FF] rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleCheckAll(event._id, filteredServices)}
                                            className={`flex-shrink-0 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                                                allFilteredSelected
                                                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                                                    : "bg-white text-[#7C3AED] border-[#E4D9FF] hover:border-[#7C3AED]"
                                            }`}
                                        >
                                            {allFilteredSelected ? "✓ Uncheck All" : "Check All"}
                                        </button>
                                    </div>
                                )}

                                {/* Services grid */}
                                <div className="p-8">
                                    {filteredServices.length === 0 && (localTerm || (globalSearch && searchMode === "services")) && (
                                        <div className="py-8 text-center text-gray-400">No services match your search</div>
                                    )}
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredServices.length > 0 ? (
                                            filteredServices.map((service) => (
                                                <div key={service._id} className="group bg-[#F5F0FF] rounded-2xl overflow-hidden hover:ring-2 hover:ring-[#7C3AED] transition-all duration-300 relative border border-[#E4D9FF]">
                                                    <div className="absolute top-3 left-3 z-10">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 accent-[#7C3AED] rounded cursor-pointer"
                                                            checked={selectedServices[event._id]?.includes(service._id) || false}
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
                                                        <div className="h-44 bg-[#E4D9FF] flex items-center justify-center text-[#7C3AED]/50 text-sm">
                                                            No Preview Available
                                                        </div>
                                                    )}

                                                    <div className="p-5">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{service.title}</h3>
                                                                <span className="bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] px-2 py-1 rounded-full uppercase font-black tracking-widest">
                                                                    {service.category}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveService(event._id, service._id)}
                                                                className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                                                title="Remove Service"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>

                                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#E4D9FF]">
                                                            <span className="text-lg font-black text-[#1E0B3E]">{service.price}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium text-right">
                                                                Provided by <br />
                                                                <span className="text-gray-600 font-bold">{service.organizer?.firstName} {service.organizer?.lastName}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (!localTerm && !(globalSearch && searchMode === "services") && (
                                            <div className="col-span-full py-12 text-center border-2 border-dashed border-[#E4D9FF] rounded-3xl">
                                                <p className="text-gray-400 text-lg">No services added yet. Browse the feed to add some.</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Checkout footer */}
                                {event.services && event.services.length > 0 && (
                                    <div className="bg-[#F5F0FF] p-8 border-t border-[#E4D9FF] flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="text-center md:text-left">
                                            <p className="text-gray-500 text-sm mb-1">
                                                {selectedCount === 0
                                                    ? "Select services above to proceed with checkout"
                                                    : `${selectedCount} service${selectedCount !== 1 ? "s" : ""} selected`}
                                            </p>
                                            <p className="text-2xl font-black text-[#1E0B3E]">
                                                Total: <span className="text-[#10B981]">{selectedTotal.toLocaleString()} TND</span>
                                            </p>
                                        </div>
                                        <button
                                            disabled={selectedCount === 0}
                                            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-lg ${
                                                selectedCount > 0
                                                    ? "bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20"
                                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
