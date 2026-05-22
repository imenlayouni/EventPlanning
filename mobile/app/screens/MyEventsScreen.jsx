import { useState, useEffect, useCallback } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Alert, Modal, TextInput, FlatList
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { fixUrl } from "../utils";

export default function MyEventsScreen({ navigation }) {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [newEventName, setNewEventName] = useState("");
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");

    useFocusEffect(useCallback(() => { fetchEvents(); }, []));

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await api.get("/events/my");
            setEvents(res.data || []);
        } catch (err) {
            Alert.alert("Error", "Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEventName.trim()) return;
        setCreating(true);
        try {
            const res = await api.post("/events", { name: newEventName.trim() });
            setEvents(prev => [...prev, res.data]);
            setNewEventName("");
            setShowNewEventModal(false);
        } catch (err) {
            Alert.alert("Error", "Failed to create event");
        } finally {
            setCreating(false);
        }
    };

    const handleRemoveService = (eventId, serviceId, serviceName) => {
        Alert.alert(
            "Remove Service",
            `Remove "${serviceName}" from this event?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove", style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete("/events/remove-service", { data: { eventId, serviceId } });
                            setEvents(prev => prev.map(e =>
                                e._id === eventId
                                    ? { ...e, services: e.services.filter(s => s._id !== serviceId) }
                                    : e
                            ));
                        } catch (err) {
                            Alert.alert("Error", "Failed to remove service");
                        }
                    }
                }
            ]
        );
    };

    const calculateTotal = (services = []) =>
        services.reduce((acc, s) => acc + (parseFloat(String(s.price || "0").replace(/[^0-9.]/g, "")) || 0), 0);

    const filteredEvents = events.filter(e =>
        !search || e.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <View style={s.centered}>
            <ActivityIndicator color="#7C3AED" size="large" />
        </View>
    );

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>My Events</Text>
                    <Text style={s.headerSub}>{events.length} event{events.length !== 1 ? "s" : ""} planned</Text>
                </View>
                <TouchableOpacity style={s.newEventBtn} onPress={() => setShowNewEventModal(true)}>
                    <Text style={s.newEventBtnText}>+ New</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <TextInput
                style={s.search}
                placeholder="Search events..."
                placeholderTextColor="#4b5563"
                value={search}
                onChangeText={setSearch}
            />

            {/* Events List */}
            {filteredEvents.length === 0 ? (
                <View style={s.emptyState}>
                    <Text style={s.emptyEmoji}>🎉</Text>
                    <Text style={s.emptyTitle}>No events yet</Text>
                    <Text style={s.emptySub}>Create your first event and start adding services.</Text>
                    <TouchableOpacity style={s.emptyCreateBtn} onPress={() => setShowNewEventModal(true)}>
                        <Text style={s.emptyCreateBtnText}>Create Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.emptyExploreBtn} onPress={() => navigation.navigate("FeedTab")}>
                        <Text style={s.emptyExploreBtnText}>Explore Services</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    onRefresh={fetchEvents}
                    refreshing={loading}
                    renderItem={({ item: event }) => {
                        const total = calculateTotal(event.services);
                        return (
                            <View style={s.eventCard}>
                                {/* Event header */}
                                <View style={s.eventCardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.eventName}>{event.name}</Text>
                                        <Text style={s.eventServiceCount}>{event.services?.length || 0} services</Text>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={s.eventTotalLabel}>Total</Text>
                                        <Text style={s.eventTotal}>{total.toLocaleString()} TND</Text>
                                    </View>
                                </View>

                                {/* Services */}
                                {!event.services || event.services.length === 0 ? (
                                    <View style={s.noServicesBox}>
                                        <Text style={s.noServicesText}>No services yet.</Text>
                                        <TouchableOpacity onPress={() => navigation.navigate("FeedTab")}>
                                            <Text style={s.browseLink}>Browse services →</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    event.services.map(service => (
                                        <View key={service._id} style={s.serviceRow}>
                                            {service.images?.[0] ? (
                                                <Image source={{ uri: fixUrl(service.images[0]) }} style={s.serviceThumb} />
                                            ) : (
                                                <View style={s.serviceThumbPlaceholder}>
                                                    <Text style={{ color: "#4b5563", fontSize: 18 }}>🎪</Text>
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                style={{ flex: 1 }}
                                                onPress={() => navigation.navigate("ListingDetails", { listing: service })}
                                            >
                                                <Text style={s.serviceName}>{service.title}</Text>
                                                <Text style={s.serviceMeta}>{service.category} • {service.organizer?.firstName}</Text>
                                                <Text style={s.servicePrice}>{service.price}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={s.removeBtn}
                                                onPress={() => handleRemoveService(event._id, service._id, service.title)}
                                            >
                                                <Text style={s.removeBtnText}>🗑</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                        );
                    }}
                />
            )}

            {/* New Event Modal */}
            <Modal visible={showNewEventModal} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalBox}>
                        <View style={s.modalBoxHeader}>
                            <Text style={s.modalBoxTitle}>Create New Event</Text>
                            <TouchableOpacity onPress={() => { setShowNewEventModal(false); setNewEventName(""); }}>
                                <Text style={s.modalBoxClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={s.fieldLabel}>Event Name</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. Sarah's Wedding, Tech Conference..."
                            placeholderTextColor="#4b5563"
                            value={newEventName}
                            onChangeText={setNewEventName}
                            autoFocus
                        />
                        <View style={s.modalBtns}>
                            <TouchableOpacity
                                style={s.modalCancelBtn}
                                onPress={() => { setShowNewEventModal(false); setNewEventName(""); }}
                            >
                                <Text style={s.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modalConfirmBtn, (!newEventName.trim() || creating) && s.btnDisabled]}
                                onPress={handleCreateEvent}
                                disabled={!newEventName.trim() || creating}
                            >
                                <Text style={s.modalConfirmText}>{creating ? "Creating..." : "Create"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16" },
    centered: { flex: 1, backgroundColor: "#0b0b16", justifyContent: "center", alignItems: "center" },

    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, paddingTop: 56 },
    headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
    headerSub: { color: "#6b7280", fontSize: 13, marginTop: 2 },
    newEventBtn: { backgroundColor: "#7C3AED", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 9 },
    newEventBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

    search: { backgroundColor: "#141428", borderRadius: 14, padding: 13, color: "#fff", marginHorizontal: 20, marginBottom: 8, fontSize: 14, borderWidth: 1, borderColor: "#1f1f35" },

    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 6 },
    emptySub: { color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
    emptyCreateBtn: { backgroundColor: "#7C3AED", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12, marginBottom: 10 },
    emptyCreateBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    emptyExploreBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "#7C3AED40" },
    emptyExploreBtnText: { color: "#A78BFA", fontWeight: "700", fontSize: 14 },

    eventCard: { backgroundColor: "#141428", borderRadius: 20, borderWidth: 1, borderColor: "#1f1f35", marginBottom: 16, overflow: "hidden" },
    eventCardHeader: { flexDirection: "row", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1f1f35", backgroundColor: "#1a1a2e" },
    eventName: { color: "#fff", fontSize: 17, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
    eventServiceCount: { color: "#6b7280", fontSize: 12, marginTop: 2 },
    eventTotalLabel: { color: "#6b7280", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
    eventTotal: { color: "#A78BFA", fontSize: 17, fontWeight: "900" },

    noServicesBox: { padding: 20, alignItems: "center" },
    noServicesText: { color: "#6b7280", fontSize: 13, marginBottom: 6 },
    browseLink: { color: "#A78BFA", fontWeight: "700", fontSize: 13 },

    serviceRow: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderTopColor: "#1f1f35", gap: 12 },
    serviceThumb: { width: 52, height: 52, borderRadius: 12, resizeMode: "cover" },
    serviceThumbPlaceholder: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#1f1f35", justifyContent: "center", alignItems: "center" },
    serviceName: { color: "#fff", fontWeight: "700", fontSize: 14, marginBottom: 2 },
    serviceMeta: { color: "#6b7280", fontSize: 11, marginBottom: 2 },
    servicePrice: { color: "#A78BFA", fontWeight: "800", fontSize: 13 },
    removeBtn: { padding: 8 },
    removeBtnText: { fontSize: 18 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    modalBox: { backgroundColor: "#141428", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: "#1f1f35" },
    modalBoxHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    modalBoxTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
    modalBoxClose: { color: "#6b7280", fontSize: 18 },
    fieldLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    input: { backgroundColor: "#0b0b16", borderRadius: 14, padding: 14, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 14 },
    modalBtns: { flexDirection: "row", gap: 12, marginTop: 20 },
    modalCancelBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#1f1f35", alignItems: "center" },
    modalCancelText: { color: "#6b7280", fontWeight: "700" },
    modalConfirmBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: "#7C3AED", alignItems: "center" },
    modalConfirmText: { color: "#fff", fontWeight: "800" },
    btnDisabled: { opacity: 0.4 },
});
