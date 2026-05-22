import { useState, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Alert, TextInput, ActivityIndicator
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const PASSWORD_PLACEHOLDER = "••••••••";

export default function ProfileScreen() {
    const { user, logout, updateUser } = useAuth();
    const isProvider = user?.role === "serviceProvider";

    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", phone: "", location: "", password: PASSWORD_PLACEHOLDER,
        // provider-specific
        category: "", description: "", priceMin: "", priceMax: "", availability: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: user.phone || user.serviceProfile?.phone || "",
                location: user.location || "",
                password: PASSWORD_PLACEHOLDER,
                category: user.serviceProfile?.category || "",
                description: user.serviceProfile?.description || "",
                priceMin: String(user.serviceProfile?.priceRange?.min || ""),
                priceMax: String(user.serviceProfile?.priceRange?.max || ""),
                availability: user.serviceProfile?.availability?.join(", ") || "",
            });
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                location: form.location,
            };
            if (form.password && form.password !== PASSWORD_PLACEHOLDER) {
                body.password = form.password;
            }

            const res = await api.put("/auth/profile", body);
            updateUser(res.data);

            if (isProvider) {
                const availabilityArray = form.availability
                    ? form.availability.split(",").map(s => s.trim()).filter(Boolean)
                    : [];
                await api.put("/provider/profile", {
                    category: form.category,
                    description: form.description,
                    phone: form.phone,
                    priceRange: {
                        min: Number(form.priceMin) || 0,
                        max: Number(form.priceMax) || 0,
                    },
                    availability: availabilityArray,
                    location: form.location,
                });
            }

            Alert.alert("Saved!", "Your profile has been updated.");
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: () => logout() }
        ]);
    };

    const Field = ({ label, ...props }) => (
        <View style={{ marginBottom: 16 }}>
            <Text style={s.label}>{label}</Text>
            <TextInput style={s.input} placeholderTextColor="#4b5563" {...props} />
        </View>
    );

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View style={s.avatar}>
                    <Text style={s.avatarText}>{user?.firstName?.[0] || "?"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.headerName}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={s.headerRole}>{isProvider ? "Service Provider" : "Participant"}</Text>
                    {user?.status && <Text style={[s.headerStatus, user.status === "approved" ? s.statusApproved : s.statusPending]}>
                        {user.status === "approved" ? "✅ Verified" : `⏳ ${user.status}`}
                    </Text>}
                </View>
                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                    <Text style={s.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Personal info */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>👤 Personal Info</Text>
                    <Field label="First Name" value={form.firstName} onChangeText={t => setForm({ ...form, firstName: t })} placeholder="First name" />
                    <Field label="Last Name" value={form.lastName} onChangeText={t => setForm({ ...form, lastName: t })} placeholder="Last name" />
                    <Field label="Email" value={form.email} onChangeText={t => setForm({ ...form, email: t })} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
                    <Field label="Phone" value={form.phone} onChangeText={t => setForm({ ...form, phone: t })} placeholder="+216 XX XXX XXX" keyboardType="phone-pad" />
                    <Field label="City" value={form.location} onChangeText={t => setForm({ ...form, location: t })} placeholder="Your city" />
                </View>

                {/* Security */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>🔒 Security</Text>
                    <Field
                        label="New Password"
                        value={form.password}
                        onChangeText={t => setForm({ ...form, password: t })}
                        placeholder="Leave blank to keep current"
                        secureTextEntry
                    />
                    <Text style={s.hint}>Leave unchanged to keep your current password.</Text>
                </View>

                {/* Provider-specific fields */}
                {isProvider && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>🏢 Service Profile</Text>
                        <Field label="Category" value={form.category} onChangeText={t => setForm({ ...form, category: t })} placeholder="e.g. Photography, Catering..." />
                        <View style={{ marginBottom: 16 }}>
                            <Text style={s.label}>Description</Text>
                            <TextInput
                                style={[s.input, { minHeight: 80, textAlignVertical: "top" }]}
                                placeholder="Describe your service..."
                                placeholderTextColor="#4b5563"
                                value={form.description}
                                onChangeText={t => setForm({ ...form, description: t })}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                        <View style={s.priceRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Min Price (TND)</Text>
                                <TextInput style={s.input} value={form.priceMin} onChangeText={t => setForm({ ...form, priceMin: t })} keyboardType="numeric" placeholder="0" placeholderTextColor="#4b5563" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Max Price (TND)</Text>
                                <TextInput style={s.input} value={form.priceMax} onChangeText={t => setForm({ ...form, priceMax: t })} keyboardType="numeric" placeholder="0" placeholderTextColor="#4b5563" />
                            </View>
                        </View>
                        <Field
                            label="Availability (comma-separated days)"
                            value={form.availability}
                            onChangeText={t => setForm({ ...form, availability: t })}
                            placeholder="e.g. Monday, Wednesday, Friday"
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[s.saveBtn, saving && s.btnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>💾 Save Profile</Text>}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16" },
    header: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: "#1f1f35", gap: 14 },
    avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#7C3AED20", borderWidth: 1, borderColor: "#7C3AED40", justifyContent: "center", alignItems: "center" },
    avatarText: { color: "#A78BFA", fontSize: 22, fontWeight: "900" },
    headerName: { color: "#fff", fontSize: 17, fontWeight: "900" },
    headerRole: { color: "#6b7280", fontSize: 12, marginTop: 2 },
    headerStatus: { fontSize: 11, fontWeight: "700", marginTop: 3 },
    statusApproved: { color: "#10B981" },
    statusPending: { color: "#f59e0b" },
    logoutBtn: { backgroundColor: "#ef444420", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#ef444440" },
    logoutBtnText: { color: "#ef4444", fontWeight: "800", fontSize: 12 },

    section: { backgroundColor: "#141428", borderRadius: 18, borderWidth: 1, borderColor: "#1f1f35", padding: 16, marginBottom: 16 },
    sectionTitle: { color: "#9ca3af", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },

    label: { color: "#9ca3af", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: "#0b0b16", borderRadius: 12, padding: 13, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 14 },
    hint: { color: "#4b5563", fontSize: 11, marginTop: -8, marginBottom: 8 },

    priceRow: { flexDirection: "row", gap: 10, marginBottom: 0 },

    saveBtn: { backgroundColor: "#7C3AED", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 8 },
    saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 16, textTransform: "uppercase", letterSpacing: 1 },
    btnDisabled: { opacity: 0.5 },
});
