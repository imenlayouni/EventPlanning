import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import LocationPicker from "../../components/LocationPicker";
import { fetchDashboardStats, updateProfile } from "../../store/profileSlice";
import axios from 'axios';
import { updateUser } from "../../store/authSlice";
import { fetchMyListings, createListing, deleteListing } from "../../store/listingSlice";
import { logout } from "../../store/authSlice";
import { fetchProviderRequests, updateRequestStatus as updateServiceRequestStatus, signContract, sendProviderResponse, sendRequestMessage } from "../../store/requestSlice";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard, CalendarCheck, User, CheckCircle, XCircle,
    ClipboardList, Plus, Trash, List
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
    const [coordinates, setCoordinates] = useState(null);

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
            if (user.coordinates?.lat) setCoordinates(user.coordinates);
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
            const body = { firstName: name, lastName, email, location: profileForm.location, coordinates };
            if (password && password !== PASSWORD_PLACEHOLDER) body.password = password;
            const res = await axios.put('http://localhost:3000/api/auth/profile', body, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateUser(res.data));
            toast.success("Profile updated!");
        } catch (err) {
            toast.error("Failed to update profile");
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

    const handleSendResponse = (id) => {
        if (!responseNote.trim()) return;
        dispatch(sendRequestMessage({ id, text: responseNote }));
        setRespondingTo(null);
        setResponseNote("");
        toast.success("Message sent to participant.");
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
                <h2 className="text-3xl font-black text-gray-900">Dashboard Overview</h2>
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-black text-2xl">{user?.firstName?.[0]}</div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Welcome back, {user?.firstName}!</h3>
                        <p className="text-gray-500 text-sm">Here's your business overview</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Earnings", value: `${(stats?.totalEarnings || 0).toLocaleString()} TND`, color: "text-emerald-600", border: "hover:border-emerald-500/50", icon: "💰" },
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
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <h3 className="font-black text-lg mb-4 text-gray-900">📈 Requests Over Time</h3>
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
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <h3 className="font-black text-lg mb-4 text-gray-900">📄 Request Status Overview</h3>
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
                                            <span className="text-gray-900 font-black">{item.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div onClick={() => setActiveTab('listings')} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-[#7C3AED]/50 hover:shadow-md transition-all text-center group">
                        <div className="text-3xl mb-2">📋</div>
                        <div className="font-black text-gray-900 group-hover:text-[#7C3AED] transition-colors">Listings</div>
                    </div>
                    <div onClick={() => setActiveTab('service-requests')} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-yellow-500/50 hover:shadow-md transition-all text-center group">
                        <div className="text-3xl mb-2">📩</div>
                        <div className="font-black text-gray-900 group-hover:text-yellow-600 transition-colors">Requests</div>
                    </div>
                    <div onClick={() => setActiveTab('availability')} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all text-center group">
                        <div className="text-3xl mb-2">📅</div>
                        <div className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors">Availability</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderListings = () => (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-900">My Published Services</h2>
                <button onClick={() => { setShowListingModal(true); setFields([]); }} className="flex items-center gap-2 bg-[#7C3AED] text-white px-8 py-4 rounded-2xl hover:bg-[#6D28D9] transition-all shadow-lg shadow-[#7C3AED]/20 font-black uppercase tracking-widest text-sm">
                    <Plus size={18} /> Add New Listing
                </button>
            </div>

            {showListingModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-xl border border-gray-200 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-2xl font-black mb-6 text-gray-900">Create New Service</h3>
                        <form onSubmit={handleListingCreate} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Title" required className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" value={listingForm.title} onChange={e => setListingForm({ ...listingForm, title: e.target.value })} />
                                <input type="text" placeholder="Category" required className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" value={listingForm.category} onChange={e => setListingForm({ ...listingForm, category: e.target.value })} />
                            </div>
                            <textarea placeholder="Service Description" required className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none min-h-[100px]" value={listingForm.description} onChange={e => setListingForm({ ...listingForm, description: e.target.value })} />
                            <div className="grid md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Location" required className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" value={listingForm.location} onChange={e => setListingForm({ ...listingForm, location: e.target.value })} />
                                <input type="text" placeholder="Price (e.g. 500 TND)" required className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none" value={listingForm.price} onChange={e => setListingForm({ ...listingForm, price: e.target.value })} />
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                                <label className="block text-sm font-black text-[#7C3AED] uppercase tracking-widest mb-3 text-center">Upload Service Photos</label>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED]/10 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/20" />
                            </div>

                            {/* DYNAMIC FORM BUILDER */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-widest text-gray-500">Custom Request Form</h4>
                                        <p className="text-xs text-gray-400 mt-1">Add fields participants must fill when requesting this service</p>
                                    </div>
                                    <button type="button" onClick={addField} className="bg-[#7C3AED]/10 text-[#7C3AED] px-3 py-1 rounded-xl text-xs font-bold hover:bg-[#7C3AED]/20 transition">+ Add Field</button>
                                </div>
                                {fields.length === 0 && <p className="text-gray-400 text-xs italic text-center py-3">No custom fields yet.</p>}
                                {fields.map((field, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-3">
                                        <div className="flex gap-2 mb-2">
                                            <input type="text" placeholder="Field label (e.g. Flower color)" value={field.label} onChange={e => updateField(index, 'label', e.target.value)} className="flex-1 bg-white text-gray-900 text-sm p-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-[#7C3AED]" />
                                            <select value={field.type} onChange={e => updateField(index, 'type', e.target.value)} className="bg-white text-gray-900 text-sm p-2 rounded-lg border border-gray-200">
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="dropdown">Dropdown</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="multi-select">Multi-select</option>
                                            </select>
                                            <button type="button" onClick={() => removeField(index)} className="text-red-400 hover:text-red-500 px-2 text-lg">✕</button>
                                        </div>
                                        <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 cursor-pointer">
                                            <input type="checkbox" checked={field.required} onChange={e => updateField(index, 'required', e.target.checked)} />
                                            Required field
                                        </label>
                                        {field.type === 'dropdown' && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Options:</p>
                                                {field.options.map((opt, optIndex) => (
                                                    <input key={optIndex} type="text" placeholder={`Option ${optIndex + 1}`} value={opt} onChange={e => updateOption(index, optIndex, e.target.value)} className="w-full bg-white text-gray-900 text-xs p-2 rounded-lg border border-gray-200 mb-1 focus:ring-1 focus:ring-[#7C3AED]" />
                                                ))}
                                                <button type="button" onClick={() => addOption(index)} className="text-[#7C3AED] text-xs hover:underline">+ Add option</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => { setShowListingModal(false); setFields([]); }} className="px-6 py-3 text-gray-500 hover:text-gray-900 transition font-bold">Cancel</button>
                                <button type="submit" className="px-10 py-3 bg-[#7C3AED] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20">Publish Service</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                {myListings.map(listing => (
                    <div key={listing._id} className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-[#7C3AED]/50 hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                            {listing.images?.[0] ? (
                                <img src={listing.images[0]} alt="" className="w-24 h-24 rounded-2xl object-cover border border-gray-100" />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400"><List /></div>
                            )}
                            <div>
                                <h3 className="font-black text-2xl text-gray-900 group-hover:text-[#7C3AED] transition-colors">{listing.title}</h3>
                                <p className="text-gray-500 mb-2 truncate max-w-md">{listing.description}</p>
                                <div className="flex gap-2 flex-wrap">
                                    <span className="text-[10px] bg-[#7C3AED]/10 px-3 py-1 rounded-full text-[#7C3AED] font-black uppercase tracking-widest border border-[#7C3AED]/20">{listing.category}</span>
                                    <span className="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-black uppercase tracking-widest">{listing.location}</span>
                                    {listing.fields?.length > 0 && (
                                        <span className="text-[10px] bg-emerald-50 px-3 py-1 rounded-full text-emerald-600 font-black uppercase tracking-widest border border-emerald-100">{listing.fields.length} form fields</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-6 md:pt-0">
                            <p className="text-2xl font-black text-gray-900">{listing.price}</p>
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
            <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3"><ClipboardList className="text-[#7C3AED]" /> Service Requests</h2>
            {providerRequests.length === 0 ? (
                <div className="py-32 bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-center flex flex-col items-center gap-6 shadow-sm">
                    <ClipboardList size={64} className="text-gray-300" />
                    <p className="text-xl font-bold text-gray-400 italic">No incoming requests yet.</p>
                </div>
            ) : (
                <div className="grid gap-5">
                    {providerRequests.map((req) => {
                        const isPending = req.status === "pending";
                        return (
                            <div key={req._id} className="bg-white p-6 rounded-[2rem] border border-gray-200 hover:border-[#7C3AED]/30 hover:shadow-md transition-all shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-black text-lg shrink-0">{req.user?.firstName?.[0] || "?"}</div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black text-gray-900">{req.user?.firstName} {req.user?.lastName}</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{typeLabels[req.requestType] || req.requestType} • {req.listing?.title || "Service"}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                                    <p className="text-gray-700">{req.description}</p>
                                    {req.suggestedPrice && <p className="text-[#7C3AED] font-bold text-sm mt-2">Suggested price: {req.suggestedPrice} TND</p>}
                                </div>

                                {/* Form answers */}
                                {req.formAnswers && req.formAnswers.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Service Details</p>
                                        {req.formAnswers.map((ans, i) => (
                                            <div key={i} className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500">{ans.label}</span>
                                                <span className="text-gray-900 font-bold">{ans.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">
                                    Received • {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>

                                {req.messages && req.messages.length > 0 && (
                                    <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-200">Conversation</p>
                                        <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
                                            {req.messages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.senderRole === "provider" ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderRole === "provider" ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "bg-gray-100 text-gray-700"}`}>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                                                            {msg.senderRole === "provider" ? "You" : req.user?.firstName}
                                                        </p>
                                                        <p>{msg.text}</p>
                                                        <p className="text-[10px] opacity-40 mt-1 text-right">{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isPending && (
                                    <div className="space-y-3">
                                        {respondingTo === req._id && (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={responseNote}
                                                    onChange={e => setResponseNote(e.target.value)}
                                                    placeholder="Write a message to the participant (e.g. ask for more info, clarify details)..."
                                                    rows={3}
                                                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none resize-none"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <input type="number" value={negotiatedPrice} onChange={e => setNegotiatedPrice(e.target.value)} placeholder="Set final price (TND) to accept..." className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none" />
                                                    <span className="text-gray-500 font-bold text-sm">TND</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleSendResponse(req._id)}
                                                        disabled={!responseNote.trim()}
                                                        className="flex-1 bg-blue-50 border border-blue-200 text-blue-600 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        Send Message
                                                    </button>
                                                    <button onClick={() => handleServiceRequestAction(req._id, "accepted")} className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-600 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"><CheckCircle size={16} /> Accept</button>
                                                    <button onClick={() => handleServiceRequestAction(req._id, "declined")} className="flex-1 bg-red-50 border border-red-200 text-red-500 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><XCircle size={16} /> Decline</button>
                                                    <button onClick={() => { setRespondingTo(null); setResponseNote(""); setNegotiatedPrice(""); }} className="px-4 py-3 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-200 transition">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                        {respondingTo !== req._id && (
                                            <div className="flex gap-3">
                                                <button onClick={() => setRespondingTo(req._id)} className="flex-1 bg-gray-100 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition">
                                                    {req.providerNote ? "Edit Response" : "Respond"}
                                                </button>
                                                <button onClick={() => handleServiceRequestAction(req._id, "accepted")} className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-600 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"><CheckCircle size={16} /> Accept</button>
                                                <button onClick={() => handleServiceRequestAction(req._id, "declined")} className="flex-1 bg-red-50 border border-red-200 text-red-500 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><XCircle size={16} /> Decline</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {req.status === 'accepted' && req.contract && (
                                    <div className="mt-4 bg-gray-50 rounded-2xl border border-gray-200 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-black text-sm uppercase tracking-widest text-[#7C3AED]">📄 Service Contract</h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${req.contract.status === 'FULLY_SIGNED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'}`}>
                                                {req.contract.status === 'FULLY_SIGNED' ? '✅ Fully Signed' : req.contract.providerSigned ? '⏳ Waiting for Client' : req.contract.clientSigned ? '✍️ Client Signed — Your Turn' : '⏳ Waiting for Client to Sign First'}
                                            </span>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 mb-4 max-h-48 overflow-y-auto border border-gray-200">
                                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{req.contract.terms}</pre>
                                        </div>
                                        <div className="flex gap-4 mb-4">
                                            <div className={`flex items-center gap-2 text-xs font-bold ${req.contract.clientSigned ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {req.contract.clientSigned ? '✅' : '⬜'} Client
                                                {req.contract.clientSignedAt && <span className="text-gray-400 font-normal">({new Date(req.contract.clientSignedAt).toLocaleDateString()})</span>}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs font-bold ${req.contract.providerSigned ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {req.contract.providerSigned ? '✅' : '⬜'} You
                                                {req.contract.providerSignedAt && <span className="text-gray-400 font-normal">({new Date(req.contract.providerSignedAt).toLocaleDateString()})</span>}
                                            </div>
                                        </div>
                                        {req.contract.clientSigned && !req.contract.providerSigned && (
                                            <button onClick={() => dispatch(signContract(req.contract._id))} className="w-full bg-[#7C3AED] text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all">✍️ Sign Contract</button>
                                        )}
                                        {!req.contract.clientSigned && <div className="text-center text-yellow-600 font-bold text-xs py-2">Waiting for client to sign first...</div>}
                                        {req.contract.status === 'FULLY_SIGNED' && <div className="text-center text-emerald-600 font-black text-sm py-2">🎉 Contract fully signed! Service is confirmed.</div>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderProfile = () => {
        const inputClass = "w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all placeholder:text-gray-400";
        const labelClass = "block text-xs font-black text-gray-500 uppercase tracking-widest mb-2";
        return (
            <div className="animate-in fade-in duration-500">
                <div className="mb-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-black text-2xl">{user?.firstName?.[0] || "P"}</div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Edit Profile</h2>
                        <p className="text-gray-500 text-sm">Manage your provider account information</p>
                    </div>
                </div>
                <form onSubmit={handleProfileUpdate}>
                    <div className="flex gap-8 items-start">
                        {/* Left: form fields */}
                        <div className="flex-1 space-y-8">
                            {/* Personal Info */}
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                                    <span className="text-[#7C3AED]">👤</span>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Personal Information</h3>
                                </div>
                                <div className="p-8 grid md:grid-cols-2 gap-6">
                                    <div><label className={labelClass}>First Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="First name" /></div>
                                    <div><label className={labelClass}>Last Name</label><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} placeholder="Last name" /></div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                                    <span className="text-[#7C3AED]">📧</span>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Contact Details</h3>
                                </div>
                                <div className="p-8 grid md:grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="provider@example.com" /></div>
                                    <div><label className={labelClass}>Phone Number</label><input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputClass} placeholder="+216 XX XXX XXX" /></div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>City</label>
                                        <input type="text" value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} className={inputClass} placeholder="Auto-filled from map" />
                                    </div>
                                </div>
                            </div>

                            {/* Security */}
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                                    <span className="text-[#7C3AED]">🔒</span>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Security</h3>
                                </div>
                                <div className="p-8">
                                    <label className={labelClass}>New Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="Leave blank to keep current password" />
                                    <p className="text-xs text-gray-400 mt-2">Leave unchanged to keep your current password.</p>
                                </div>
                            </div>

                            <button type="submit" className="flex items-center gap-3 px-10 py-4 bg-[#7C3AED] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all">
                                💾 Save Profile Updates
                            </button>
                        </div>

                        {/* Right: sticky map */}
                        <div className="w-96 sticky top-8">
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6" style={{ minHeight: 460 }}>
                                <LocationPicker
                                    coordinates={coordinates}
                                    locationName={profileForm.location}
                                    onLocationChange={({ lat, lng, locationName }) => {
                                        setCoordinates({ lat, lng });
                                        if (locationName) setProfileForm(f => ({ ...f, location: locationName }));
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
        );
    };

    const renderAvailability = () => {
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        return (
            <div className="max-w-xl mx-auto animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Availability Calendar</h2>
                        <p className="text-gray-500 text-sm mt-1">Click days to mark them as <span className="text-red-500 font-bold">unavailable</span>.</p>
                    </div>
                    <button onClick={handleSaveAvailability} disabled={saving} className="bg-[#7C3AED] text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#6D28D9] transition-all disabled:opacity-50 shadow-lg shadow-[#7C3AED]/20">{saving ? "Saving..." : "Save"}</button>
                </div>
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={prevMonth} className="p-3 rounded-xl bg-gray-100 hover:bg-[#7C3AED]/10 transition-all text-gray-500 hover:text-[#7C3AED] text-xl font-bold border border-gray-200">‹</button>
                        <h3 className="text-xl font-black text-gray-900">{monthNames[calMonth]} {calYear}</h3>
                        <button onClick={nextMonth} className="p-3 rounded-xl bg-gray-100 hover:bg-[#7C3AED]/10 transition-all text-gray-500 hover:text-[#7C3AED] text-xl font-bold border border-gray-200">›</button>
                    </div>
                    <div className="grid grid-cols-7 mb-3">
                        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center text-xs font-black text-gray-400 uppercase tracking-widest py-2">{d}</div>)}
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
                                    className={`aspect-square rounded-xl text-sm font-bold transition-all ${isPast ? "text-gray-300 cursor-not-allowed" : isUnavailable ? "bg-red-50 border border-red-300 text-red-500 hover:bg-red-100" : isToday ? "bg-[#7C3AED]/10 border border-[#7C3AED] text-[#7C3AED] font-black" : "bg-gray-50 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] text-gray-600 border border-gray-200 hover:border-[#7C3AED]/30"}`}>
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-6 mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" /><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Available</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-50 border border-red-300" /><span className="text-xs text-red-500 font-bold uppercase tracking-widest">Unavailable</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#7C3AED]/10 border border-[#7C3AED]" /><span className="text-xs text-[#7C3AED] font-bold uppercase tracking-widest">Today</span></div>
                    </div>
                </div>
                {unavailable.length > 0 && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Marked Unavailable ({unavailable.length} days)</p>
                        <div className="flex flex-wrap gap-2">
                            {[...unavailable].sort().map(d => (
                                <span key={d} onClick={() => toggleDate(d)} className="px-3 py-1 bg-red-50 border border-red-200 text-red-500 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-100 transition-all">{d} ✕</span>
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
                <div className="mb-10 px-8 py-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
                    <CheckCircle size={24} /> <span className="font-bold uppercase tracking-widest text-sm">{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="mb-10 px-8 py-5 bg-red-50 border border-red-200 text-red-600 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
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