import { useState, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Alert, Modal, TextInput
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { fixUrl } from "../utils";

export default function ListingDetailsScreen({ route, navigation }) {
    const { listing: initial } = route.params;
    const { user } = useAuth();

    const [listing, setListing] = useState(initial);
    const [reviews, setReviews] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(true);

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showAddToEventModal, setShowAddToEventModal] = useState(false);
    const [showNewEventInput, setShowNewEventInput] = useState(false);
    const [newEventName, setNewEventName] = useState("");

    const [requestForm, setRequestForm] = useState({
        requestType: "custom", description: "", suggestedPrice: "", startDate: ""
    });
    const [formAnswers, setFormAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);

    const isParticipant = user?.role === "participant";
    const ownerId = listing.organizer?._id || listing.organizer;
    const userId = user?._id || user?.id;
    const isOwner = ownerId === userId;

    useEffect(() => {
        fetchFull();
        if (isParticipant) fetchMyEvents();
    }, []);

    const fetchFull = async () => {
        try {
            const [listRes, revRes] = await Promise.all([
                api.get(`/listings/${listing._id}`),
                api.get(`/reviews/provider/${listing.organizer?._id || listing.organizer}`)
            ]);
            setListing(listRes.data);
            setReviews(revRes.data || []);
        } catch (err) {
        } finally {
            setLoadingDetails(false);
        }
    };

    const fetchMyEvents = async () => {
        try {
            const res = await api.get("/events/my");
            setMyEvents(res.data || []);
        } catch (err) {}
    };

    const handleAddToEvent = async (eventId) => {
        try {
            await api.post("/events/add-service", { eventId, serviceId: listing._id });
            setShowAddToEventModal(false);
            Alert.alert("Added!", "Service added to your event.");
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to add service");
        }
    };

    const handleCreateAndAdd = async () => {
        if (!newEventName.trim()) return;
        try {
            const res = await api.post("/events", { name: newEventName.trim() });
            await api.post("/events/add-service", { eventId: res.data._id, serviceId: listing._id });
            setShowAddToEventModal(false);
            setShowNewEventInput(false);
            setNewEventName("");
            Alert.alert("Done!", `Event "${newEventName.trim()}" created and service added.`);
            fetchMyEvents();
        } catch (err) {
            Alert.alert("Error", "Failed to create event");
        }
    };

    const handleSubmitRequest = async () => {
        if (!requestForm.description.trim()) {
            Alert.alert("Required", "Please describe your request.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/service-requests", {
                provider: listing.organizer?._id || listing.organizer,
                listing: listing._id,
                requestType: requestForm.requestType,
                description: requestForm.description,
                suggestedPrice: requestForm.suggestedPrice ? Number(requestForm.suggestedPrice) : null,
                startDate: requestForm.startDate || undefined,
                endDate: requestForm.startDate || undefined,
                formAnswers: Object.entries(formAnswers).map(([label, value]) => ({ label, value }))
            });
            setShowRequestModal(false);
            setRequestForm({ requestType: "custom", description: "", suggestedPrice: "", startDate: "" });
            setFormAnswers({});
            Alert.alert("Sent!", "Your request has been submitted successfully.");
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to send request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewForm.comment.trim()) {
            Alert.alert("Required", "Please write a comment.");
            return;
        }
        setSubmittingReview(true);
        try {
            const res = await api.post(`/reviews/provider/${listing.organizer?._id || listing.organizer}`, {
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                listingId: listing._id
            });
            setReviews(prev => [res.data, ...prev]);
            setReviewForm({ rating: 5, comment: "" });
            Alert.alert("Thanks!", "Your review has been submitted.");
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const REQUEST_TYPES = [
        { value: "custom", label: "✏️ Custom" },
        { value: "price_change", label: "💰 Price" },
        { value: "add_item", label: "➕ Add Item" },
        { value: "remove_item", label: "➖ Remove" },
    ];

    return (
        <View style={s.container}>
            {/* Top bar */}
            <View style={s.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Text style={s.backText}>← Back</Text>
                </TouchableOpacity>
            </View>

            {loadingDetails ? (
                <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Images */}
                    {listing.images?.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imageScroll}>
                            {listing.images.map((img, i) => (
                                <Image key={i} source={{ uri: fixUrl(img) }} style={s.image} />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={s.imagePlaceholder}>
                            <Text style={s.imagePlaceholderText}>No Image</Text>
                        </View>
                    )}

                    <View style={s.body}>
                        {/* Category badge + title */}
                        <Text style={s.category}>{listing.category}</Text>
                        <Text style={s.title}>{listing.title}</Text>
                        <Text style={s.location}>📍 {listing.location}</Text>
                        <Text style={s.price}>{listing.price}</Text>

                        {/* Description */}
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>About this Service</Text>
                            <Text style={s.description}>{listing.description}</Text>
                            {listing.assets ? (
                                <>
                                    <Text style={[s.sectionTitle, { marginTop: 16 }]}>What's Included</Text>
                                    <Text style={s.description}>{listing.assets}</Text>
                                </>
                            ) : null}
                        </View>

                        {/* Provider card */}
                        <View style={s.providerCard}>
                            <View style={s.providerAvatar}>
                                <Text style={s.providerAvatarText}>{listing.organizer?.firstName?.[0] || "?"}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.providerName}>{listing.organizer?.firstName} {listing.organizer?.lastName}</Text>
                                <Text style={s.providerLabel}>Service Provider</Text>
                                {listing.organizer?.email && <Text style={s.providerEmail}>{listing.organizer.email}</Text>}
                            </View>
                        </View>

                        {/* Action buttons */}
                        {!isOwner && (
                            <View style={s.actions}>
                                {isParticipant && (
                                    <TouchableOpacity
                                        style={s.addToEventBtn}
                                        onPress={() => { fetchMyEvents(); setShowAddToEventModal(true); }}
                                    >
                                        <Text style={s.addToEventBtnText}>+ Add to Event</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={s.requestBtn} onPress={() => setShowRequestModal(true)}>
                                    <Text style={s.requestBtnText}>📋 Make a Request</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Reviews */}
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>
                                Reviews {avgRating ? `(${reviews.length} • ⭐ ${avgRating})` : `(${reviews.length})`}
                            </Text>

                            {!isOwner && (
                                <View style={s.reviewForm}>
                                    <Text style={s.reviewFormLabel}>Leave a Review</Text>
                                    <View style={s.starsRow}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <TouchableOpacity key={star} onPress={() => setReviewForm({ ...reviewForm, rating: star })}>
                                                <Text style={[s.star, star <= reviewForm.rating && s.starActive]}>★</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        style={s.reviewInput}
                                        placeholder="Share your experience..."
                                        placeholderTextColor="#4b5563"
                                        value={reviewForm.comment}
                                        onChangeText={t => setReviewForm({ ...reviewForm, comment: t })}
                                        multiline
                                        numberOfLines={3}
                                    />
                                    <TouchableOpacity
                                        style={[s.reviewSubmitBtn, submittingReview && s.btnDisabled]}
                                        onPress={handleSubmitReview}
                                        disabled={submittingReview}
                                    >
                                        <Text style={s.reviewSubmitText}>{submittingReview ? "Submitting..." : "Submit Review"}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {reviews.length === 0 ? (
                                <Text style={s.noReviews}>No reviews yet for this provider.</Text>
                            ) : (
                                reviews.map(r => (
                                    <View key={r._id} style={s.reviewCard}>
                                        <View style={s.reviewHeader}>
                                            <View style={s.reviewAvatar}>
                                                <Text style={s.reviewAvatarText}>{r.user?.firstName?.[0] || "?"}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.reviewerName}>{r.user?.firstName} {r.user?.lastName}</Text>
                                                <Text style={s.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                            <Text style={s.reviewStars}>{"⭐".repeat(r.rating)}</Text>
                                        </View>
                                        <Text style={s.reviewComment}>{r.comment}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* ── Request Modal ── */}
            <Modal visible={showRequestModal} animationType="slide" presentationStyle="pageSheet">
                <View style={s.modal}>
                    <View style={s.modalHeader}>
                        <View>
                            <Text style={s.modalTitle}>Make a Request</Text>
                            <Text style={s.modalSub}>To: {listing.organizer?.firstName} • {listing.title}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowRequestModal(false)} style={s.modalCloseBtn}>
                            <Text style={s.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
                        <Text style={s.fieldLabel}>Request Type</Text>
                        <View style={s.typeRow}>
                            {REQUEST_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[s.typeBtn, requestForm.requestType === t.value && s.typeBtnActive]}
                                    onPress={() => setRequestForm({ ...requestForm, requestType: t.value })}
                                >
                                    <Text style={[s.typeBtnText, requestForm.requestType === t.value && s.typeBtnTextActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={s.fieldLabel}>Description *</Text>
                        <TextInput
                            style={s.textarea}
                            placeholder="Describe what you need..."
                            placeholderTextColor="#4b5563"
                            value={requestForm.description}
                            onChangeText={t => setRequestForm({ ...requestForm, description: t })}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        {requestForm.requestType === "price_change" && (
                            <>
                                <Text style={s.fieldLabel}>Suggested Price (TND) — Optional</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="e.g. 500"
                                    placeholderTextColor="#4b5563"
                                    keyboardType="numeric"
                                    value={requestForm.suggestedPrice}
                                    onChangeText={t => setRequestForm({ ...requestForm, suggestedPrice: t })}
                                />
                            </>
                        )}

                        <Text style={s.fieldLabel}>Preferred Date (YYYY-MM-DD) — Optional</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. 2026-08-15"
                            placeholderTextColor="#4b5563"
                            value={requestForm.startDate}
                            onChangeText={t => setRequestForm({ ...requestForm, startDate: t })}
                        />

                        {/* Dynamic fields */}
                        {listing.fields?.length > 0 && (
                            <View style={s.dynamicSection}>
                                <Text style={s.dynamicSectionTitle}>Service Details</Text>
                                {listing.fields.map((field, idx) => (
                                    <View key={idx} style={{ marginBottom: 14 }}>
                                        <Text style={s.fieldLabel}>{field.label}{field.required ? " *" : ""}</Text>
                                        {(field.type === "text") && (
                                            <TextInput style={s.input} placeholder={field.label} placeholderTextColor="#4b5563"
                                                value={formAnswers[field.label] || ""}
                                                onChangeText={t => setFormAnswers(p => ({ ...p, [field.label]: t }))} />
                                        )}
                                        {(field.type === "number") && (
                                            <TextInput style={s.input} placeholder={field.label} placeholderTextColor="#4b5563"
                                                keyboardType="numeric"
                                                value={formAnswers[field.label] || ""}
                                                onChangeText={t => setFormAnswers(p => ({ ...p, [field.label]: t }))} />
                                        )}
                                        {(field.type === "dropdown" || field.type === "multi-select") && (
                                            <View style={s.optionsWrap}>
                                                {field.options?.map((opt, oi) => {
                                                    const isMulti = field.type === "multi-select";
                                                    const selected = isMulti
                                                        ? (formAnswers[field.label] || "").split(",").filter(Boolean).includes(opt)
                                                        : formAnswers[field.label] === opt;
                                                    return (
                                                        <TouchableOpacity key={oi}
                                                            style={[s.optBtn, selected && s.optBtnActive]}
                                                            onPress={() => {
                                                                if (isMulti) {
                                                                    const cur = (formAnswers[field.label] || "").split(",").filter(Boolean);
                                                                    const upd = selected ? cur.filter(o => o !== opt) : [...cur, opt];
                                                                    setFormAnswers(p => ({ ...p, [field.label]: upd.join(",") }));
                                                                } else {
                                                                    setFormAnswers(p => ({ ...p, [field.label]: opt }));
                                                                }
                                                            }}
                                                        >
                                                            <Text style={[s.optBtnText, selected && s.optBtnTextActive]}>{opt}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        )}
                                        {field.type === "checkbox" && (
                                            <TouchableOpacity style={s.checkRow}
                                                onPress={() => setFormAnswers(p => ({ ...p, [field.label]: p[field.label] === "true" ? "false" : "true" }))}>
                                                <View style={[s.checkBox, formAnswers[field.label] === "true" && s.checkBoxChecked]} />
                                                <Text style={s.checkLabel}>Yes</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[s.submitBtn, submitting && s.btnDisabled]}
                            onPress={handleSubmitRequest}
                            disabled={submitting}
                        >
                            <Text style={s.submitBtnText}>{submitting ? "Sending..." : "Submit Request"}</Text>
                        </TouchableOpacity>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* ── Add to Event Modal ── */}
            <Modal visible={showAddToEventModal} animationType="slide" presentationStyle="pageSheet">
                <View style={s.modal}>
                    <View style={s.modalHeader}>
                        <Text style={s.modalTitle}>Add to Event</Text>
                        <TouchableOpacity onPress={() => { setShowAddToEventModal(false); setShowNewEventInput(false); setNewEventName(""); }} style={s.modalCloseBtn}>
                            <Text style={s.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={s.modalBody}>
                        {myEvents.length > 0 && (
                            <>
                                <Text style={s.fieldLabel}>Choose an existing event</Text>
                                {myEvents.map(ev => (
                                    <TouchableOpacity key={ev._id} style={s.eventPickerItem} onPress={() => handleAddToEvent(ev._id)}>
                                        <Text style={s.eventPickerName}>{ev.name}</Text>
                                        <Text style={s.eventPickerCount}>{ev.services?.length || 0} services</Text>
                                    </TouchableOpacity>
                                ))}
                                <View style={s.divider} />
                            </>
                        )}

                        <Text style={s.fieldLabel}>Or create a new event</Text>
                        {!showNewEventInput ? (
                            <TouchableOpacity style={s.createEventBtn} onPress={() => setShowNewEventInput(true)}>
                                <Text style={s.createEventBtnText}>+ Create New Event</Text>
                            </TouchableOpacity>
                        ) : (
                            <View>
                                <TextInput
                                    style={s.input}
                                    placeholder="Event name..."
                                    placeholderTextColor="#4b5563"
                                    value={newEventName}
                                    onChangeText={setNewEventName}
                                    autoFocus
                                />
                                <TouchableOpacity
                                    style={[s.submitBtn, !newEventName.trim() && s.btnDisabled]}
                                    onPress={handleCreateAndAdd}
                                    disabled={!newEventName.trim()}
                                >
                                    <Text style={s.submitBtnText}>Create & Add</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16" },
    topBar: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center" },
    backBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#141428", borderRadius: 12, borderWidth: 1, borderColor: "#1f1f35" },
    backText: { color: "#A78BFA", fontWeight: "700", fontSize: 14 },

    imageScroll: { marginBottom: 4 },
    image: { width: 300, height: 200, resizeMode: "cover", marginRight: 8 },
    imagePlaceholder: { height: 200, backgroundColor: "#141428", justifyContent: "center", alignItems: "center" },
    imagePlaceholderText: { color: "#4b5563", fontSize: 14 },

    body: { padding: 20 },
    category: { backgroundColor: "#7C3AED20", color: "#A78BFA", fontSize: 10, fontWeight: "900", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start", textTransform: "uppercase", letterSpacing: 1, borderWidth: 1, borderColor: "#7C3AED30", marginBottom: 10 },
    title: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 6 },
    location: { color: "#6b7280", fontSize: 13, marginBottom: 4 },
    price: { color: "#A78BFA", fontSize: 22, fontWeight: "900", marginBottom: 16 },

    section: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#1f1f35", paddingTop: 20 },
    sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 10 },
    description: { color: "#9ca3af", fontSize: 14, lineHeight: 22 },

    providerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#141428", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#1f1f35", gap: 12, marginTop: 16 },
    providerAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#7C3AED20", borderWidth: 1, borderColor: "#7C3AED40", justifyContent: "center", alignItems: "center" },
    providerAvatarText: { color: "#A78BFA", fontWeight: "900", fontSize: 16 },
    providerName: { color: "#fff", fontWeight: "800", fontSize: 15 },
    providerLabel: { color: "#6b7280", fontSize: 11, marginTop: 1 },
    providerEmail: { color: "#6b7280", fontSize: 11, marginTop: 2 },

    actions: { flexDirection: "column", gap: 10, marginTop: 20 },
    addToEventBtn: { backgroundColor: "#1f1f35", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#7C3AED40" },
    addToEventBtnText: { color: "#A78BFA", fontWeight: "800", fontSize: 15 },
    requestBtn: { backgroundColor: "#7C3AED", borderRadius: 14, padding: 14, alignItems: "center" },
    requestBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

    reviewForm: { backgroundColor: "#141428", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#1f1f35", marginBottom: 16 },
    reviewFormLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
    starsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    star: { fontSize: 28, color: "#374151" },
    starActive: { color: "#f59e0b" },
    reviewInput: { backgroundColor: "#0b0b16", borderRadius: 12, padding: 12, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 14, marginBottom: 10, minHeight: 80, textAlignVertical: "top" },
    reviewSubmitBtn: { backgroundColor: "#7C3AED", borderRadius: 12, padding: 12, alignItems: "center" },
    reviewSubmitText: { color: "#fff", fontWeight: "800", fontSize: 13 },

    noReviews: { color: "#6b7280", fontStyle: "italic", fontSize: 13 },
    reviewCard: { backgroundColor: "#141428", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f1f35", marginBottom: 10 },
    reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    reviewAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#7C3AED20", borderWidth: 1, borderColor: "#7C3AED30", justifyContent: "center", alignItems: "center" },
    reviewAvatarText: { color: "#A78BFA", fontWeight: "900", fontSize: 14 },
    reviewerName: { color: "#fff", fontWeight: "700", fontSize: 13 },
    reviewDate: { color: "#6b7280", fontSize: 11 },
    reviewStars: { fontSize: 13 },
    reviewComment: { color: "#9ca3af", fontSize: 13, lineHeight: 20 },

    // Modal
    modal: { flex: 1, backgroundColor: "#0b0b16" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: "#1f1f35" },
    modalTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
    modalSub: { color: "#6b7280", fontSize: 12, marginTop: 3 },
    modalCloseBtn: { padding: 8 },
    modalCloseText: { color: "#6b7280", fontSize: 18 },
    modalBody: { flex: 1, padding: 20 },

    fieldLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: "#141428", borderRadius: 12, padding: 14, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 14 },
    textarea: { backgroundColor: "#141428", borderRadius: 12, padding: 14, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 14, minHeight: 100, textAlignVertical: "top" },

    typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    typeBtn: { backgroundColor: "#141428", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#1f1f35" },
    typeBtnActive: { backgroundColor: "#7C3AED30", borderColor: "#7C3AED" },
    typeBtnText: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
    typeBtnTextActive: { color: "#A78BFA" },

    dynamicSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#1f1f35", paddingTop: 12 },
    dynamicSectionTitle: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },

    optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    optBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: "#141428", borderWidth: 1, borderColor: "#1f1f35" },
    optBtnActive: { backgroundColor: "#7C3AED30", borderColor: "#7C3AED" },
    optBtnText: { color: "#6b7280", fontSize: 13, fontWeight: "700" },
    optBtnTextActive: { color: "#A78BFA" },

    checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: "#1f1f35" },
    checkBoxChecked: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
    checkLabel: { color: "#9ca3af", fontSize: 14 },

    submitBtn: { backgroundColor: "#7C3AED", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 20 },
    submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 1 },
    btnDisabled: { opacity: 0.4 },

    // Add to event modal
    eventPickerItem: { backgroundColor: "#141428", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f1f35", marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    eventPickerName: { color: "#fff", fontWeight: "700", fontSize: 15 },
    eventPickerCount: { color: "#6b7280", fontSize: 12 },
    divider: { height: 1, backgroundColor: "#1f1f35", marginVertical: 20 },
    createEventBtn: { backgroundColor: "#141428", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#7C3AED40" },
    createEventBtnText: { color: "#A78BFA", fontWeight: "800", fontSize: 15 },
});
