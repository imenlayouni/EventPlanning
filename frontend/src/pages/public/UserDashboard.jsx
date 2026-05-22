import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { LayoutDashboard, User, ClipboardList, Trash2, CreditCard, Plus, Search, X, CalendarPlus } from 'lucide-react';
import LocationPicker from "../../components/LocationPicker";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "../../store/authSlice";
import { fetchMyEvents, removeServiceFromEventAction, addEventAction } from "../../store/eventsSlice";
import axios from "axios";
import { fetchMyRequests, signContract, sendRequestMessage } from "../../store/requestSlice";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatsCard from "../../components/ui/StatsCard";
import StatusBadge from "../../components/ui/StatusBadge";

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useSelector(state => state.auth);
  const { myEvents } = useSelector(state => state.events);
  const { myRequests } = useSelector(state => state.serviceRequests);

  const [selectedServices, setSelectedServices] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [sendingReply, setSendingReply] = useState({});
  const [eventsSearch, setEventsSearch] = useState("");
  const [eventsSearchMode, setEventsSearchMode] = useState("events"); // "events" | "services"
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  const PASSWORD_PLACEHOLDER = "********";
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', location: '', phone: '', password: PASSWORD_PLACEHOLDER, assets: '' });
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', location: user.location || '', phone: user.phone || '', assets: user.assets || '', password: PASSWORD_PLACEHOLDER });
      if (user.coordinates?.lat) setCoordinates(user.coordinates);
      dispatch(fetchMyEvents());
      dispatch(fetchMyRequests());
    }
  }, [user, dispatch]);

  const toggleServiceSelection = (eventId, serviceId) => {
    setSelectedServices(prev => {
      const eventSelections = prev[eventId] || [];
      const newSelections = eventSelections.includes(serviceId)
        ? eventSelections.filter(id => id !== serviceId)
        : [...eventSelections, serviceId];
      return { ...prev, [eventId]: newSelections };
    });
  };

  const calculateSelectedTotal = (eventId, services) => {
    const selectedIds = selectedServices[eventId] || [];
    return services
      .filter(s => selectedIds.includes(s._id))
      .reduce((acc, s) => {
        const price = parseFloat(String(s.price || "0").replace(/[^0-9.]/g, '')) || 0;
        return acc + price;
      }, 0);
  };

  const handleRemoveService = (eventId, serviceId) => {
    if (window.confirm("Are you sure you want to remove this service?")) {
      dispatch(removeServiceFromEventAction({ eventId, serviceId }));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const body = { ...form, coordinates };
      if (!body.password || body.password === PASSWORD_PLACEHOLDER) delete body.password;
      const res = await axios.put('http://localhost:3000/api/auth/profile', body, { headers: { Authorization: `Bearer ${token}` } });
      dispatch(updateUser(res.data));
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };
const handleCheckout = async (eventId, services) => {
    try {
        const token = localStorage.getItem('token');
        const selectedIds = selectedServices[eventId] || [];
        const selectedItems = services.filter(s => selectedIds.includes(s._id));

        const res = await axios.post(
            'http://localhost:3000/api/payments/create-checkout-session',
            {
                services: selectedItems.map(s => ({
                    title: s.title,
                    price: s.price,
                    quantity: 1
                }))
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // redirect to Stripe checkout
        window.location.href = res.data.url;
    } catch (err) {
        toast.error('Checkout failed. Please try again.');
    }
};
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
    const totalEvents = myEvents.length;
    const totalServices = myEvents.reduce((acc, e) => acc + (e.services?.length || 0), 0);
    const totalSpent = myEvents.reduce((acc, e) => {
        return acc + (e.services || []).reduce((a, s) => a + (parseFloat(String(s.price || "0").replace(/[^0-9.]/g, '')) || 0), 0);
    }, 0);
    const pendingRequests = myRequests.filter(r => r.status === 'pending').length;
    const acceptedRequests = myRequests.filter(r => r.status === 'accepted').length;
    const contractsSigned = myRequests.filter(r => r.contract?.clientSigned).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black mb-4">Welcome back, {user?.firstName}! 👋</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: "Total Events", value: totalEvents, icon: "🎉", color: "text-[#7C3AED]", border: "hover:border-[#7C3AED]/50" },
                    { label: "Services Added", value: totalServices, icon: "🛎️", color: "text-blue-400", border: "hover:border-blue-500/50" },
                    { label: "Total Spent", value: `${totalSpent.toLocaleString()} TND`, icon: "💰", color: "text-emerald-600", border: "hover:border-emerald-500/50" },
                    { label: "Pending Requests", value: pendingRequests, icon: "⏳", color: "text-yellow-400", border: "hover:border-yellow-500/50" },
                    { label: "Accepted Requests", value: acceptedRequests, icon: "✅", color: "text-green-400", border: "hover:border-green-500/50" },
                    { label: "Contracts Signed", value: contractsSigned, icon: "📄", color: "text-pink-400", border: "hover:border-pink-500/50" },
                ].map((item, i) => (
                    <StatsCard key={i} icon={item.icon} label={item.label} value={item.value} color={item.color} borderColor={item.border} />
                ))}
            </div>

            {/* Request status bars */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="font-black text-lg mb-4 text-gray-900">📊 Request Status Overview</h3>
                {myRequests.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">No requests yet.</p>
                ) : (
                    <div className="space-y-3">
                        {[
                            { label: "Pending", value: pendingRequests, color: "bg-yellow-400" },
                            { label: "Accepted", value: acceptedRequests, color: "bg-emerald-400" },
                            { label: "Declined", value: myRequests.filter(r => r.status === 'declined').length, color: "bg-red-400" },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500 font-bold">{item.label}</span>
                                    <span className="text-gray-900 font-black">{item.value}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`${item.color} h-2 rounded-full transition-all`}
                                        style={{ width: myRequests.length > 0 ? `${(item.value / myRequests.length) * 100}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-4">
                <div onClick={() => setActiveTab('events')} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-[#7C3AED]/50 hover:shadow-md transition-all text-center group">
                    <div className="text-3xl mb-2">🎉</div>
                    <div className="font-black text-gray-900 group-hover:text-[#7C3AED] transition-colors">My Events</div>
                    <div className="text-xs text-gray-400 mt-1">{totalEvents} events</div>
                </div>
                <div onClick={() => setActiveTab('requests')} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-yellow-500/50 hover:shadow-md transition-all text-center group">
                    <div className="text-3xl mb-2">📩</div>
                    <div className="font-black text-gray-900 group-hover:text-yellow-600 transition-colors">My Requests</div>
                    <div className="text-xs text-gray-400 mt-1">{myRequests.length} total</div>
                </div>
                <div onClick={() => navigate('/feed')} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all text-center group">
                    <div className="text-3xl mb-2">🔍</div>
                    <div className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors">Browse Services</div>
                    <div className="text-xs text-gray-400 mt-1">Find providers</div>
                </div>
            </div>
        </div>
    );
      case 'events': {
        const term = eventsSearch.toLowerCase().trim();
        const visibleEvents = term
          ? eventsSearchMode === "events"
            ? myEvents.filter(e => e.name?.toLowerCase().includes(term))
            : myEvents.filter(e => (e.services || []).some(s =>
                s.title?.toLowerCase().includes(term) ||
                s.category?.toLowerCase().includes(term) ||
                `${s.organizer?.firstName} ${s.organizer?.lastName}`.toLowerCase().includes(term)
              ))
          : myEvents;

        const getVisibleServices = (event) => {
          if (!term || eventsSearchMode === "events") return event.services || [];
          return (event.services || []).filter(s =>
            s.title?.toLowerCase().includes(term) ||
            s.category?.toLowerCase().includes(term) ||
            `${s.organizer?.firstName} ${s.organizer?.lastName}`.toLowerCase().includes(term)
          );
        };

        const handleCreateEvent = async (e) => {
          e.preventDefault();
          if (!newEventName.trim()) return;
          setCreatingEvent(true);
          await dispatch(addEventAction(newEventName.trim()));
          setNewEventName("");
          setCreatingEvent(false);
          setShowNewEventModal(false);
        };

        return (
          <div>
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
                    <button onClick={() => { setShowNewEventModal(false); setNewEventName(""); }} className="p-2 text-gray-400 hover:text-gray-700">
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Event Name</label>
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Sarah's Wedding, Company Party..."
                        value={newEventName}
                        onChange={e => setNewEventName(e.target.value)}
                        className="w-full bg-[#F5F0FF] border border-[#E4D9FF] rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => { setShowNewEventModal(false); setNewEventName(""); }} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition">Cancel</button>
                      <button type="submit" disabled={creatingEvent || !newEventName.trim()} className="flex-1 py-3 rounded-2xl bg-[#7C3AED] text-white font-black uppercase tracking-widest hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20 disabled:opacity-50">
                        {creatingEvent ? "Creating..." : "Create Event"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900">My Events</h2>
                <p className="text-gray-400 text-sm mt-1">{myEvents.length} event{myEvents.length !== 1 ? "s" : ""} planned</p>
              </div>
              <button
                onClick={() => setShowNewEventModal(true)}
                className="flex items-center gap-2 bg-[#7C3AED] text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20"
              >
                <Plus size={16} /> New Event
              </button>
            </div>

            {/* Search bar */}
            <div className="bg-white rounded-2xl border border-[#E4D9FF] shadow-sm p-3 mb-8 flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex bg-[#F5F0FF] rounded-xl p-1 shrink-0">
                <button
                  onClick={() => { setEventsSearchMode("events"); setEventsSearch(""); }}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${eventsSearchMode === "events" ? "bg-[#7C3AED] text-white shadow-md" : "text-[#7C3AED] hover:bg-[#7C3AED]/10"}`}
                >Events</button>
                <button
                  onClick={() => { setEventsSearchMode("services"); setEventsSearch(""); }}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${eventsSearchMode === "services" ? "bg-[#7C3AED] text-white shadow-md" : "text-[#7C3AED] hover:bg-[#7C3AED]/10"}`}
                >Services</button>
              </div>
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={eventsSearchMode === "events" ? "Search events by name..." : "Search services by name, category or provider..."}
                  value={eventsSearch}
                  onChange={e => setEventsSearch(e.target.value)}
                  className="w-full bg-[#F5F0FF] border border-[#E4D9FF] rounded-xl pl-9 pr-8 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none"
                />
                {eventsSearch && (
                  <button onClick={() => setEventsSearch("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    <X size={15} />
                  </button>
                )}
              </div>
              {eventsSearch && <span className="text-xs text-[#7C3AED] font-bold shrink-0">{visibleEvents.length} result{visibleEvents.length !== 1 ? "s" : ""}</span>}
            </div>

            {/* Empty state */}
            {myEvents.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E4D9FF] shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-4">
                  <CalendarPlus size={28} className="text-[#7C3AED]" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">No events yet</h3>
                <p className="text-gray-400 mb-6">Create your first event and start adding services to plan something memorable.</p>
                <button onClick={() => setShowNewEventModal(true)} className="bg-[#7C3AED] px-6 py-3 rounded-xl font-bold text-white hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20">
                  Create Event
                </button>
              </div>
            )}

            {/* No search results */}
            {myEvents.length > 0 && visibleEvents.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#E4D9FF] shadow-sm">
                <p className="text-gray-400">No {eventsSearchMode} match "<span className="text-gray-600 font-bold">{eventsSearch}</span>"</p>
                <button onClick={() => setEventsSearch("")} className="mt-3 text-[#7C3AED] text-sm font-bold hover:underline">Clear search</button>
              </div>
            )}

            <div className="grid gap-8">
              {visibleEvents.map((event) => {
                const total = (event.services || []).reduce((acc, s) => acc + parseFloat(String(s.price || "0").replace(/[^0-9.]/g, '') || 0), 0);
                const visibleServices = getVisibleServices(event);
                const confirmedServices = (event.services || []).filter(s => {
                  const req = myRequests.find(r => r.listing?._id === s._id && r.status === 'accepted');
                  return req?.contract?.status === 'FULLY_SIGNED';
                });
                const allConfirmedSelected = confirmedServices.length > 0 && confirmedServices.every(s => (selectedServices[event._id] || []).includes(s._id));
                return (
                  <div key={event._id} className="bg-white rounded-2xl border border-[#E4D9FF] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center p-6 border-b border-[#E4D9FF] bg-gradient-to-r from-[#F5F0FF] to-white">
                      <div>
                        <h3 className="text-xl font-black text-[#1E0B3E]">{event.name}</h3>
                        <p className="text-sm text-gray-400">{(event.services || []).length} services</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Total Budget</p>
                        <p className="text-xl font-black text-[#7C3AED]">{total.toLocaleString()} TND</p>
                      </div>
                    </div>

                    <div className="p-6">
                      {confirmedServices.length > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => {
                              const allIds = confirmedServices.map(s => s._id);
                              setSelectedServices(prev => {
                                const current = prev[event._id] || [];
                                const allSel = allIds.every(id => current.includes(id));
                                return { ...prev, [event._id]: allSel ? current.filter(id => !allIds.includes(id)) : [...new Set([...current, ...allIds])] };
                              });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${allConfirmedSelected ? "bg-[#7C3AED] text-white border-[#7C3AED]" : "bg-white text-[#7C3AED] border-[#E4D9FF] hover:border-[#7C3AED]"}`}
                          >
                            {allConfirmedSelected ? "✓ Uncheck All" : "Check All Confirmed"}
                          </button>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {visibleServices.map(s => {
                          const relatedRequest = myRequests.find(r => r.listing?._id === s._id && r.status === 'accepted');
                          const isConfirmed = relatedRequest?.contract?.status === 'FULLY_SIGNED';
                          return (
                            <div key={s._id} className={`bg-[#F5F0FF] p-3 rounded-xl relative border ${isConfirmed ? 'border-emerald-200' : 'border-[#E4D9FF]'}`}>
                              <div className="absolute top-3 left-3 z-10">
                                <input
                                  type="checkbox"
                                  disabled={!isConfirmed}
                                  className="w-5 h-5 accent-[#7C3AED] rounded cursor-pointer disabled:opacity-30"
                                  checked={(selectedServices[event._id] || []).includes(s._id)}
                                  onChange={(e) => { e.stopPropagation(); if (isConfirmed) toggleServiceSelection(event._id, s._id); }}
                                />
                              </div>
                              <div onClick={() => navigate(`/listing/${s._id}`)} className="flex items-center justify-between cursor-pointer pl-8">
                                <div>
                                  <div className="font-bold text-gray-900">{s.title}</div>
                                  <div className="text-xs text-gray-400">{s.organizer?.firstName} • {s.category}</div>
                                  {isConfirmed && <div className="text-xs text-emerald-600 font-bold mt-1">✅ Contract Signed — Ready for Checkout</div>}
                                  {!isConfirmed && relatedRequest?.status === 'accepted' && <div className="text-xs text-yellow-600 font-bold mt-1">⏳ Awaiting Contract Signature</div>}
                                  {!relatedRequest && <div className="text-xs text-gray-400 mt-1">No confirmed request yet</div>}
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div className="font-black text-gray-900">{s.price}</div>
                                  <button onClick={(e) => { e.stopPropagation(); handleRemoveService(event._id, s._id); }} className="text-gray-400 hover:text-red-500 p-2">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {visibleServices.length === 0 && eventsSearch && eventsSearchMode === "services" && (
                          <div className="col-span-2 py-6 text-center text-gray-400 text-sm">No matching services in this event</div>
                        )}
                        {(event.services || []).length === 0 && (
                          <div className="col-span-2 border-2 border-dashed border-[#E4D9FF] rounded-2xl py-10 flex flex-col items-center gap-4 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center text-3xl">🎪</div>
                            <div>
                              <p className="font-black text-gray-700 mb-1">No services yet</p>
                              <p className="text-gray-400 text-sm">Browse the catalogue and add services to bring this event to life.</p>
                            </div>
                            <button
                              onClick={() => navigate('/feed')}
                              className="flex items-center gap-2 bg-[#7C3AED] text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#6D28D9] transition shadow-lg shadow-[#7C3AED]/20"
                            >
                              ✨ Discover Services
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {event.services && event.services.length > 0 && (
                      <div className="bg-[#F5F0FF] px-6 py-5 border-t border-[#E4D9FF] flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                          <p className="text-gray-500 text-sm mb-1">
                            {(selectedServices[event._id] || []).length === 0 ? "Select confirmed services to proceed with checkout" : `${(selectedServices[event._id] || []).length} item${(selectedServices[event._id] || []).length !== 1 ? "s" : ""} selected`}
                          </p>
                          <p className="text-2xl font-black text-gray-900">Total: <span className="text-[#10B981]">{calculateSelectedTotal(event._id, event.services).toLocaleString()} TND</span></p>
                        </div>
                        <button
                          onClick={() => handleCheckout(event._id, event.services)}
                          disabled={
                            (selectedServices[event._id] || []).length === 0 ||
                            (selectedServices[event._id] || []).some(sid => {
                              const req = myRequests.find(r => r.listing?._id === sid && r.status === 'accepted');
                              return req?.contract?.status !== 'FULLY_SIGNED';
                            })
                          }
                          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg ${
                            (selectedServices[event._id] || []).length > 0 &&
                            !(selectedServices[event._id] || []).some(sid => {
                              const req = myRequests.find(r => r.listing?._id === sid && r.status === 'accepted');
                              return req?.contract?.status !== 'FULLY_SIGNED';
                            })
                              ? "bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <CreditCard size={18} /> Secure Checkout
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'requests':
        return (
          <div>
            <h2 className="text-3xl font-black mb-4">My Requests</h2>
            {(!myRequests || myRequests.length === 0) ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm">
                <p className="text-gray-400">No requests yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myRequests.map(req => {
                  const st = req.status || 'pending';
                  const contract = req.contract;
                  const userSigned = contract?.clientSigned;
                  const fullySigned = contract?.status === 'FULLY_SIGNED';
                  return (
                    <div key={req._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-lg text-gray-900">{req.listing?.title || 'Service'}</h3>
                          <p className="text-xs text-gray-400">To: {req.provider?.firstName} {req.provider?.lastName} • {req.requestType}</p>
                          <p className="mt-2 text-gray-600">{req.description}</p>
                          {req.finalPrice && <p className="text-[#7C3AED] font-bold text-sm mt-1">Agreed Price: {req.finalPrice} TND</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</div>
                          <StatusBadge status={st} />
                        </div>
                      </div>

                      {req.formAnswers && req.formAnswers.length > 0 && (
                        <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Your Submitted Details</p>
                          {req.formAnswers.map((ans, i) => (
                            <div key={i} className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">{ans.label}</span>
                              <span className="text-gray-900 font-bold">{ans.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {req.messages && req.messages.length > 0 && (
                        <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-200">Conversation</p>
                          <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
                            {req.messages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.senderRole === "participant" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderRole === "participant" ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "bg-gray-100 text-gray-700"}`}>
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                                    {msg.senderRole === "participant" ? "You" : req.provider?.firstName}
                                  </p>
                                  <p>{msg.text}</p>
                                  <p className="text-[10px] opacity-40 mt-1 text-right">{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {st === "pending" && (
                            <div className="p-3 border-t border-gray-200 flex gap-2">
                              <input
                                type="text"
                                value={replyTexts[req._id] || ""}
                                onChange={e => setReplyTexts(prev => ({ ...prev, [req._id]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === "Enter" && replyTexts[req._id]?.trim()) {
                                    setSendingReply(prev => ({ ...prev, [req._id]: true }));
                                    dispatch(sendRequestMessage({ id: req._id, text: replyTexts[req._id].trim() }))
                                      .then(() => setReplyTexts(prev => ({ ...prev, [req._id]: "" })))
                                      .finally(() => setSendingReply(prev => ({ ...prev, [req._id]: false })));
                                  }
                                }}
                                placeholder="Reply to provider..."
                                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none"
                              />
                              <button
                                disabled={!replyTexts[req._id]?.trim() || sendingReply[req._id]}
                                onClick={() => {
                                  setSendingReply(prev => ({ ...prev, [req._id]: true }));
                                  dispatch(sendRequestMessage({ id: req._id, text: replyTexts[req._id].trim() }))
                                    .then(() => setReplyTexts(prev => ({ ...prev, [req._id]: "" })))
                                    .finally(() => setSendingReply(prev => ({ ...prev, [req._id]: false })));
                                }}
                                className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-bold hover:bg-[#6D28D9] transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Send
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {!req.messages?.length && req.providerNote && (
                        <div className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1">Message from Provider</p>
                          <p className="text-gray-700 text-sm italic">"{req.providerNote}"</p>
                        </div>
                      )}
                      {st === 'accepted' && contract && (
                        <div className="mt-4 bg-gray-50 rounded-2xl border border-gray-200 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-sm uppercase tracking-widest text-[#7C3AED]">📄 Service Contract</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${fullySigned ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                              {fullySigned ? '✅ Fully Signed' : userSigned ? '⏳ Waiting for Provider' : '✍️ Needs Your Signature'}
                            </span>
                          </div>
                          <div className="bg-white rounded-xl p-4 mb-4 max-h-48 overflow-y-auto border border-gray-100">
                            <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono leading-relaxed">{contract.terms}</pre>
                          </div>
                          <div className="flex gap-4 mb-4">
                            <div className={`flex items-center gap-2 text-xs font-bold ${contract.clientSigned ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {contract.clientSigned ? '✅' : '⬜'} You
                              {contract.clientSignedAt && <span className="text-gray-400 font-normal">({new Date(contract.clientSignedAt).toLocaleDateString()})</span>}
                            </div>
                            <div className={`flex items-center gap-2 text-xs font-bold ${contract.providerSigned ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {contract.providerSigned ? '✅' : '⬜'} {req.provider?.firstName}
                              {contract.providerSignedAt && <span className="text-gray-400 font-normal">({new Date(contract.providerSignedAt).toLocaleDateString()})</span>}
                            </div>
                          </div>
                          {!userSigned && (() => {
                            const contractKey = contract._id;
                            const agreed = agreedToTerms[contractKey] || false;
                            return (
                              <>
                                <label className="flex items-start gap-3 mb-4 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={e => setAgreedToTerms(prev => ({ ...prev, [contractKey]: e.target.checked }))}
                                    className="mt-0.5 w-5 h-5 accent-[#7C3AED] rounded cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                    I have carefully read and I agree to all the <span className="text-[#7C3AED] font-bold">terms and conditions</span> stated in this contract.
                                  </span>
                                </label>
                                <button
                                  onClick={() => dispatch(signContract(contract._id))}
                                  disabled={!agreed}
                                  className={`w-full py-3 rounded-xl font-black uppercase tracking-widest transition-all ${
                                    agreed
                                      ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/20"
                                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  ✍️ Sign Contract
                                </button>
                                {!agreed && <p className="text-xs text-gray-400 text-center mt-2">You must agree to the terms to sign the contract.</p>}
                              </>
                            );
                          })()}
                          {fullySigned && (
                            <div className="text-center text-emerald-600 font-black text-sm">
                              🎉 Contract fully signed! You can now proceed to checkout.
                            </div>
                          )}
                        </div>
                      )}
                      {st === 'accepted' && !contract && (
                        <div className="mt-3 text-xs text-gray-500 italic">Contract being prepared...</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'events',    icon: ClipboardList,   label: 'My Events' },
    { id: 'requests',  icon: ClipboardList,   label: 'My Requests' },
    { id: 'profile',   icon: User,            label: 'Edit Profile' },
  ];

  return (
    <DashboardLayout
      subtitle="Participant Dashboard"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'profile' ? (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-black text-2xl">
              {user?.firstName?.[0] || "U"}
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">Edit Profile</h2>
              <p className="text-gray-400 text-sm">Update your personal information</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="flex gap-8 items-start">
              {/* Left: form */}
              <div className="flex-1 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-gray-100">
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Personal Information</h3>
                  </div>
                  <div className="p-8 grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">First Name</label>
                      <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Last Name</label>
                      <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                      <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" placeholder="+216 XX XXX XXX" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">City</label>
                      <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" placeholder="Auto-filled from map" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-gray-100">
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Security</h3>
                  </div>
                  <div className="p-8">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" placeholder="Leave unchanged to keep current password" />
                    <p className="text-xs text-gray-400 mt-2">Leave blank to keep your current password.</p>
                  </div>
                </div>

                <button type="submit" className="px-10 py-4 bg-[#7C3AED] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all">
                  Save Profile Updates
                </button>
              </div>

              {/* Right: sticky map */}
              <div className="w-96 sticky top-8">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6" style={{ minHeight: 460 }}>
                  <LocationPicker
                    coordinates={coordinates}
                    locationName={form.location}
                    onLocationChange={({ lat, lng, locationName }) => {
                      setCoordinates({ lat, lng });
                      if (locationName) setForm(f => ({ ...f, location: locationName }));
                      const token = localStorage.getItem('token');
                      axios.put('http://localhost:3000/api/auth/profile',
                        { coordinates: { lat, lng }, ...(locationName && { location: locationName }) },
                        { headers: { Authorization: `Bearer ${token}` } }
                      ).then(res => dispatch(updateUser(res.data))).catch(() => {});
                    }}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        renderContent()
      )}
    </DashboardLayout>
  );
}