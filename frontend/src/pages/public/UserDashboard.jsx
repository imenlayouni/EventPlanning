import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, User, ClipboardList, Trash2, CreditCard } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "../../store/authSlice";
import { fetchMyEvents, removeServiceFromEventAction } from "../../store/eventsSlice";
import axios from "axios";
import { fetchMyRequests, signContract } from "../../store/requestSlice";
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

  const PASSWORD_PLACEHOLDER = "********";
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', location: '', phone: '', password: PASSWORD_PLACEHOLDER, assets: '' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', location: user.location || '', phone: user.phone || '', assets: user.assets || '', password: PASSWORD_PLACEHOLDER });
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
      const body = { ...form };
      if (!body.password || body.password === PASSWORD_PLACEHOLDER) delete body.password;
      const res = await axios.put('http://localhost:3000/api/auth/profile', body, { headers: { Authorization: `Bearer ${token}` } });
      dispatch(updateUser({ firstName: res.data.firstName, lastName: res.data.lastName, email: res.data.email, location: res.data.location }));
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
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
        console.error('Checkout failed:', err);
        alert('Checkout failed. Please try again.');
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
                    { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: "💰", color: "text-emerald-400", border: "hover:border-emerald-500/50" },
                    { label: "Pending Requests", value: pendingRequests, icon: "⏳", color: "text-yellow-400", border: "hover:border-yellow-500/50" },
                    { label: "Accepted Requests", value: acceptedRequests, icon: "✅", color: "text-green-400", border: "hover:border-green-500/50" },
                    { label: "Contracts Signed", value: contractsSigned, icon: "📄", color: "text-pink-400", border: "hover:border-pink-500/50" },
                ].map((item, i) => (
                    <StatsCard key={i} icon={item.icon} label={item.label} value={item.value} color={item.color} borderColor={item.border} />
                ))}
            </div>

            {/* Request status bars */}
            <div className="bg-[#141428] p-6 rounded-3xl border border-gray-800">
                <h3 className="font-black text-lg mb-4">📊 Request Status Overview</h3>
                {myRequests.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No requests yet.</p>
                ) : (
                    <div className="space-y-3">
                        {[
                            { label: "Pending", value: pendingRequests, color: "bg-yellow-400" },
                            { label: "Accepted", value: acceptedRequests, color: "bg-emerald-400" },
                            { label: "Declined", value: myRequests.filter(r => r.status === 'declined').length, color: "bg-red-400" },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400 font-bold">{item.label}</span>
                                    <span className="text-white font-black">{item.value}</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
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
                <div onClick={() => setActiveTab('events')} className="bg-[#141428] p-5 rounded-2xl border border-gray-800 cursor-pointer hover:border-[#7C3AED]/50 transition-all text-center group">
                    <div className="text-3xl mb-2">🎉</div>
                    <div className="font-black group-hover:text-[#A78BFA] transition-colors">My Events</div>
                    <div className="text-xs text-gray-500 mt-1">{totalEvents} events</div>
                </div>
                <div onClick={() => setActiveTab('requests')} className="bg-[#141428] p-5 rounded-2xl border border-gray-800 cursor-pointer hover:border-yellow-500/50 transition-all text-center group">
                    <div className="text-3xl mb-2">📩</div>
                    <div className="font-black group-hover:text-yellow-400 transition-colors">My Requests</div>
                    <div className="text-xs text-gray-500 mt-1">{myRequests.length} total</div>
                </div>
                <div onClick={() => navigate('/feed')} className="bg-[#141428] p-5 rounded-2xl border border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all text-center group">
                    <div className="text-3xl mb-2">🔍</div>
                    <div className="font-black group-hover:text-emerald-400 transition-colors">Browse Services</div>
                    <div className="text-xs text-gray-500 mt-1">Find providers</div>
                </div>
            </div>
        </div>
    );
      case 'events':
        return (
          <div>
            <h2 className="text-3xl font-black mb-4">My Events</h2>
            {myEvents.length === 0 ? (
              <div className="bg-[#141428] rounded-3xl p-8 text-center border border-gray-800">
                <p className="text-gray-400">No events yet. Add services from the feed to start planning.</p>
              </div>
            ) : (
              <div className="grid gap-8">
                {myEvents.map((event) => {
                  const total = (event.services || []).reduce((acc, s) => acc + parseFloat(String(s.price || "0").replace(/[^0-9.]/g, '') || 0), 0);
                  return (
                    <div key={event._id} className="bg-[#141428] rounded-2xl border border-gray-800 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-xl font-black">{event.name}</h3>
                          <p className="text-sm text-gray-400">{(event.services || []).length} services</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-xl font-black text-[#7C3AED]">${total.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {(event.services || []).map(s => {
                          const relatedRequest = myRequests.find(r => r.listing?._id === s._id && r.status === 'accepted');
                          const isConfirmed = relatedRequest?.contract?.status === 'FULLY_SIGNED';
                          return (
                            <div key={s._id} className={`bg-[#0b0f1a] p-3 rounded-xl relative border ${isConfirmed ? 'border-emerald-500/30' : 'border-transparent'}`}>
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
                                  <div className="font-bold">{s.title}</div>
                                  <div className="text-xs text-gray-400">{s.organizer?.firstName} • {s.category}</div>
                                  {isConfirmed && <div className="text-xs text-emerald-400 font-bold mt-1">✅ Contract Signed — Ready for Checkout</div>}
                                  {!isConfirmed && relatedRequest?.status === 'accepted' && <div className="text-xs text-yellow-400 font-bold mt-1">⏳ Awaiting Contract Signature</div>}
                                  {!relatedRequest && <div className="text-xs text-gray-500 mt-1">No confirmed request yet</div>}
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div className="font-black">{s.price}</div>
                                  <button onClick={(e) => { e.stopPropagation(); handleRemoveService(event._id, s._id); }} className="text-gray-400 hover:text-red-500 p-2">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {event.services && event.services.length > 0 && (
                        <div className="bg-[#1a1a2e] p-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 mt-4">
                          <div className="text-center md:text-left">
                            <p className="text-gray-400 text-sm mb-1">
                              {(selectedServices[event._id] || []).length === 0 ? "Select confirmed services to proceed with checkout" : `${(selectedServices[event._id] || []).length} items selected for payment`}
                            </p>
                            <p className="text-3xl font-black">Total Payable: <span className="text-[#10B981]">${calculateSelectedTotal(event._id, event.services).toLocaleString()}</span></p>
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
                            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
                              (selectedServices[event._id] || []).length > 0 &&
                              !(selectedServices[event._id] || []).some(sid => {
                                const req = myRequests.find(r => r.listing?._id === sid && r.status === 'accepted');
                                return req?.contract?.status !== 'FULLY_SIGNED';
                              })
                                ? "bg-[#10B981] hover:bg-[#059669] text-white"
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
            )}
          </div>
        );

      case 'requests':
        return (
          <div>
            <h2 className="text-3xl font-black mb-4">My Requests</h2>
            {(!myRequests || myRequests.length === 0) ? (
              <div className="bg-[#141428] rounded-3xl p-8 text-center border border-gray-800">
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
                    <div key={req._id} className="bg-[#141428] p-6 rounded-2xl border border-gray-800">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-lg">{req.listing?.title || 'Service'}</h3>
                          <p className="text-xs text-gray-400">To: {req.provider?.firstName} {req.provider?.lastName} • {req.requestType}</p>
                          <p className="mt-2 text-gray-300">{req.description}</p>
                          {req.finalPrice && <p className="text-[#7C3AED] font-bold text-sm mt-1">Agreed Price: ${req.finalPrice}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                          <StatusBadge status={st} />
                        </div>
                      </div>
                      {st === 'accepted' && contract && (
                        <div className="mt-4 bg-[#0b0b16] rounded-2xl border border-gray-800 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-sm uppercase tracking-widest text-[#A78BFA]">📄 Service Contract</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${fullySigned ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                              {fullySigned ? '✅ Fully Signed' : userSigned ? '⏳ Waiting for Provider' : '✍️ Needs Your Signature'}
                            </span>
                          </div>
                          <div className="bg-[#141428] rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">{contract.terms}</pre>
                          </div>
                          <div className="flex gap-4 mb-4">
                            <div className={`flex items-center gap-2 text-xs font-bold ${contract.clientSigned ? 'text-emerald-400' : 'text-gray-500'}`}>
                              {contract.clientSigned ? '✅' : '⬜'} You
                              {contract.clientSignedAt && <span className="text-gray-600 font-normal">({new Date(contract.clientSignedAt).toLocaleDateString()})</span>}
                            </div>
                            <div className={`flex items-center gap-2 text-xs font-bold ${contract.providerSigned ? 'text-emerald-400' : 'text-gray-500'}`}>
                              {contract.providerSigned ? '✅' : '⬜'} {req.provider?.firstName}
                              {contract.providerSignedAt && <span className="text-gray-600 font-normal">({new Date(contract.providerSignedAt).toLocaleDateString()})</span>}
                            </div>
                          </div>
                          {!userSigned && (
                            <button
                              onClick={() => dispatch(signContract(contract._id))}
                              className="w-full bg-[#7C3AED] text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all shadow-lg shadow-[#7C3AED]/20"
                            >
                              ✍️ Sign Contract
                            </button>
                          )}
                          {fullySigned && (
                            <div className="text-center text-emerald-400 font-black text-sm">
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
        <div className="max-w-3xl animate-in fade-in duration-500">
          <h2 className="text-3xl font-black text-white/90 mb-8">Edit Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-6 bg-[#141428] p-10 rounded-3xl border border-gray-800 shadow-xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">First Name</label>
                <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Last Name</label>
                <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" placeholder="+216 XX XXX XXX" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Location</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" placeholder="Leave unchanged to keep current password" />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#7C3AED] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all">
              Save Profile Updates
            </button>
          </form>
        </div>
      ) : (
        renderContent()
      )}
    </DashboardLayout>
  );
}