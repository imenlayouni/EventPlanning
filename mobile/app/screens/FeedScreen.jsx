import { useEffect, useState, useCallback } from "react";
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, TextInput, Image, ActivityIndicator,
    Alert, ScrollView
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { fixUrl } from "../utils";

export default function FeedScreen({ navigation }) {
    const { user } = useAuth();

    // All listings
    const [listings, setListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(true);
    const [search, setSearch] = useState("");

    // Recommendations
    const [recs, setRecs] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [recSearch, setRecSearch] = useState("");
    const [recError, setRecError] = useState(null);

    useEffect(() => {
        fetchListings();
        fetchRecs("");
    }, []);

    const fetchListings = async () => {
        try {
            setLoadingListings(true);
            const res = await api.get("/listings");
            setListings(res.data || []);
        } catch (err) {
            Alert.alert("Error", "Failed to load services");
        } finally {
            setLoadingListings(false);
        }
    };

    const fetchRecs = async (term = "") => {
        try {
            setLoadingRecs(true);
            setRecError(null);
            const res = await api.post("/recommendations", { search: term });
            setRecs(res.data || []);
        } catch (err) {
            setRecError("Could not load recommendations.");
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleRecSearch = () => {
        fetchRecs(recSearch.trim());
    };

    const filtered = listings.filter(l =>
        !search ||
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.category?.toLowerCase().includes(search.toLowerCase()) ||
        l.location?.toLowerCase().includes(search.toLowerCase())
    );

    const ListHeader = () => (
        <View>
            {/* AI Recommendations section */}
            <View style={s.recsSection}>
                <View style={s.recsSectionHeader}>
                    <View>
                        <Text style={s.recsSectionTitle}>✨ For You</Text>
                        <Text style={s.recsSectionSub}>AI-powered picks based on your profile</Text>
                    </View>
                    <TouchableOpacity
                        style={[s.refreshBtn, loadingRecs && s.btnDisabled]}
                        onPress={() => fetchRecs(recSearch.trim())}
                        disabled={loadingRecs}
                    >
                        <Text style={s.refreshBtnText}>↻</Text>
                    </TouchableOpacity>
                </View>

                {/* AI search */}
                <View style={s.recSearchRow}>
                    <TextInput
                        style={s.recSearchInput}
                        placeholder="Search with AI... (e.g. wedding photography)"
                        placeholderTextColor="#4b5563"
                        value={recSearch}
                        onChangeText={setRecSearch}
                        onSubmitEditing={handleRecSearch}
                        returnKeyType="search"
                    />
                    <TouchableOpacity style={s.recSearchBtn} onPress={handleRecSearch}>
                        <Text style={s.recSearchBtnText}>Go</Text>
                    </TouchableOpacity>
                </View>

                {loadingRecs ? (
                    <View style={s.recsLoading}>
                        <ActivityIndicator color="#7C3AED" size="small" />
                        <Text style={s.recsLoadingText}>Asking AI...</Text>
                    </View>
                ) : recError ? (
                    <Text style={s.recErrorText}>{recError}</Text>
                ) : recs.length === 0 ? (
                    <Text style={s.recEmptyText}>No recommendations yet. Try a search above.</Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.recsScroll} contentContainerStyle={s.recsScrollContent}>
                        {recs.map(item => (
                            <TouchableOpacity
                                key={item._id}
                                style={s.recCard}
                                onPress={() => navigation.navigate("ListingDetails", { listing: item })}
                            >
                                {item.images?.[0] ? (
                                    <Image source={{ uri: fixUrl(item.images[0]) }} style={s.recImage} />
                                ) : (
                                    <View style={s.recImagePlaceholder}>
                                        <Text style={{ color: "#4b5563", fontSize: 24 }}>✨</Text>
                                    </View>
                                )}
                                <View style={s.recCardBody}>
                                    <Text style={s.recCategory}>{item.category}</Text>
                                    <Text style={s.recTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={s.recPrice}>{item.price}</Text>
                                    {item.reason ? (
                                        <View style={s.reasonBox}>
                                            <Text style={s.reasonText} numberOfLines={2}>💡 {item.reason}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Divider + all services header */}
            <View style={s.allServicesHeader}>
                <Text style={s.allServicesTitle}>All Services</Text>
                <Text style={s.allServicesCount}>{filtered.length} available</Text>
            </View>

            {/* Main search */}
            <TextInput
                style={s.search}
                placeholder="Filter services..."
                placeholderTextColor="#4b5563"
                value={search}
                onChangeText={setSearch}
            />
        </View>
    );

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Axia Event Planner</Text>
                <Text style={s.headerSub}>Hi, {user?.firstName} 👋</Text>
            </View>

            {loadingListings ? (
                <>
                    <ListHeader />
                    <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 24 }} />
                </>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={s.card}
                            onPress={() => navigation.navigate("ListingDetails", { listing: item })}
                        >
                            {item.images?.[0] ? (
                                <Image source={{ uri: fixUrl(item.images[0]) }} style={s.image} />
                            ) : (
                                <View style={s.imagePlaceholder}>
                                    <Text style={s.imagePlaceholderText}>No Image</Text>
                                </View>
                            )}
                            <View style={s.cardBody}>
                                <View style={s.cardHeader}>
                                    <Text style={s.category}>{item.category}</Text>
                                    <Text style={s.price}>{item.price}</Text>
                                </View>
                                <Text style={s.title}>{item.title}</Text>
                                <Text style={s.organizer}>{item.organizer?.firstName} {item.organizer?.lastName}</Text>
                                <Text style={s.location}>📍 {item.location}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListHeaderComponent={<ListHeader />}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={s.empty}>No services found.</Text>}
                    refreshing={loadingListings}
                    onRefresh={fetchListings}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16" },
    header: { padding: 24, paddingTop: 56, paddingBottom: 12 },
    headerTitle: { color: "#7C3AED", fontSize: 20, fontWeight: "900" },
    headerSub: { color: "#9ca3af", fontSize: 13, marginTop: 2 },

    // Recommendations
    recsSection: { paddingHorizontal: 20, marginBottom: 8 },
    recsSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    recsSectionTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
    recsSectionSub: { color: "#6b7280", fontSize: 11, marginTop: 2 },
    refreshBtn: { backgroundColor: "#7C3AED20", borderRadius: 10, width: 34, height: 34, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#7C3AED30" },
    refreshBtnText: { color: "#A78BFA", fontSize: 18, fontWeight: "700" },
    btnDisabled: { opacity: 0.4 },

    recSearchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    recSearchInput: { flex: 1, backgroundColor: "#141428", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#fff", borderWidth: 1, borderColor: "#7C3AED30", fontSize: 13 },
    recSearchBtn: { backgroundColor: "#7C3AED", borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
    recSearchBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

    recsLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
    recsLoadingText: { color: "#6b7280", fontSize: 13 },
    recErrorText: { color: "#ef4444", fontSize: 12, paddingVertical: 8 },
    recEmptyText: { color: "#4b5563", fontSize: 12, paddingVertical: 8, fontStyle: "italic" },

    recsScroll: { marginHorizontal: -20 },
    recsScrollContent: { paddingHorizontal: 20, gap: 12 },

    recCard: { width: 180, backgroundColor: "#141428", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1f1f35" },
    recImage: { width: "100%", height: 110, resizeMode: "cover" },
    recImagePlaceholder: { width: "100%", height: 110, backgroundColor: "#1f1f35", justifyContent: "center", alignItems: "center" },
    recCardBody: { padding: 10 },
    recCategory: { backgroundColor: "#7C3AED20", color: "#A78BFA", fontSize: 9, fontWeight: "900", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start", textTransform: "uppercase", letterSpacing: 0.5, borderWidth: 1, borderColor: "#7C3AED30", marginBottom: 5 },
    recTitle: { color: "#fff", fontWeight: "800", fontSize: 13, lineHeight: 18, marginBottom: 3 },
    recPrice: { color: "#A78BFA", fontWeight: "800", fontSize: 13, marginBottom: 6 },
    reasonBox: { backgroundColor: "#7C3AED15", borderRadius: 8, padding: 6, borderWidth: 1, borderColor: "#7C3AED25" },
    reasonText: { color: "#9ca3af", fontSize: 10, lineHeight: 14 },

    // Divider / all services
    allServicesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, borderTopWidth: 1, borderTopColor: "#1f1f35", marginTop: 8 },
    allServicesTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
    allServicesCount: { color: "#6b7280", fontSize: 12 },

    search: { backgroundColor: "#141428", borderRadius: 14, padding: 12, color: "#fff", marginHorizontal: 20, marginBottom: 12, fontSize: 14, borderWidth: 1, borderColor: "#1f1f35" },

    // Listing cards
    list: { paddingHorizontal: 20, paddingBottom: 32 },
    card: { backgroundColor: "#141428", borderRadius: 20, marginBottom: 14, overflow: "hidden", borderWidth: 1, borderColor: "#1f1f35" },
    image: { width: "100%", height: 160, resizeMode: "cover" },
    imagePlaceholder: { width: "100%", height: 160, backgroundColor: "#1f1f35", justifyContent: "center", alignItems: "center" },
    imagePlaceholderText: { color: "#4b5563", fontSize: 13 },
    cardBody: { padding: 14 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    category: { backgroundColor: "#7C3AED20", color: "#A78BFA", fontSize: 10, fontWeight: "900", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, textTransform: "uppercase", letterSpacing: 1, borderWidth: 1, borderColor: "#7C3AED30" },
    price: { color: "#A78BFA", fontWeight: "900", fontSize: 16 },
    title: { color: "#fff", fontWeight: "800", fontSize: 16, marginBottom: 4 },
    organizer: { color: "#6b7280", fontSize: 12, marginBottom: 4 },
    location: { color: "#6b7280", fontSize: 12 },
    empty: { color: "#6b7280", textAlign: "center", marginTop: 32, fontSize: 14 },
});
