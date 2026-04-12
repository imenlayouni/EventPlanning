import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats, updateProfile } from "../../store/profileSlice";
import axios from 'axios';
import { updateUser } from "../../store/authSlice";
import { fetchMyListings, createListing, deleteListing } from "../../store/listingSlice";
import { logout } from "../../store/authSlice";
import { fetchProviderRequests, updateRequestStatus as updateServiceRequestStatus, signContract } from "../../store/requestSlice";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard, CalendarCheck, User, CheckCircle, XCircle,
    ClipboardList, Plus, Trash, List, LogOut
} from 'lucide-react';
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatsCard from "../../components/ui/StatsCard";
import StatusBadge from "../../components/ui/StatusBadge";

export default function OrganizerDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { stats } = useSelector((state) => state.profile);
    const { user } = useSelector((state) => state.auth);
    const { myListings } = useSelector((state) => state.listings);
    const { providerRequests = [] } = useSelector((state) => state.serviceRequests);

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    const [activeTab, setActiveTab] = useState("overview");
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [profileForm, setProfileForm] = useState({
        category: "", description: "", phone: "",
        priceRange: { min: 0, max: 0 }, availability: "", location: ""
    });

    const PASSWORD_PLACEHOLDER = "********";
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(PASSWORD_PLACEHOLDER);

    const [showListingModal, setShowListingModal] = useState(false);
    const [listingForm, setListingForm] = useState({
        title: "", description: "", category: "", location: "", price: ""
    });
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Dynamic form builder state
    const [fields, setFields] = useState([]);

    const addField = () => {
        setFields(prev => [...prev, { label: '', type: 'text', options: [], required: false }]);
    };

    const removeField = (index) => {
        setFields(prev => prev.filter((_, i) => i !== index));
    };

    const updateField = (index, key, value) => {
        setFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
    };

    const addOption = (index) => {
        setFields(prev => prev.map((f, i) => i === index ? { ...f, options: [...f.options, ''] } : f));
    };

    const updateOption = (fieldIndex, optionIndex, value) => {
        setFields(prev => prev.map((f, i) => {
            if (i !== fieldIndex) return f;
            const newOptions = [...f.options];
            newOptions[optionIndex] = value;
            return { ...f, options: newOptions };
        }));
    };

    const [responseNote, setResponseNote] = useState("");
    const [negotiatedPrice, setNegotiatedPrice] = useState("");
    const [respondingTo, setRespondingTo] = useState(null);

    const today = new Date();
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [unavailable, setUnavailable] = useState(user?.unavailableDates || []);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?._id || user?.id) {
            const userId = user._id || user.id;
            dispatch(fetchDashboardStats());
            dispatch(fetchMyListings(userId));
            dispatch(fetchProviderRequests());
        }
    }, [dispatch, user?._id, user?.id]);

    useEffect(() => {
        if (user) {
            setName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
            setPassword(PASSWORD_PLACEHOLDER);
            setUnavailable(prev => prev.length === 0 ? (user.unavailableDates || []) : prev);
            if (user.serviceProfile) {
                setProfileForm({
                    category: user.serviceProfile.category || "",
                    description: user.serviceProfile.description || "",
                    phone: user.serviceProfile.phone || "",
                    priceRange: user.serviceProfile.priceRange || { min: 0, max: 0 },
                    availability: user.serviceProfile.availability?.join(", ") || "",
                    location: user.location || ""
                });
            } else {
                setProfileForm({ category: "", description: "", phone: "", priceRange: { min: 0, max: 0 }, availability: "", location: "" });
            }
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const availabilityArray = profileForm.availability.split(",").map(s => s.trim());
        try {
            await dispatch(updateProfile({ ...profileForm, availability: availabilityArray }));
            const token = localStorage.getItem('token');
            const body = { firstName: name, lastName, email };
            if (password && password !== PASSWORD_PLACEHOLDER) body.password = password;
            const res = await axios.put('http://localhost:3000/api/auth/profile', body, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateUser({ firstName: res.data.firstName, lastName: res.data.lastName, email: res.data.email }));
            setSuccessMsg("Profile Updated!");
        } catch (err) {
            console.error(err);
            setSuccessMsg("Failed to update profile");
        }
    };

    const handleFileChange = (e) => setSelectedFiles(e.target.files);

    const handleListingCreate = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", listingForm.title);
        formData.append("description", listingForm.description);
        formData.append("category", listingForm.category);
        formData.append("location", listingForm.location);
        formData.append("price", listingForm.price);
        formData.append("fields", JSON.stringify(fields));
        if (selectedFiles) {
            for (let i = 0; i < selectedFiles.length; i++) {
                formData.append("images", selectedFiles[i]);
            }
        }
        dispatch(createListing(formData));
        setShowListingModal(false);
        setListingForm({ title: "", description: "", category: "", location: "", price: ""});
        setSelectedFiles([]);
        setFields([]);
        setSuccessMsg("Listing Created!");
    };

    const handleDeleteListing = (id) => {
        if (window.confirm("Are you sure?")) {
            dispatch(deleteListing(id)).then((result) => {
                if (result.type === deleteListing.fulfilled.type) {
                    setSuccessMsg("Listing deleted successfully!");
                    setTimeout(() => setSuccessMsg(""), 3000);
                } else if (result.type === deleteListing.rejected.type) {
                    setErrorMsg(result.payload || "Failed to delete listing");
                    setTimeout(() => setErrorMsg(""), 3000);
                }
            });
        }
    };

    const handleServiceRequestAction = (id, status) => {
        dispatch(updateServiceRequestStatus({
            id, status,
            providerNote: respondingTo === id ? responseNote : "",
            finalPrice: (status === "accepted" && respondingTo === id) ? Number(negotiatedPrice) : null
        }));
        setRespondingTo(null);
        setResponseNote("");
        setNegotiatedPrice("");
        setSuccessMsg(status === "accepted" ? "Request Accepted!" : "Request Declined.");
    };

    const toggleDate = (dateStr) => {
        setUnavailable(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
    };

    const handleSaveAvailability = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:3000/api/auth/unavailable-dates', { unavailableDates: unavailable }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateUser({ unavailableDates: unavailable }));
            setSuccessMsg("Availability saved!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setErrorMsg("Failed to save availability");
            setTimeout(() => setErrorMsg(""), 3000);
        }
        setSaving(false);
    };

    const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
    const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

    const typeLabels = {
        price_change: "💰 Price Change", add_item: "➕ Add Item",
        remove_item: "➖ Remove Item", custom: "✏️ Custom Request"
    };

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    const renderOverview = () => {
        const monthNamesShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <h2 className="text-3xl font-black text-white/90">Dashboard Overview</h2>
                <div className="bg-[#141428] p-6 rounded-3xl border border-gray-800 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] font-black text-2xl">{user?.firstName?.[0]}</div>
                    <div>
                        <h3 className="text-xl font-black">Welcome back, {user?.firstName}!</h3>
                        <p className="text-gray-400 text-sm">Here's your business overview</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Earnings", value: `$${(stats?.totalEarnings || 0).toLocaleString()}`, color: "text-emerald-400", border: "hover:border-emerald-500/50", icon: "💰" },
                        { label: "Pending Requests", value: stats?.pendingRequests ?? 0, color: "text-yellow-400", border: "hover:border-yellow-500/50", icon: "📩" },
                        { label: "Accepted", value: stats?.acceptedRequests ?? 0, color: "text-[#7C3AED]", border: "hover:border-[#7C3AED]/50", icon: "✅" },
                        { label: "Published Listings", value: stats?.totalListings ?? 0, color: "text-blue-400", border: "hover:border-blue-500/50", icon: "📋" },
                        { label: "Avg Rating", value: stats?.rating ? stats.rating.toFixed(1) + " ⭐" : "N/A", color: "text-yellow-300", border: "hover:border-yellow-300/50", icon: "⭐" },
                        { label: "Total Reviews", value: stats?.reviewCount ?? 0, color: "text-pink-400", border: "hover:border-pink-500/50", icon: "💬" },
                        { label: "Declined", value: stats?.declinedRequests ?? 0, color: "text-red-400", border: "hover:border-red-500/50", icon: "❌" },
                    ].map((item, i) => (
                        <StatsCard key={i} icon={item.icon} label={item.label} value={item.value} color={item.color} borderColor={item.border} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#141428] p-6 rounded-3xl border border-gray-800">
                        <h3 className="font-black text-lg mb-4">📈 Requests Over Time</h3>
                        {stats?.requestsPerMonth?.length > 0 ? (
                            <div className="flex items-end gap-2 h-32">
                                {stats.requestsPerMonth.map((m, i) => {
                                    const max = Math.max(...stats.requestsPerMonth.map(x => x.count));
                                    const height = max > 0 ? (m.count / max) * 100 : 0;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-xs text-gray-400">{m.count}</span>
                                            <div className="w-full bg-[#7C3AED] rounded-t-lg transition-all" style={{ height: `${height}%`, minHeight: '4px' }} />
                                            <span className="text-[10px] text-gray-500">{monthNamesShort[m._id.month - 1]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <p className="text-gray-500 text-sm italic">No request data yet.</p>}
                    </div>
                    <div className="bg-[#141428] p-6 rounded-3xl border border-gray-800">
                        <h3 className="font-black text-lg mb-4">📄 Request Status Overview</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Pending", value: stats?.pendingRequests ?? 0, color: "bg-yellow-400" },
                                { label: "Accepted", value: stats?.acceptedRequests ?? 0, color: "bg-emerald-400" },
                                { label: "Declined", value: stats?.declinedRequests ?? 0, color: "bg-red-400" },
                            ].map((item, i) => {
                                const total = (stats?.pendingRequests ?? 0) + (stats?.acceptedRequests ?? 0) + (stats?.declinedRequests ?? 0);
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400 font-bold">{item.label}</span>
                                            <span className="text-white font-black">{item.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-2">
                                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div onClick={() => setActiveTab('listings')} className="bg-[#141428] p-5 rounded-2xl border border-gray-800 cursor-pointer hover:border-[#7C3AED]/50 transition-all text-center group">
                        <div className="text-3xl mb-2">📋</div>
                        <div className="font-black group-hover:text-[#A78BFA] transition-colors">Listings</div>
                    </div>
                    <div onClick={() => setActiveTab('service-requests')} className="bg-[#141428] p-5 rounded-2xl border border-gray-800 cursor-pointer hover:border-yellow-500/50 transition-all text-center group">
                        <div className="text-3xl mb-2">📩</div>
                        <div className="font-black group-hover:text-yellow-400 transition-colors">Requests</div>
                    </div>
                    <div onClick={() => setActiveTab('availability')} className="bg-[#141428] p-5 rounded-2xl border border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all text-center group">
                        <div className="text-3xl mb-2">📅</div>
                        <div className="font-black group-hover:text-emerald-400 transition-colors">Availability</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderListings = () => (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-white/90">My Published Services</h2>
                <button onClick={() => { setShowListingModal(true); setFields([]); }} className="flex items-center gap-2 bg-[#7C3AED] text-white px-8 py-4 rounded-2xl hover:bg-[#6D28D9] transition-all shadow-lg shadow-[#7C3AED]/20 font-black uppercase tracking-widest text-sm">
                    <Plus size={18} /> Add New Listing
                </button>
            </div>

            {showListingModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#141428] rounded-3xl p-8 w-full max-w-xl border border-gray-800 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-2xl font-black mb-6 text-white">Create New Service</h3>
                        <form onSubmit={handleListingCreate} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Title" required className="w-full bg-[#1f1f35] border-0 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[#7C3AED]" value={listingForm.title} onChange={e => setListingForm({ ...listingForm, title: e.target.value })} />
                                <input type="text" placeholder="Category" required className="w-full bg-[#1f1f35] border-0 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[#7C3AED]" value={listingForm.category} onChange={e => setListingForm({ ...listingForm, category: e.target.value })} />
                            </div>
                            <textarea placeholder="Service Description" required className="w-full bg-[#1f1f35] border-0 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[#7C3AED] min-h-[100px]" value={listingForm.description} onChange={e => setListingForm({ ...listingForm, description: e.target.value })} />
                            <div className="grid md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Location" required className="w-full bg-[#1f1f35] border-0 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[#7C3AED]" value={listingForm.location} onChange={e => setListingForm({ ...listingForm, location: e.target.value })} />
                                <input type="text" placeholder="Price (e.g. 500 TND)" required className="w-full bg-[#1f1f35] border-0 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[#7C3AED]" value={listingForm.price} onChange={e => setListingForm({ ...listingForm, price: e.target.value })} />
                            </div>
                            <div className="bg-[#1f1f35] p-6 rounded-2xl border-2 border-dashed border-gray-700">
                                <label className="block text-sm font-black text-[#A78BFA] uppercase tracking-widest mb-3 text-center">Upload Service Photos</label>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED]/20 file:text-[#A78BFA] hover:file:bg-[#7C3AED]/30" />
                            </div>

                            {/* DYNAMIC FORM BUILDER */}
                            <div className="border-t border-gray-800 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-widest text-gray-400">Custom Request Form</h4>
                                        <p className="text-xs text-gray-600 mt-1">Add fields participants must fill when requesting this service</p>
                                    </div>
                                    <button type="button" onClick={addField} className="bg-[#7C3AED]/20 text-[#A78BFA] px-3 py-1 rounded-xl text-xs font-bold hover:bg-[#7C3AED]/40 transition">+ Add Field</button>
                                </div>
                                {fields.length === 0 && <p className="text-gray-600 text-xs italic text-center py-3">No custom fields yet.</p>}
                                {fields.map((field, index) => (
                                    <div key={index} className="bg-[#0b0b16] p-4 rounded-xl border border-gray-700 mb-3">
                                        <div className="flex gap-2 mb-2">
                                            <input type="text" placeholder="Field label (e.g. Flower color)" value={field.label} onChange={e => updateField(index, 'label', e.target.value)} className="flex-1 bg-[#1f1f35] text-white text-sm p-2 rounded-lg border border-gray-700 focus:ring-1 focus:ring-[#7C3AED]" />
                                            <select value={field.type} onChange={e => updateField(index, 'type', e.target.value)} className="bg-[#1f1f35] text-white text-sm p-2 rounded-lg border border-gray-700">
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="dropdown">Dropdown</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="multi-select">Multi-select</option>
                                            </select>
                                            <button type="button" onClick={() => removeField(index)} className="text-red-400 hover:text-red-300 px-2 text-lg">✕</button>
                                        </div>
                                        <label className="flex items-center gap-2 text-xs text-gray-400 mb-2 cursor-pointer">
                                            <input type="checkbox" checked={field.required} onChange={e => updateField(index, 'required', e.target.checked)} />
                                            Required field
                                        </label>
                                        {field.type === 'dropdown' && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Options:</p>
                                                {field.options.map((opt, optIndex) => (
                                                    <input key={optIndex} type="text" placeholder={`Option ${optIndex + 1}`} value={opt} onChange={e => updateOption(index, optIndex, e.target.value)} className="w-full bg-[#1f1f35] text-white text-xs p-2 rounded-lg border border-gray-700 mb-1 focus:ring-1 focus:ring-[#7C3AED]" />
                                                ))}
                                                <button type="button" onClick={() => addOption(index)} className="text-[#A78BFA] text-xs hover:underline">+ Add option</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => { setShowListingModal(false); setFields([]); }} className="px-6 py-3 text-gray-400 hover:text-white transition font-bold">Cancel</button>
                                <button type="submit" className="px-10 py-3 bg-[#7C3AED] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20">Publish Service</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                {myListings.map(listing => (
                    <div key={listing._id} className="bg-[#141428] p-8 rounded-3xl border border-gray-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-[#7C3AED]/50 transition-all">
                        <div className="flex items-center gap-6">
                            {listing.images?.[0] ? (
                                <img src={listing.images[0]} alt="" className="w-24 h-24 rounded-2xl object-cover border border-gray-800" />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-[#1f1f35] border border-gray-800 flex items-center justify-center text-gray-600"><List /></div>
                            )}
                            <div>
                                <h3 className="font-black text-2xl group-hover:text-[#A78BFA] transition-colors">{listing.title}</h3>
                                <p className="text-gray-500 mb-2 truncate max-w-md">{listing.description}</p>
                                <div className="flex gap-2 flex-wrap">
                                    <span className="text-[10px] bg-[#7C3AED]/10 px-3 py-1 rounded-full text-[#A78BFA] font-black uppercase tracking-widest border border-[#7C3AED]/20">{listing.category}</span>
                                    <span className="text-[10px] bg-gray-800/50 px-3 py-1 rounded-full text-gray-400 font-black uppercase tracking-widest">{listing.location}</span>
                                    {listing.fields?.length > 0 && (
                                        <span className="text-[10px] bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-400 font-black uppercase tracking-widest border border-emerald-500/20">{listing.fields.length} form fields</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 border-gray-800 pt-6 md:pt-0">
                            <p className="text-2xl font-black text-white">{listing.price}</p>
                        <button onClick={() => navigate(`/listing/${listing._id}`)}
                            className="p-4 bg-[#7C3AED]/10 text-[#7C3AED] rounded-2xl hover:bg-[#7C3AED] hover:text-white transition-all"
                        >View
                        </button>
                            <button onClick={() => handleDeleteListing(listing._id)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                <Trash size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderServiceRequests = () => (
        <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-white/90 mb-8 flex items-center gap-3"><ClipboardList className="text-[#7C3AED]" /> Service Requests</h2>
            {providerRequests.length === 0 ? (
                <div className="py-32 bg-[#141428] rounded-[2.5rem] border border-gray-800 border-dashed text-center flex flex-col items-center gap-6">
                    <ClipboardList size={64} className="text-gray-800" />
                    <p className="text-xl font-bold text-gray-400 italic">No incoming requests yet.</p>
                </div>
            ) : (
                <div className="grid gap-5">
                    {providerRequests.map((req) => {
                        const isPending = req.status === "pending";
                        return (
                            <div key={req._id} className="bg-[#141428] p-6 rounded-[2rem] border border-gray-800 hover:border-[#7C3AED]/30 transition-all">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA] font-black text-lg shrink-0">{req.user?.firstName?.[0] || "?"}</div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black">{req.user?.firstName} {req.user?.lastName}</h3>
                                            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">{typeLabels[req.requestType] || req.requestType} • {req.listing?.title || "Service"}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </div>

                                <div className="bg-[#1f1f35] p-4 rounded-xl border border-gray-800 mb-4">
                                    <p className="text-gray-300">{req.description}</p>
                                    {req.suggestedPrice && <p className="text-[#7C3AED] font-bold text-sm mt-2">Suggested price: ${req.suggestedPrice}</p>}
                                </div>

                                {/* Form answers */}
                                {req.formAnswers && req.formAnswers.length > 0 && (
                                    <div className="bg-[#0b0b16] p-4 rounded-xl border border-gray-800 mb-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Service Details</p>
                                        {req.formAnswers.map((ans, i) => (
                                            <div key={i} className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">{ans.label}</span>
                                                <span className="text-white font-bold">{ans.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-700 font-black uppercase tracking-widest mb-4">
                                    Received • {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>

                                {isPending && (
                                    <div className="space-y-3">
                                        {respondingTo === req._id && (
                                            <div className="space-y-3">
                                                <input type="text" value={responseNote} onChange={e => setResponseNote(e.target.value)} placeholder="Add a note (optional)..." className="w-full bg-[#0b0b16] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-[#7C3AED]" />
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500 font-bold">$</span>
                                                    <input type="number" value={negotiatedPrice} onChange={e => setNegotiatedPrice(e.target.value)} placeholder="Total price..." className="flex-1 bg-[#0b0b16] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-[#7C3AED]" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            {respondingTo !== req._id ? (
                                                <button onClick={() => setRespondingTo(req._id)} className="flex-1 bg-[#1f1f35] border border-gray-700 text-gray-300 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition">Respond</button>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleServiceRequestAction(req._id, "accepted")} className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"><CheckCircle size={16} /> Accept</button>
                                                    <button onClick={() => handleServiceRequestAction(req._id, "declined")} className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><XCircle size={16} /> Decline</button>
                                                    <button onClick={() => { setRespondingTo(null); setResponseNote(""); }} className="px-4 py-3 bg-[#1f1f35] border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition">Cancel</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {req.providerNote && req.status !== "pending" && (
                                    <div className="mt-3 p-3 bg-[#0b0b16] rounded-xl border border-gray-800">
                                        <p className="text-xs text-gray-600 font-black uppercase tracking-widest mb-1">Your Response</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-gray-400 text-sm italic">"{req.providerNote}"</p>
                                            {req.finalPrice && <span className="text-[#A78BFA] font-black text-sm">Agreed Price: ${req.finalPrice}</span>}
                                        </div>
                                    </div>
                                )}

                                {req.status === 'accepted' && req.contract && (
                                    <div className="mt-4 bg-[#0b0b16] rounded-2xl border border-gray-800 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-black text-sm uppercase tracking-widest text-[#A78BFA]">📄 Service Contract</h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${req.contract.status === 'FULLY_SIGNED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                                {req.contract.status === 'FULLY_SIGNED' ? '✅ Fully Signed' : req.contract.providerSigned ? '⏳ Waiting for Client' : req.contract.clientSigned ? '✍️ Client Signed — Your Turn' : '⏳ Waiting for Client to Sign First'}
                                            </span>
                                        </div>
                                        <div className="bg-[#141428] rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
                                            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">{req.contract.terms}</pre>
                                        </div>
                                        <div className="flex gap-4 mb-4">
                                            <div className={`flex items-center gap-2 text-xs font-bold ${req.contract.clientSigned ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                {req.contract.clientSigned ? '✅' : '⬜'} Client
                                                {req.contract.clientSignedAt && <span className="text-gray-600 font-normal">({new Date(req.contract.clientSignedAt).toLocaleDateString()})</span>}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs font-bold ${req.contract.providerSigned ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                {req.contract.providerSigned ? '✅' : '⬜'} You
                                                {req.contract.providerSignedAt && <span className="text-gray-600 font-normal">({new Date(req.contract.providerSignedAt).toLocaleDateString()})</span>}
                                            </div>
                                        </div>
                                        {req.contract.clientSigned && !req.contract.providerSigned && (
                                            <button onClick={() => dispatch(signContract(req.contract._id))} className="w-full bg-[#7C3AED] text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all">✍️ Sign Contract</button>
                                        )}
                                        {!req.contract.clientSigned && <div className="text-center text-yellow-400 font-bold text-xs py-2">Waiting for client to sign first...</div>}
                                        {req.contract.status === 'FULLY_SIGNED' && <div className="text-center text-emerald-400 font-black text-sm py-2">🎉 Contract fully signed! Service is confirmed.</div>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderProfile = () => (
        <div className="max-w-3xl animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-white/90 mb-8">Edit Profile</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-6 bg-[#141428] p-10 rounded-3xl border border-gray-800 shadow-xl">
                <div className="grid md:grid-cols-2 gap-6">
                    <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">First Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" /></div>
                    <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Last Name</label><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" /></div>
                    <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" /></div>
                    <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Phone Number</label><input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" placeholder="+216 XX XXX XXX" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" placeholder="Leave unchanged to keep current password" /></div>
                </div>
                <hr className="border-gray-800" />
                <div className="grid md:grid-cols-2 gap-6">
                    <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Location</label><input type="text" value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none" /></div>
                </div>
                <button type="submit" className="w-full bg-[#7C3AED] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all">Save Profile Updates</button>
            </form>
        </div>
    );

    const renderAvailability = () => {
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        return (
            <div className="max-w-3xl animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white/90">Availability Calendar</h2>
                        <p className="text-gray-500 text-sm mt-1">Click days to mark them as <span className="text-red-400 font-bold">unavailable</span>.</p>
                    </div>
                    <button onClick={handleSaveAvailability} disabled={saving} className="bg-[#7C3AED] px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#6D28D9] transition-all disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                </div>
                <div className="bg-[#141428] rounded-3xl border border-gray-800 p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={prevMonth} className="p-3 rounded-xl bg-[#1f1f35] hover:bg-[#7C3AED]/20 transition-all text-gray-400 hover:text-white text-xl font-bold">‹</button>
                        <h3 className="text-xl font-black">{monthNames[calMonth]} {calYear}</h3>
                        <button onClick={nextMonth} className="p-3 rounded-xl bg-[#1f1f35] hover:bg-[#7C3AED]/20 transition-all text-gray-400 hover:text-white text-xl font-bold">›</button>
                    </div>
                    <div className="grid grid-cols-7 mb-3">
                        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center text-xs font-black text-gray-600 uppercase tracking-widest py-2">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isUnavailable = unavailable.includes(dateStr);
                            const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                            const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            return (
                                <button key={dateStr} type="button" disabled={isPast} onClick={() => toggleDate(dateStr)}
                                    className={`aspect-square rounded-xl text-sm font-bold transition-all ${isPast ? "text-gray-700 cursor-not-allowed" : isUnavailable ? "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30" : isToday ? "bg-[#7C3AED]/30 border border-[#7C3AED] text-white" : "bg-[#1f1f35] hover:bg-[#7C3AED]/20 hover:text-white text-gray-300 border border-transparent hover:border-[#7C3AED]/30"}`}>
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-6 mt-8 pt-6 border-t border-gray-800">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#1f1f35] border border-gray-700" /><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Available</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50" /><span className="text-xs text-red-400 font-bold uppercase tracking-widest">Unavailable</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#7C3AED]/30 border border-[#7C3AED]" /><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Today</span></div>
                    </div>
                </div>
                {unavailable.length > 0 && (
                    <div className="mt-6 bg-[#141428] rounded-2xl border border-gray-800 p-6">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Marked Unavailable ({unavailable.length} days)</p>
                        <div className="flex flex-wrap gap-2">
                            {[...unavailable].sort().map(d => (
                                <span key={d} onClick={() => toggleDate(d)} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-all">{d} ✕</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const tabs = [
        { id: 'overview',          icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'service-requests',  icon: ClipboardList,   label: 'Requests', badge: providerRequests.filter(r => r.status === 'pending').length },
        { id: 'listings',          icon: List,            label: 'Listings' },
        { id: 'availability',      icon: CalendarCheck,   label: 'Availability' },
        { id: 'profile',           icon: User,            label: 'Edit Profile' },
    ];

    return (
        <DashboardLayout
            subtitle="Provider Dashboard"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
        >
            {successMsg && (
                <div className="mb-10 px-8 py-5 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                    <CheckCircle size={24} /> <span className="font-bold uppercase tracking-widest text-sm">{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="mb-10 px-8 py-5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                    <XCircle size={24} /> <span className="font-bold uppercase tracking-widest text-sm">{errorMsg}</span>
                </div>
            )}
            {activeTab === "overview"         && renderOverview()}
            {activeTab === "listings"         && renderListings()}
            {activeTab === "service-requests" && renderServiceRequests()}
            {activeTab === "availability"     && renderAvailability()}
            {activeTab === "profile"          && renderProfile()}
        </DashboardLayout>
    );
}