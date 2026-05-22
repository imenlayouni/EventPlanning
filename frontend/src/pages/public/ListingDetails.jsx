import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { MapPin, Tag, ArrowLeft, ClipboardList, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Navbar from "../../components/Navbar";
import { createServiceRequest, clearRequestStatus } from "../../store/requestSlice";

export default function ListingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { loading: submitting, successMessage, error: requestError } = useSelector((state) => state.serviceRequests);

    const [providerReviews, setProviderReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed

    const openLightbox = (i) => setLightboxIndex(i);
    const closeLightbox = () => setLightboxIndex(null);
    const lightboxPrev = () => setLightboxIndex(i => (i - 1 + listing.images.length) % listing.images.length);
    const lightboxNext = () => setLightboxIndex(i => (i + 1) % listing.images.length);

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        requestType: "custom", description: "", suggestedPrice: "", startDate: "", endDate: ""
    });

    // Dynamic form answers
    const [formAnswers, setFormAnswers] = useState({});
    const handleAnswerChange = (label, value) => {
        setFormAnswers(prev => ({ ...prev, [label]: value }));
    };

    const [bookedRanges, setBookedRanges] = useState([]);
    const [providerUnavailableDates, setProviderUnavailableDates] = useState([]);
    const today = new Date();
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [calYear, setCalYear] = useState(today.getFullYear());

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/api/listings/${id}`);
                setListing(res.data);
            } catch (err) {
                setError("Listing not found.");
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [id]);

    useEffect(() => {
        const fetchReservations = async () => {
            if (!listing) return;
            try {
                const res = await axios.get(`http://localhost:3000/api/reservations/listing/${listing._id}`);
                setBookedRanges(res.data || []);
            } catch (err) {}
        };
        fetchReservations();
    }, [listing]);

    useEffect(() => {
        const fetchProviderAvailability = async () => {
            if (!listing?.organizer?._id) return;
            try {
                const res = await axios.get(`http://localhost:3000/api/auth/provider-availability/${listing.organizer._id}`);
                setProviderUnavailableDates(res.data.unavailableDates || []);
            } catch (err) {}
        };
        fetchProviderAvailability();
    }, [listing]);

    useEffect(() => {
        const fetchProviderReviews = async () => {
            if (!listing?.organizer?._id) return;
            try {
                const res = await axios.get(`http://localhost:3000/api/reviews/provider/${listing.organizer._id}`);
                setProviderReviews(res.data || []);
            } catch (err) {}
        };
        fetchProviderReviews();
    }, [listing]);

    useEffect(() => {
        if (successMessage) {
            setTimeout(() => {
                dispatch(clearRequestStatus());
                setShowRequestModal(false);
                setRequestForm({ requestType: "custom", description: "", suggestedPrice: "", startDate: "", endDate: "" });
                setFormAnswers({});
            }, 2000);
        }
    }, [successMessage, dispatch]);

    const handleMakeRequest = () => {
        if (!isAuthenticated) { navigate("/login"); return; }
        setShowRequestModal(true);
    };

    const handleSubmitRequest = (e) => {
        e.preventDefault();
        if (!requestForm.description.trim()) return;

        // validate required fields
        if (listing.fields && listing.fields.length > 0) {
            for (const field of listing.fields) {
                if (field.required && !formAnswers[field.label]) {
                    toast.error(`Please fill in: ${field.label}`);
                    return;
                }
            }
        }

        const payload = {
            provider: listing.organizer?._id,
            listing: listing._id,
            requestType: requestForm.requestType,
            description: requestForm.description,
            suggestedPrice: requestForm.suggestedPrice ? Number(requestForm.suggestedPrice) : null,
            formAnswers: Object.entries(formAnswers).map(([label, value]) => ({ label, value }))
        };

        if (requestForm.startDate && requestForm.endDate) {
            payload.startDate = requestForm.startDate;
            payload.endDate = requestForm.endDate;
        }

        dispatch(createServiceRequest(payload));
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) { navigate('/login'); return; }
        try {
            setSubmittingReview(true);
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `http://localhost:3000/api/reviews/provider/${listing.organizer._id}`,
                { rating: reviewForm.rating, comment: reviewForm.comment, listingId: listing._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProviderReviews(prev => [res.data, ...prev]);
            setReviewForm({ rating: 5, comment: '' });
            toast.success('Review submitted!');
        } catch (err) {
            toast.error('Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="bg-[#F5F0FF] text-gray-900 min-h-screen"><Navbar /><div className="flex items-center justify-center pt-32">Loading...</div></div>;
    if (error) return <div className="bg-[#F5F0FF] text-gray-900 min-h-screen"><Navbar /><div className="flex items-center justify-center pt-32 text-red-500">{error}</div></div>;
    if (!listing) return null;

    return (
        <div className="min-h-screen bg-[#F5F0FF] text-gray-900">
            <Navbar />

            <div className="max-w-5xl mx-auto pt-32 px-8 pb-16">
                <Link to="/feed" className="inline-flex items-center text-gray-500 hover:text-[#7C3AED] mb-8 transition">
                    <ArrowLeft size={20} className="mr-2" /> Back to Feed
                </Link>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="h-96 bg-gray-100 relative">
    {listing.images && listing.images.length > 0 ? (
        <div className="flex overflow-x-auto gap-2 h-96">
            {listing.images.map((img, i) => (
                <div
                    key={i}
                    className={`relative group flex-shrink-0 cursor-zoom-in ${i === 0 ? 'flex-1' : 'w-32'}`}
                    onClick={() => openLightbox(i)}
                >
                    <img
                        src={img}
                        alt={`${listing.title} ${i + 1}`}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
    )}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
                            <div className="flex items-center gap-2 opacity-90 text-sm font-semibold uppercase tracking-wider mb-2">
                                <Tag size={14} className="text-[#7C3AED]" /> {listing.category}
                            </div>
                            <h1 className="text-4xl font-bold">{listing.title}</h1>
                            <div className="flex items-center gap-2 mt-2 opacity-90 text-gray-300">
                                <MapPin size={18} className="text-[#7C3AED]" /> {listing.location}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="md:col-span-2 p-8 border-r border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Service</h2>
                            <p className="text-gray-500 leading-relaxed whitespace-pre-line mb-8">{listing.description}</p>

                            {listing.assets && (
                                <>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">What's Included (Assets)</h3>
                                    <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 text-gray-600">{listing.assets}</div>
                                </>
                            )}

                            <div className="mt-8 pt-8 border-t border-gray-800">
                                <h2 className="text-2xl font-bold text-white mb-6">
                                    Provider Reviews
                                    {providerReviews.length > 0 && (
                                        <span className="ml-3 text-sm text-gray-400 font-normal">
                                            ({providerReviews.length} reviews • ⭐ {(providerReviews.reduce((a, r) => a + r.rating, 0) / providerReviews.length).toFixed(1)} avg)
                                        </span>
                                    )}
                                </h2>

                                {isAuthenticated && user?._id !== listing.organizer?._id && (
                                    <form onSubmit={handleSubmitReview} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-6">
                                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-500 mb-4">Leave a Review</h3>
                                        <div className="flex gap-2 mb-4">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} type="button" onClick={() => setReviewForm({...reviewForm, rating: star})} className={`text-2xl transition ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</button>
                                            ))}
                                        </div>
                                        <textarea value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} placeholder="Share your experience with this provider..." required rows={3} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#7C3AED] resize-none mb-3" />
                                        <button type="submit" disabled={submittingReview} className="bg-[#7C3AED] text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest hover:bg-[#6D28D9] transition disabled:opacity-50">
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                )}

                                {providerReviews.length === 0 ? (
                                    <p className="text-gray-500 italic">No reviews yet for this provider.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {providerReviews.map(review => (
                                            <div key={review._id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center font-black text-[#7C3AED]">{review.user?.firstName?.[0]}</div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{review.user?.firstName} {review.user?.lastName}</div>
                                                        <div className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="ml-auto flex gap-1">
                                                        {[1,2,3,4,5].map(star => (
                                                            <span key={star} className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-600">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-32">
                                <p className="text-sm text-gray-400 mb-1">Starting price</p>
                                <p className="text-3xl font-bold text-[#7C3AED] mb-6">{listing.price}</p>
                                <div className="space-y-4">
                                    <button onClick={handleMakeRequest} className="w-full bg-[#7C3AED] text-white py-3 rounded-lg font-semibold hover:bg-[#6D28D9] transition flex items-center justify-center gap-2 shadow-lg">
                                        <ClipboardList size={18} /> Make a Request
                                    </button>
                                    {!isAuthenticated && (
                                        <div className="space-y-3">
                                            <p className="text-xs text-gray-500 text-center">Login to make requests.</p>
                                            <Link to="/login" className="block w-full bg-[#1f1f35] border border-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition text-center text-sm">Login to Request</Link>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center font-bold text-[#7C3AED]">{listing.organizer?.firstName?.[0]}</div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{listing.organizer?.firstName} {listing.organizer?.lastName}</p>
                                            <p className="text-xs text-gray-400">Service Provider</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-500"><span className="text-gray-700 font-semibold">Email: </span>{listing.organizer?.email}</p>
                                        {listing.organizer?.serviceProfile?.phone && (
                                            <p className="text-gray-500"><span className="text-gray-700 font-semibold">Phone: </span>{listing.organizer.serviceProfile.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-[#E4D9FF] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[92vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-[#E4D9FF]">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Make a Request</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                    To: {listing.organizer?.firstName} {listing.organizer?.lastName} &nbsp;·&nbsp; {listing.title}
                                </p>
                            </div>
                            <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-[#F5F0FF] rounded-xl transition">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRequest} className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                {/* ── Left column: request details ── */}
                                <div className="space-y-5">

                                    {/* Request Type */}
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Request Type</label>
                                        <select value={requestForm.requestType} onChange={e => setRequestForm({ ...requestForm, requestType: e.target.value })} className="w-full bg-[#F5F0FF] border border-[#E4D9FF] rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] outline-none appearance-none cursor-pointer">
                                            <option value="price_change">💰 Lower / Change Price</option>
                                            <option value="add_item">➕ Add Something</option>
                                            <option value="remove_item">➖ Remove Something</option>
                                            <option value="custom">✏️ Custom Request</option>
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Describe Your Request</label>
                                        <textarea value={requestForm.description} onChange={e => setRequestForm({ ...requestForm, description: e.target.value })} placeholder="Explain what you'd like in detail..." required rows={5} className="w-full bg-[#F5F0FF] border border-[#E4D9FF] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none resize-none" />
                                    </div>

                                    {/* Suggested price (price_change only) */}
                                    {requestForm.requestType === "price_change" && (
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Suggested Price (TND) — Optional</label>
                                            <input type="number" value={requestForm.suggestedPrice} onChange={e => setRequestForm({ ...requestForm, suggestedPrice: e.target.value })} placeholder="e.g. 500" className="w-full bg-[#F5F0FF] border border-[#E4D9FF] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none" />
                                        </div>
                                    )}

                                    {/* Dynamic form fields */}
                                    {listing.fields && listing.fields.length > 0 && (
                                        <div className="border-t border-[#E4D9FF] pt-5 space-y-4">
                                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Service Details</h3>
                                            {listing.fields.map((field, index) => (
                                                <div key={index}>
                                                    <label className="block text-xs font-bold text-gray-500 mb-2">
                                                        {field.label} {field.required && <span className="text-red-400">*</span>}
                                                    </label>
                                                    {field.type === 'text' && (
                                                        <input type="text" value={formAnswers[field.label] || ''} onChange={e => handleAnswerChange(field.label, e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} className="w-full bg-[#F5F0FF] text-gray-900 text-sm p-3 rounded-xl border border-[#E4D9FF] focus:ring-2 focus:ring-[#7C3AED] outline-none" />
                                                    )}
                                                    {field.type === 'number' && (
                                                        <input type="number" value={formAnswers[field.label] || ''} onChange={e => handleAnswerChange(field.label, e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} className="w-full bg-[#F5F0FF] text-gray-900 text-sm p-3 rounded-xl border border-[#E4D9FF] focus:ring-2 focus:ring-[#7C3AED] outline-none" />
                                                    )}
                                                    {field.type === 'dropdown' && (
                                                        <select value={formAnswers[field.label] || ''} onChange={e => handleAnswerChange(field.label, e.target.value)} className="w-full bg-[#F5F0FF] text-gray-900 text-sm p-3 rounded-xl border border-[#E4D9FF] focus:ring-2 focus:ring-[#7C3AED] outline-none">
                                                            <option value="">Select {field.label}</option>
                                                            {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                        </select>
                                                    )}
                                                    {field.type === 'checkbox' && (
                                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                            <input type="checkbox" checked={formAnswers[field.label] === 'true'} onChange={e => handleAnswerChange(field.label, e.target.checked.toString())} className="accent-[#7C3AED] w-4 h-4" />
                                                            Yes
                                                        </label>
                                                    )}
                                                    {field.type === 'multi-select' && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {field.options.map((opt, i) => {
                                                                const selected = (formAnswers[field.label] || '').split(',').filter(Boolean);
                                                                const isSelected = selected.includes(opt);
                                                                return (
                                                                    <button key={i} type="button"
                                                                        onClick={() => {
                                                                            const current = (formAnswers[field.label] || '').split(',').filter(Boolean);
                                                                            const updated = isSelected ? current.filter(o => o !== opt) : [...current, opt];
                                                                            handleAnswerChange(field.label, updated.join(','));
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition ${isSelected ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-[#F5F0FF] text-gray-600 border-[#E4D9FF] hover:border-[#7C3AED] hover:text-[#7C3AED]'}`}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── Right column: date picker ── */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Pick Your Date</label>
                                        <div className="bg-[#F5F0FF] rounded-2xl border border-[#E4D9FF] p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-2 rounded-xl bg-white hover:bg-[#7C3AED]/10 text-gray-500 hover:text-[#7C3AED] transition font-bold border border-[#E4D9FF]">‹</button>
                                                <span className="font-black text-sm text-gray-900">{["January","February","March","April","May","June","July","August","September","October","November","December"][calMonth]} {calYear}</span>
                                                <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-2 rounded-xl bg-white hover:bg-[#7C3AED]/10 text-gray-500 hover:text-[#7C3AED] transition font-bold border border-[#E4D9FF]">›</button>
                                            </div>
                                            <div className="grid grid-cols-7 mb-2">
                                                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase py-1">{d}</div>)}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1.5">
                                                {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                                                {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                                                    const day = i + 1;
                                                    const todayDate = new Date();
                                                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                    const isUnavailable = providerUnavailableDates.includes(dateStr);
                                                    const isPast = new Date(calYear, calMonth, day) < new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
                                                    const isSelected = requestForm.startDate === dateStr;
                                                    return (
                                                        <button key={dateStr} type="button" disabled={isUnavailable || isPast}
                                                            onClick={() => setRequestForm({ ...requestForm, startDate: dateStr, endDate: dateStr })}
                                                            className={`aspect-square rounded-lg text-xs font-bold transition-all ${isPast ? "text-gray-300 cursor-not-allowed" : isUnavailable ? "bg-red-50 text-red-400 cursor-not-allowed line-through border border-red-200" : isSelected ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30" : "bg-white hover:bg-[#7C3AED]/10 text-gray-600 hover:text-[#7C3AED] border border-[#E4D9FF]"}`}
                                                            title={isUnavailable ? "Provider unavailable" : ""}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex gap-4 mt-4 pt-3 border-t border-[#E4D9FF]">
                                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#7C3AED]" /><span className="text-[10px] text-gray-500 font-bold uppercase">Selected</span></div>
                                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-50 border border-red-200" /><span className="text-[10px] text-red-400 font-bold uppercase">Unavailable</span></div>
                                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white border border-[#E4D9FF]" /><span className="text-[10px] text-gray-500 font-bold uppercase">Available</span></div>
                                            </div>
                                        </div>
                                        {requestForm.startDate && (
                                            <p className="text-xs text-[#7C3AED] font-bold mt-2">📅 Selected: {requestForm.startDate}</p>
                                        )}
                                    </div>

                                    {bookedRanges && bookedRanges.length > 0 && (
                                        <div className="p-4 bg-[#F5F0FF] rounded-xl border border-[#E4D9FF]">
                                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Provider's Booked Dates</p>
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                {bookedRanges.map(b => (
                                                    <li key={b._id} className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-500' : 'bg-yellow-400'}`} />
                                                        {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                                                        <span className="text-gray-400">({b.status})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer: feedback + submit */}
                            <div className="mt-8 pt-6 border-t border-[#E4D9FF] space-y-4">
                                {requestError && <p className="text-red-500 text-sm text-center">{requestError}</p>}
                                {successMessage && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-center font-bold text-sm">✅ {successMessage}</div>}
                                <button type="submit" disabled={submitting} className="w-full bg-[#7C3AED] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all disabled:opacity-50">
                                    {submitting ? "Sending..." : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Lightbox ── */}
            {lightboxIndex !== null && listing?.images?.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close */}
                    <button
                        className="absolute top-5 right-5 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition z-10"
                        onClick={closeLightbox}
                    >
                        <X size={24} />
                    </button>

                    {/* Counter */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-bold">
                        {lightboxIndex + 1} / {listing.images.length}
                    </div>

                    {/* Prev */}
                    {listing.images.length > 1 && (
                        <button
                            className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition z-10"
                            onClick={e => { e.stopPropagation(); lightboxPrev(); }}
                        >
                            <ChevronLeft size={28} />
                        </button>
                    )}

                    {/* Image */}
                    <img
                        src={listing.images[lightboxIndex]}
                        alt={`${listing.title} ${lightboxIndex + 1}`}
                        className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />

                    {/* Next */}
                    {listing.images.length > 1 && (
                        <button
                            className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition z-10"
                            onClick={e => { e.stopPropagation(); lightboxNext(); }}
                        >
                            <ChevronRight size={28} />
                        </button>
                    )}

                    {/* Thumbnail strip */}
                    {listing.images.length > 1 && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                            {listing.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIndex ? 'border-[#7C3AED] scale-110' : 'border-white/20 hover:border-white/50'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}