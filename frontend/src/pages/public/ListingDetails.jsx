import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { MapPin, Tag, ArrowLeft, ClipboardList, X } from "lucide-react";
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
                    alert(`Please fill in: ${field.label}`);
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
            alert('Review submitted!');
        } catch (err) {
            alert('Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="bg-[#0b0b16] text-white min-h-screen"><Navbar /><div className="flex items-center justify-center pt-32">Loading...</div></div>;
    if (error) return <div className="bg-[#0b0b16] text-white min-h-screen"><Navbar /><div className="flex items-center justify-center pt-32 text-red-500">{error}</div></div>;
    if (!listing) return null;

    return (
        <div className="min-h-screen bg-[#0b0b16] text-white">
            <Navbar />

            <div className="max-w-5xl mx-auto pt-32 px-8 pb-16">
                <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-[#7C3AED] mb-8 transition">
                    <ArrowLeft size={20} className="mr-2" /> Back to Feed
                </Link>

                <div className="bg-[#141428] rounded-2xl shadow-xl overflow-hidden border border-gray-800">
                <div className="h-96 bg-[#1f1f35] relative">
    {listing.images && listing.images.length > 0 ? (
        <div className="flex overflow-x-auto gap-2 h-96">
            {listing.images.map((img, i) => (
                <img
                    key={i}
                    src={img}
                    alt={`${listing.title} ${i + 1}`}
                    className={`h-full object-cover flex-shrink-0 ${i === 0 ? 'flex-1' : 'w-32'}`}
                />
            ))}
        </div>
    ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
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
                        <div className="md:col-span-2 p-8 border-r border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-4">About this Service</h2>
                            <p className="text-gray-400 leading-relaxed whitespace-pre-line mb-8">{listing.description}</p>

                            {listing.assets && (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-4">What's Included (Assets)</h3>
                                    <div className="bg-[#1f1f35] p-4 rounded-xl border border-gray-800 text-gray-300">{listing.assets}</div>
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
                                    <form onSubmit={handleSubmitReview} className="bg-[#1f1f35] p-5 rounded-2xl border border-gray-800 mb-6">
                                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Leave a Review</h3>
                                        <div className="flex gap-2 mb-4">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} type="button" onClick={() => setReviewForm({...reviewForm, rating: star})} className={`text-2xl transition ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</button>
                                            ))}
                                        </div>
                                        <textarea value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} placeholder="Share your experience with this provider..." required rows={3} className="w-full bg-[#0b0b16] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#7C3AED] resize-none mb-3" />
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
                                            <div key={review._id} className="bg-[#1f1f35] p-5 rounded-2xl border border-gray-800">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center font-black text-[#7C3AED]">{review.user?.firstName?.[0]}</div>
                                                    <div>
                                                        <div className="font-bold">{review.user?.firstName} {review.user?.lastName}</div>
                                                        <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="ml-auto flex gap-1">
                                                        {[1,2,3,4,5].map(star => (
                                                            <span key={star} className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-300">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-[#1f1f35]/30">
                            <div className="bg-[#141428] rounded-xl shadow-sm p-6 border border-gray-800 sticky top-32">
                                <p className="text-sm text-gray-500 mb-1">Starting price</p>
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
                                <div className="mt-6 pt-6 border-t border-gray-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center font-bold text-[#7C3AED]">{listing.organizer?.firstName?.[0]}</div>
                                        <div>
                                            <p className="font-semibold text-white">{listing.organizer?.firstName} {listing.organizer?.lastName}</p>
                                            <p className="text-xs text-gray-500">Service Provider</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-400"><span className="text-gray-600 font-semibold">Email: </span>{listing.organizer?.email}</p>
                                        {listing.organizer?.serviceProfile?.phone && (
                                            <p className="text-gray-400"><span className="text-gray-600 font-semibold">Phone: </span>{listing.organizer.serviceProfile.phone}</p>
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
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141428] rounded-3xl border border-gray-800 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <div>
                                <h2 className="text-xl font-black">Make a Request</h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">To: {listing.organizer?.firstName} {listing.organizer?.lastName} • {listing.title}</p>
                            </div>
                            <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-gray-800 rounded-xl transition">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
                            {/* Request Type */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Request Type</label>
                                <select value={requestForm.requestType} onChange={e => setRequestForm({ ...requestForm, requestType: e.target.value })} className="w-full bg-[#1f1f35] border-0 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#7C3AED] appearance-none cursor-pointer">
                                    <option value="price_change">💰 Lower / Change Price</option>
                                    <option value="add_item">➕ Add Something</option>
                                    <option value="remove_item">➖ Remove Something</option>
                                    <option value="custom">✏️ Custom Request</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Describe Your Request</label>
                                <textarea value={requestForm.description} onChange={e => setRequestForm({ ...requestForm, description: e.target.value })} placeholder="Explain what you'd like..." required rows={4} className="w-full bg-[#1f1f35] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#7C3AED] resize-none" />
                            </div>

                            {/* Dynamic form fields */}
                            {listing.fields && listing.fields.length > 0 && (
                                <div className="border-t border-gray-800 pt-4">
                                    <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-3">Service Details</h3>
                                    {listing.fields.map((field, index) => (
                                        <div key={index} className="mb-4">
                                            <label className="block text-xs font-bold text-gray-400 mb-2">
                                                {field.label} {field.required && <span className="text-red-400">*</span>}
                                            </label>
                                            {field.type === 'text' && (
                                                <input type="text" value={formAnswers[field.label] || ''} onChange={e => handleAnswerChange(field.label, e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} className="w-full bg-[#1f1f35] text-white text-sm p-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-[#7C3AED]" />
                                            )}
                                            {field.type === 'number' && (
                                                <input type="number" value={formAnswers[field.label] || ''} onChange={e => handleAnswerChange(field.label, e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} className="w-full bg-[#1f1f35] text-white text-sm p-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-[#7C3AED]" />
                                            )}
                                            {field.type === 'dropdown' && (
                                                <select value={formAnswers[field.label] || ''} onChange={e => handleAnswerChange(field.label, e.target.value)} className="w-full bg-[#1f1f35] text-white text-sm p-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-[#7C3AED]">
                                                    <option value="">Select {field.label}</option>
                                                    {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                </select>
                                            )}
                                            {field.type === 'checkbox' && (
                                                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
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
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    const current = (formAnswers[field.label] || '').split(',').filter(Boolean);
                                                    const updated = isSelected
                                                        ? current.filter(o => o !== opt)
                                                        : [...current, opt];
                                                    handleAnswerChange(field.label, updated.join(','));
                                                }}
                                                className={`px-3 py-1 rounded-xl text-sm font-bold border transition ${isSelected ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-[#1f1f35] text-gray-400 border-gray-700 hover:border-[#7C3AED]'}`}
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

                            {/* Date picker */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Pick Your Date</label>
                                <div className="bg-[#0b0b16] rounded-2xl border border-gray-800 p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-2 rounded-xl bg-[#1f1f35] hover:bg-[#7C3AED]/20 text-gray-400 hover:text-white transition font-bold">‹</button>
                                        <span className="font-black text-sm">{["January","February","March","April","May","June","July","August","September","October","November","December"][calMonth]} {calYear}</span>
                                        <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-2 rounded-xl bg-[#1f1f35] hover:bg-[#7C3AED]/20 text-gray-400 hover:text-white transition font-bold">›</button>
                                    </div>
                                    <div className="grid grid-cols-7 mb-2">
                                        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-600 uppercase py-1">{d}</div>)}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
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
                                                    className={`aspect-square rounded-lg text-xs font-bold transition-all ${isPast ? "text-gray-700 cursor-not-allowed" : isUnavailable ? "bg-red-500/20 text-red-400 cursor-not-allowed line-through" : isSelected ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30" : "bg-[#1f1f35] hover:bg-[#7C3AED]/30 text-gray-300 hover:text-white"}`}
                                                    title={isUnavailable ? "Provider unavailable" : ""}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-4 mt-4 pt-3 border-t border-gray-800">
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#7C3AED]" /><span className="text-[10px] text-gray-500 font-bold uppercase">Selected</span></div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" /><span className="text-[10px] text-red-400 font-bold uppercase">Unavailable</span></div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#1f1f35]" /><span className="text-[10px] text-gray-500 font-bold uppercase">Available</span></div>
                                    </div>
                                </div>
                                {requestForm.startDate && <p className="text-xs text-[#7C3AED] font-bold mt-2">Selected: {requestForm.startDate}</p>}
                            </div>

                            {bookedRanges && bookedRanges.length > 0 && (
                                <div className="p-3 bg-[#0f1724] rounded-xl border border-gray-800 text-gray-300">
                                    <p className="text-sm font-bold mb-2">Provider booked ranges</p>
                                    <ul className="text-xs space-y-1">
                                        {bookedRanges.map(b => (
                                            <li key={b._id}>{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()} {b.status === 'confirmed' ? '(confirmed)' : '(pending)'}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {requestForm.requestType === "price_change" && (
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Suggested Price (Optional)</label>
                                    <input type="number" value={requestForm.suggestedPrice} onChange={e => setRequestForm({ ...requestForm, suggestedPrice: e.target.value })} placeholder="e.g. 500" className="w-full bg-[#1f1f35] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#7C3AED]" />
                                </div>
            )}

                            {requestError && <p className="text-red-400 text-sm text-center">{requestError}</p>}
                            {successMessage && <div className="p-3 bg-emerald-400/10 border border-emerald-400/30 rounded-xl text-emerald-400 text-center font-bold text-sm">✅ {successMessage}</div>}

                            <button type="submit" disabled={submitting} className="w-full bg-[#7C3AED] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all disabled:opacity-50">
                                {submitting ? "Sending..." : "Submit Request"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}