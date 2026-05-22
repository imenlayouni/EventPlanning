import { useState, useCallback } from "react";
import {
    View, Text, FlatList, TouchableOpacity, Image,
    StyleSheet, Alert, Modal, TextInput, ScrollView, ActivityIndicator
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import { fixUrl } from "../../utils";

export default function ProviderListingsScreen({ navigation }) {
    const { user } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({ title: "", description: "", category: "", location: "", price: "" });
    const [selectedImages, setSelectedImages] = useState([]);
    const [fields, setFields] = useState([]);

    useFocusEffect(useCallback(() => { fetchListings(); }, []));

    const fetchListings = async () => {
        try {
            setLoading(true);
            const userId = user?._id || user?.id;
            const res = await api.get("/listings");
            const mine = (res.data || []).filter(l =>
                (l.organizer?._id || l.organizer) === userId
            );
            setListings(mine);
        } catch (err) {
            Alert.alert("Error", "Failed to load listings");
        } finally {
            setLoading(false);
        }
    };

    const handlePickImages = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Permission denied", "Please allow access to your photo library.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.7,
        });
        if (!result.canceled) setSelectedImages(result.assets);
    };

    const handleCreate = async () => {
        if (!form.title || !form.category || !form.price) {
            Alert.alert("Required", "Please fill in title, category, and price.");
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("category", form.category);
            formData.append("location", form.location);
            formData.append("price", form.price);
            formData.append("fields", JSON.stringify(fields));

            selectedImages.forEach((img, i) => {
                formData.append("images", {
                    uri: img.uri,
                    type: img.mimeType || "image/jpeg",
                    name: `image_${i}.jpg`,
                });
            });

            const res = await api.post("/listings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setListings(prev => [res.data, ...prev]);
            setShowModal(false);
            resetForm();
            Alert.alert("Published!", "Your listing has been submitted for review.");
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to create listing");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id, title) => {
        Alert.alert("Delete Listing", `Delete "${title}"? This cannot be undone.`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/listings/${id}`);
                        setListings(prev => prev.filter(l => l._id !== id));
                    } catch (err) {
                        Alert.alert("Error", "Failed to delete listing");
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setForm({ title: "", description: "", category: "", location: "", price: "" });
        setSelectedImages([]);
        setFields([]);
    };

    const addField = () => setFields(prev => [...prev, { label: "", type: "text", options: [], required: false }]);
    const removeField = (i) => setFields(prev => prev.filter((_, idx) => idx !== i));
    const updateField = (i, key, val) => setFields(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: val } : f));

    if (loading) return (
        <View style={s.centered}>
            <ActivityIndicator color="#7C3AED" size="large" />
        </View>
    );

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>My Listings</Text>
                    <Text style={s.headerSub}>{listings.length} published service{listings.length !== 1 ? "s" : ""}</Text>
                </View>
                <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
                    <Text style={s.addBtnText}>+ New</Text>
                </TouchableOpacity>
            </View>

            {listings.length === 0 ? (
                <View style={s.emptyState}>
                    <Text style={s.emptyEmoji}>📋</Text>
                    <Text style={s.emptyTitle}>No listings yet</Text>
                    <Text style={s.emptySub}>Create your first service listing to attract clients.</Text>
                    <TouchableOpacity style={s.emptyBtn} onPress={() => setShowModal(true)}>
                        <Text style={s.emptyBtnText}>Create Listing</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={listings}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    onRefresh={fetchListings}
                    refreshing={loading}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={s.card}>
                            {item.images?.[0] ? (
                                <Image source={{ uri: fixUrl(item.images[0]) }} style={s.cardImage} />
                            ) : (
                                <View style={s.cardImagePlaceholder}>
                                    <Text style={{ fontSize: 28 }}>📋</Text>
                                </View>
                            )}
                            <View style={s.cardBody}>
                                <View style={s.cardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.cardTitle}>{item.title}</Text>
                                        <View style={s.cardTags}>
                                            <Text style={s.categoryTag}>{item.category}</Text>
                                            {item.location && <Text style={s.locationTag}>📍 {item.location}</Text>}
                                        </View>
                                        <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
                                    </View>
                                    <Text style={s.cardPrice}>{item.price}</Text>
                                </View>
                                <View style={s.cardActions}>
                                    <TouchableOpacity
                                        style={s.viewBtn}
                                        onPress={() => navigation.navigate("ListingDetails", { listing: item })}
                                    >
                                        <Text style={s.viewBtnText}>View</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={s.deleteBtn}
                                        onPress={() => handleDelete(item._id, item.title)}
                                    >
                                        <Text style={s.deleteBtnText}>🗑 Delete</Text>
                                    </TouchableOpacity>
                                </View>
                                {item.status && item.status !== "approved" && (
                                    <Text style={s.statusNote}>⏳ Status: {item.status}</Text>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}

            {/* Create Listing Modal */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
                <View style={s.modal}>
                    <View style={s.modalHeader}>
                        <Text style={s.modalTitle}>Create New Service</Text>
                        <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }} style={s.modalCloseBtn}>
                            <Text style={s.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
                        <Text style={s.fieldLabel}>Title *</Text>
                        <TextInput style={s.input} placeholder="e.g. Premium Wedding Photography" placeholderTextColor="#4b5563" value={form.title} onChangeText={t => setForm({ ...form, title: t })} />

                        <Text style={s.fieldLabel}>Category *</Text>
                        <TextInput style={s.input} placeholder="e.g. Photography, Catering, DJ..." placeholderTextColor="#4b5563" value={form.category} onChangeText={t => setForm({ ...form, category: t })} />

                        <Text style={s.fieldLabel}>Description</Text>
                        <TextInput style={[s.input, { minHeight: 90, textAlignVertical: "top" }]} placeholder="Describe your service..." placeholderTextColor="#4b5563" value={form.description} onChangeText={t => setForm({ ...form, description: t })} multiline numberOfLines={4} />

                        <Text style={s.fieldLabel}>Location</Text>
                        <TextInput style={s.input} placeholder="City or region" placeholderTextColor="#4b5563" value={form.location} onChangeText={t => setForm({ ...form, location: t })} />

                        <Text style={s.fieldLabel}>Price *</Text>
                        <TextInput style={s.input} placeholder="e.g. 500 TND / 800 TND" placeholderTextColor="#4b5563" value={form.price} onChangeText={t => setForm({ ...form, price: t })} />

                        {/* Photos */}
                        <Text style={s.fieldLabel}>Photos</Text>
                        <TouchableOpacity style={s.photoPicker} onPress={handlePickImages}>
                            <Text style={s.photoPickerText}>📷 {selectedImages.length > 0 ? `${selectedImages.length} photo${selectedImages.length !== 1 ? "s" : ""} selected` : "Pick Photos"}</Text>
                        </TouchableOpacity>
                        {selectedImages.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                {selectedImages.map((img, i) => (
                                    <Image key={i} source={{ uri: img.uri }} style={s.previewImg} />
                                ))}
                            </ScrollView>
                        )}

                        {/* Custom fields */}
                        <View style={s.customFieldsSection}>
                            <View style={s.customFieldsHeader}>
                                <Text style={s.fieldLabel}>Custom Request Form Fields</Text>
                                <TouchableOpacity style={s.addFieldBtn} onPress={addField}>
                                    <Text style={s.addFieldBtnText}>+ Add Field</Text>
                                </TouchableOpacity>
                            </View>
                            {fields.length === 0 && (
                                <Text style={s.noFieldsText}>No custom fields. Add fields clients must fill when requesting.</Text>
                            )}
                            {fields.map((field, idx) => (
                                <View key={idx} style={s.customField}>
                                    <View style={s.customFieldRow}>
                                        <TextInput
                                            style={[s.input, { flex: 1 }]}
                                            placeholder="Field label"
                                            placeholderTextColor="#4b5563"
                                            value={field.label}
                                            onChangeText={t => updateField(idx, "label", t)}
                                        />
                                        <TouchableOpacity style={s.removeFieldBtn} onPress={() => removeField(idx)}>
                                            <Text style={s.removeFieldBtnText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={s.fieldTypeRow}>
                                        {["text", "number", "dropdown", "checkbox", "multi-select"].map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[s.typeChip, field.type === type && s.typeChipActive]}
                                                onPress={() => updateField(idx, "type", type)}
                                            >
                                                <Text style={[s.typeChipText, field.type === type && s.typeChipTextActive]}>{type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[s.submitBtn, submitting && s.btnDisabled]}
                            onPress={handleCreate}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Publish Listing</Text>}
                        </TouchableOpacity>
                        <View style={{ height: 40 }} />
                    </ScrollView>
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
    addBtn: { backgroundColor: "#7C3AED", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 9 },
    addBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 6 },
    emptySub: { color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
    emptyBtn: { backgroundColor: "#7C3AED", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
    emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

    card: { backgroundColor: "#141428", borderRadius: 18, borderWidth: 1, borderColor: "#1f1f35", marginBottom: 14, overflow: "hidden" },
    cardImage: { width: "100%", height: 140, resizeMode: "cover" },
    cardImagePlaceholder: { width: "100%", height: 100, backgroundColor: "#1f1f35", justifyContent: "center", alignItems: "center" },
    cardBody: { padding: 14 },
    cardTop: { flexDirection: "row", gap: 10, marginBottom: 10 },
    cardTitle: { color: "#fff", fontWeight: "800", fontSize: 16, marginBottom: 4 },
    cardTags: { flexDirection: "row", gap: 8, marginBottom: 4, flexWrap: "wrap" },
    categoryTag: { backgroundColor: "#7C3AED20", color: "#A78BFA", fontSize: 10, fontWeight: "900", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, textTransform: "uppercase", borderWidth: 1, borderColor: "#7C3AED30" },
    locationTag: { color: "#6b7280", fontSize: 11 },
    cardDesc: { color: "#6b7280", fontSize: 12, lineHeight: 18 },
    cardPrice: { color: "#A78BFA", fontWeight: "900", fontSize: 18, flexShrink: 0 },
    cardActions: { flexDirection: "row", gap: 10 },
    viewBtn: { flex: 1, backgroundColor: "#7C3AED20", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#7C3AED30" },
    viewBtnText: { color: "#A78BFA", fontWeight: "800", fontSize: 13 },
    deleteBtn: { flex: 1, backgroundColor: "#ef444415", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#ef444430" },
    deleteBtnText: { color: "#ef4444", fontWeight: "800", fontSize: 13 },
    statusNote: { color: "#f59e0b", fontSize: 11, marginTop: 6, fontStyle: "italic" },

    modal: { flex: 1, backgroundColor: "#0b0b16" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: "#1f1f35" },
    modalTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
    modalCloseBtn: { padding: 8 },
    modalCloseText: { color: "#6b7280", fontSize: 18 },
    modalBody: { flex: 1, padding: 20 },

    fieldLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: "#141428", borderRadius: 12, padding: 13, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 14 },

    photoPicker: { backgroundColor: "#141428", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#1f1f35", borderStyle: "dashed", marginBottom: 8 },
    photoPickerText: { color: "#A78BFA", fontWeight: "700", fontSize: 14 },
    previewImg: { width: 70, height: 70, borderRadius: 10, marginRight: 8, resizeMode: "cover" },

    customFieldsSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#1f1f35", paddingTop: 4 },
    customFieldsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    addFieldBtn: { backgroundColor: "#7C3AED20", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#7C3AED30" },
    addFieldBtnText: { color: "#A78BFA", fontWeight: "700", fontSize: 12 },
    noFieldsText: { color: "#4b5563", fontSize: 12, fontStyle: "italic", textAlign: "center", paddingVertical: 12 },
    customField: { backgroundColor: "#141428", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#1f1f35", marginBottom: 8 },
    customFieldRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    removeFieldBtn: { backgroundColor: "#ef444420", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
    removeFieldBtnText: { color: "#ef4444", fontWeight: "800" },
    fieldTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    typeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#1f1f35", backgroundColor: "#0b0b16" },
    typeChipActive: { backgroundColor: "#7C3AED30", borderColor: "#7C3AED" },
    typeChipText: { color: "#6b7280", fontSize: 11, fontWeight: "700" },
    typeChipTextActive: { color: "#A78BFA" },

    submitBtn: { backgroundColor: "#7C3AED", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 20 },
    submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 1 },
    btnDisabled: { opacity: 0.4 },
});
