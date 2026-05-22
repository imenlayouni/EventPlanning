import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchListings } from "../../store/listingSlice";
import { fetchMyEvents, addEventAction, addServiceToEventAction } from "../../store/eventsSlice";
import Navbar from "../../components/Navbar";
import axios from "axios";

export default function Feed() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recError, setRecError] = useState(null);
  const [recSearch, setRecSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { listings, loading } = useSelector(state => state.listings);
  const { myEvents } = useSelector(state => state.events);

  // Gallery
  const [photos, setPhotos] = useState([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoCategory, setPhotoCategory] = useState("All");
  const PHOTO_CATEGORIES = ["All", "Weddings", "Ceremony", "Private Parties", "Social Events"];
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoUploadCategory, setPhotoUploadCategory] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Modal
  const [selectedService, setSelectedService] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newEventName, setNewEventName] = useState("");

  // Contact
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  // Refs
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const galleryRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

 useEffect(() => {
    dispatch(fetchListings());
    if (isAuthenticated) dispatch(fetchMyEvents());

    const fetchPhotos = async () => {
        try {
            setPhotoLoading(true);
            const res = await axios.get("http://localhost:3000/api/photos");
            setPhotos(res.data || []);
        } catch (err) {
            console.error("Failed to load photos", err);
        } finally {
            setPhotoLoading(false);
        }
    };

    fetchPhotos();
    if (isAuthenticated) fetchRecommendations('');
}, [dispatch, isAuthenticated]);

  const openModal = (service) => {
    if (!isAuthenticated) {
      if (window.confirm("Please login to save services to your events. Go to login page?")) navigate("/login");
      return;
    }
    setSelectedService(service);
  };

  const closeModal = () => {
    setSelectedService(null);
    setCreating(false);
    setNewEventName("");
  };

  const handleAddToEvent = (event) => {
    dispatch(addServiceToEventAction({ eventId: event._id, serviceId: selectedService._id }));
    closeModal();
  };

  const handleCreateEvent = () => {
    if (!newEventName.trim()) return;
    dispatch(addEventAction(newEventName));
    setCreating(false);
    setNewEventName("");
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    try {
      setUploadingPhoto(true);
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('photo', photoFile);
      fd.append('description', photoDesc);
      fd.append('category', photoUploadCategory);
      const res = await axios.post('http://localhost:3000/api/photos', fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhotos(prev => [res.data, ...prev]);
      setPhotoFile(null);
      setPhotoDesc('');
      setPhotoUploadCategory('');
      setShowPhotoUpload(false);
      toast.success('Photo uploaded!');
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error('Please fill all contact fields');
      return;
    }
    try {
      setSendingContact(true);
      await axios.post('http://localhost:3000/api/contact', { name: contactName, email: contactEmail, message: contactMessage });
      toast.success('Message sent — we will reply shortly');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSendingContact(false);
    }
  };
const fetchRecommendations = async (searchTerm = '') => {
    if (!isAuthenticated) return;
    try {
        setLoadingRecs(true);
        setRecError(null);
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:3000/api/recommendations',
            { search: searchTerm },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setAiRecommendations(res.data || []);
    } catch (err) {
        // silent — recError state already shows UI feedback
        setRecError("Could not load recommendations.");
    } finally {
        setLoadingRecs(false);
    }
};

  return (
    <div className="bg-[#0b0b16] text-white min-h-screen">

      <Navbar
        scrollToSection={scrollToSection}
        homeRef={homeRef}
        servicesRef={servicesRef}
        galleryRef={galleryRef}
        contactRef={contactRef}
      />
      {/* SEARCH BAR */}
<div className="fixed top-16 left-0 right-0 z-40 flex justify-center px-8 py-3 bg-black/50 backdrop-blur-md">
    <div className="flex gap-3 w-full max-w-2xl">
        <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search services by name, category or location..."
            className="flex-1 bg-white/10 text-white px-5 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#7C3AED] border border-white/20 placeholder-gray-400 backdrop-blur-sm"
        />
        {searchQuery && (
            <button
                onClick={() => setSearchQuery('')}
                className="bg-[#1f1f35] px-4 py-3 rounded-2xl text-gray-400 hover:text-white transition"
            >
                ✕
            </button>
        )}
        <button
            onClick={() => scrollToSection(servicesRef)}
            className="bg-[#7C3AED] px-6 py-3 rounded-2xl font-bold hover:bg-[#6D28D9] transition"
        >
            Search
        </button>
    </div>
</div>


      {/* HERO */}
      <section ref={homeRef} className="relative h-screen flex items-center justify-center text-center">
        <img src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3" alt="event" className="absolute w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 px-6">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="text-[#7C3AED] block">Plan Your Dream Event</span>
          </h1>
          <p className="text-gray-300 mt-6 max-w-2xl mx-auto">Discover nearby services and build your perfect event.</p>
        </div>
      </section>

      {/* SERVICES */}
      <section ref={servicesRef} className="px-8 md:px-16 py-16 flex gap-6">
        <div className="w-3/4">
          <center><h2 className="text-3xl font-bold mb-6">Our Services</h2></center>

          {/* Category filter chips */}
          {(() => {
            const cats = ['All', ...Array.from(new Set(listings.map(l => l.category).filter(Boolean))).sort()];
            return (
              <div className="flex gap-2 flex-wrap mb-6">
                {cats.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                      categoryFilter === cat
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-lg shadow-[#7C3AED]/30'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-[#7C3AED]/50 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            );
          })()}

          <div className="grid md:grid-cols-2 gap-6">
            {listings.filter(l => {
                const matchesSearch = !searchQuery ||
                  l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.location?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = categoryFilter === 'All' || l.category === categoryFilter;
                return matchesSearch && matchesCategory;
            }).map(listing => (
              <div
                key={listing._id}
                className="bg-[#141428] rounded-2xl p-5 hover:scale-[1.02] transition cursor-pointer"
                onClick={() => navigate(`/listing/${listing._id}`)}
              >
                {listing.images && listing.images.length > 0 ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-40 object-cover rounded-xl mb-4" />
                ) : (
                  <div className="h-40 bg-[#1f1f35] rounded-xl mb-4 flex items-center justify-center text-gray-500">No Image</div>
                )}
                <h3 className="text-xl font-semibold">{listing.title}</h3>
                <p className="text-gray-400">{listing.organizer?.firstName} {listing.organizer?.lastName}</p>
                <p className="text-[#A78BFA] mt-2">{listing.price}</p>
                <p className="text-sm text-gray-500">📍 {listing.location}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); openModal(listing); }}
                  className="mt-4 bg-[#7C3AED] px-4 py-2 rounded-xl hover:bg-[#6D28D9]"
                >
                  Add to Event
                </button>
              </div>
            ))}
            {listings.filter(l => {
              const matchesSearch = !searchQuery || l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.category?.toLowerCase().includes(searchQuery.toLowerCase()) || l.location?.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesCategory = categoryFilter === 'All' || l.category === categoryFilter;
              return matchesSearch && matchesCategory;
            }).length === 0 && !loading && (
              <div className="col-span-2 text-center py-12 text-gray-500">
                No services found{categoryFilter !== 'All' ? ` in "${categoryFilter}"` : ''}{searchQuery ? ` for "${searchQuery}"` : ''}.
              </div>
            )}
            {loading && <p className="text-gray-400">Loading services...</p>}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-1/4 bg-[#141428] p-5 rounded-2xl h-fit sticky top-24">
    <h2 className="text-lg font-bold mb-1">Recommendations for you</h2>
    <p className="text-xs text-gray-500 mb-3">Based on your location & history</p>

    {/* Search bar */}
    {isAuthenticated && (
        <div className="flex gap-2 mb-4">
            <input
                type="text"
                value={recSearch}
                onChange={e => setRecSearch(e.target.value)}
                placeholder="Search services..."
                className="flex-1 bg-[#1f1f35] text-white text-xs px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-[#7C3AED] placeholder-gray-600"
            />
            <button
                onClick={() => fetchRecommendations(recSearch)}
                className="bg-[#7C3AED] px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#6D28D9] transition"
            >
                Go
            </button>
        </div>
    )}

    {!isAuthenticated ? (
        <p className="text-xs text-gray-500">Login to see personalized recommendations.</p>
    ) : loadingRecs ? (
        <p className="text-xs text-gray-400 animate-pulse">Finding best matches...</p>
    ) : recError ? (
        <p className="text-xs text-red-400">{recError}</p>
    ) : aiRecommendations.length === 0 ? (
        <p className="text-xs text-gray-500">
            {recSearch ? `No results for "${recSearch}"` : "Add services to your events to get personalized recommendations."}
        </p>
    ) : (
        aiRecommendations.map(listing => (
            <div
                key={listing._id}
                onClick={() => navigate(`/listing/${listing._id}`)}
                className="bg-[#1f1f35] p-3 rounded-xl mb-3 cursor-pointer hover:bg-[#7C3AED]/20 border border-transparent hover:border-[#7C3AED]/30 transition-all"
            >
                {listing.images?.[0] && (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-20 object-cover rounded-lg mb-2" />
                )}
                <div className="font-bold text-sm">{listing.title}</div>
                <div className="text-xs text-gray-400">{listing.organizer?.firstName} {listing.organizer?.lastName}</div>
                <div className="text-xs text-[#A78BFA] mt-1">{listing.price}</div>
                <div className="text-xs text-gray-500">📍 {listing.location}</div>
                {listing.reason && <div className="text-xs text-[#7C3AED] mt-2 italic">✨ {listing.reason}</div>}
            </div>
        ))
    )}
</div>
      </section>

      {/* GALLERY */}
      <section ref={galleryRef} className="px-8 md:px-16 py-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Gallery</h2>
          {user?.role === 'serviceProvider' && (
            <button
              onClick={() => setShowPhotoUpload(!showPhotoUpload)}
              className="bg-[#7C3AED] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#6D28D9] transition"
            >
              + Add Photo
            </button>
          )}
        </div>

        {showPhotoUpload && user?.role === 'serviceProvider' && (
          <form onSubmit={handlePhotoUpload} className="bg-[#141428] p-6 rounded-2xl border border-gray-800 mb-6 max-w-md space-y-3">
            <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-2">Upload a Photo</h3>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Category <span className="text-red-400">*</span></label>
              <input
                list="photo-categories"
                required
                value={photoUploadCategory}
                onChange={e => setPhotoUploadCategory(e.target.value)}
                placeholder="e.g. Weddings, Birthday, Corporate..."
                className="w-full bg-[#1f1f35] text-white p-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-[#7C3AED] outline-none placeholder-gray-600"
              />
              <datalist id="photo-categories">
                {PHOTO_CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-[10px] text-gray-600 mt-1">Pick a suggestion or type your own category.</p>
            </div>

            {/* File */}
            <input
              type="file"
              accept="image/*"
              required
              onChange={e => setPhotoFile(e.target.files[0])}
              className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#7C3AED]/20 file:text-[#A78BFA] hover:file:bg-[#7C3AED]/30"
            />

            {/* Description */}
            <input
              type="text"
              value={photoDesc}
              onChange={e => setPhotoDesc(e.target.value)}
              placeholder="Caption / description (optional)"
              className="w-full p-3 rounded-xl bg-[#1f1f35] text-white placeholder-gray-600 border border-gray-700 focus:ring-2 focus:ring-[#7C3AED] outline-none"
            />

            <button
              type="submit"
              disabled={uploadingPhoto || !photoFile || !photoUploadCategory}
              className="w-full bg-[#7C3AED] py-3 rounded-xl font-black uppercase tracking-widest hover:bg-[#6D28D9] transition disabled:opacity-50"
            >
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </button>
          </form>
        )}

        <div className="flex gap-3 mb-6 flex-wrap">
          {PHOTO_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setPhotoCategory(c)}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${photoCategory === c ? "bg-[#7C3AED] text-white" : "bg-[#1f1f35] text-gray-300 hover:bg-[#7C3AED]/20"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {photoLoading ? (
          <p className="text-gray-400">Loading photos...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.filter(p => {
              const cat = (p.category || p.event?.category || "").toLowerCase();
              return photoCategory === "All" || cat === photoCategory.toLowerCase();
            }).length === 0 && (
              <div className="text-gray-400 col-span-full">No photos for {photoCategory}.</div>
            )}
            {photos.filter(p => {
              const cat = (p.category || p.event?.category || "").toLowerCase();
              return photoCategory === "All" || cat === photoCategory.toLowerCase();
            }).map((p) => (
              <div key={p._id} className="bg-[#141428] rounded-xl overflow-hidden border border-gray-800 group relative">
                <img src={p.url} alt={p.description || "photo"} className="w-full h-44 object-cover" />
                {user?.role === 'admin' && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('Delete this photo?')) return;
                      try {
                        const token = localStorage.getItem('token');
                        await axios.delete(`http://localhost:3000/api/photos/${p._id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        setPhotos(prev => prev.filter(x => x._id !== p._id));
                      } catch { toast.error('Failed to delete photo'); }
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Delete photo"
                  >
                    ✕
                  </button>
                )}
                <div className="p-3">
                  <div className="text-sm text-gray-300 font-semibold">{p.description || p.event?.title || "Posted Photo"}</div>
                  {(p.category || p.event?.category) && (
                    <div className="text-xs text-[#A78BFA] mt-1 font-bold uppercase tracking-widest">{p.category || p.event?.category}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SAVE MODAL */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#141428] p-6 rounded-2xl w-96">
            <h2 className="text-xl font-bold mb-4">Save to Event</h2>
            {!creating ? (
              <>
                {myEvents.map(event => (
                  <button key={event._id} onClick={() => handleAddToEvent(event)} className="w-full text-left bg-[#1f1f35] p-3 rounded-xl mb-2 hover:bg-[#7C3AED]">
                    {event.name}
                  </button>
                ))}
                <button onClick={() => setCreating(true)} className="w-full bg-[#7C3AED] p-3 rounded-xl mt-2">+ Create New Event</button>
              </>
            ) : (
              <>
                <input value={newEventName} onChange={(e) => setNewEventName(e.target.value)} placeholder="Event name..." className="w-full bg-[#1f1f35] p-3 rounded-xl mb-3" />
                <button onClick={handleCreateEvent} className="w-full bg-[#7C3AED] p-3 rounded-xl">Create Event</button>
              </>
            )}
            <button onClick={closeModal} className="mt-4 text-gray-400">Cancel</button>
          </div>
        </div>
      )}

      {/* CONTACT */}
      <section ref={contactRef} className="px-8 md:px-16 py-16 bg-gradient-to-r from-[#0f1724] to-[#141428]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-4 text-[#7C3AED]">Get in Touch</h2>
            <p className="text-gray-300 mb-6">Have questions or want to collaborate? Send us a message and we'll get back to you shortly.</p>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-bold">P</div>
                <div>
                  <div className="font-semibold">Phone</div>
                  <div className="text-sm text-gray-400">+216 55 55 55 55</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-bold">E</div>
                <div>
                  <div className="font-semibold">Email</div>
                  <div className="text-sm text-gray-400">contact@axiaeventplanner.com</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-[#0b0f1a] p-6 rounded-2xl border border-gray-800">
              <input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full mb-3 p-3 rounded-xl bg-[#11121a] text-white" placeholder="Your name" />
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full mb-3 p-3 rounded-xl bg-[#11121a] text-white" placeholder="Email address" />
              <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} className="w-full mb-3 p-3 rounded-xl bg-[#11121a] text-white" rows={5} placeholder="How can we help?" />
              <button onClick={handleContactSubmit} disabled={sendingContact} className="w-full bg-[#7C3AED] p-3 rounded-xl text-white">{sendingContact ? 'Sending...' : 'Send Message'}</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}