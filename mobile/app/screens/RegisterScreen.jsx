import { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform, ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../api/api";

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "participant" });
    const [cinPhoto, setCinPhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickCIN = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { Alert.alert("Permission needed", "Please allow access to your photos"); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
        if (!result.canceled) setCinPhoto(result.assets[0]);
    };

    const handleRegister = async () => {
        if (!form.firstName || !form.lastName || !form.email) { Alert.alert("Error", "Please fill in all fields"); return; }
        if (!cinPhoto) { Alert.alert("Error", "Please upload your CIN photo"); return; }
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("firstName", form.firstName);
            formData.append("lastName", form.lastName);
            formData.append("email", form.email);
            formData.append("role", form.role);
            formData.append("cinPhoto", { uri: cinPhoto.uri, type: "image/jpeg", name: "cin.jpg" });
            await api.post("/auth/register", formData, { headers: { "Content-Type": "multipart/form-data" } });
            Alert.alert("Success", "Registration submitted! Wait for admin approval.", [{ text: "OK", onPress: () => navigation.navigate("Login") }]);
        } catch (err) {
            Alert.alert("Failed", err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>Axia Event Planner</Text>
                    <Text style={styles.subtitle}>Create an account</Text>
                    <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#666" value={form.firstName} onChangeText={v => setForm({...form, firstName: v})} />
                    <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#666" value={form.lastName} onChangeText={v => setForm({...form, lastName: v})} />
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={form.email} onChangeText={v => setForm({...form, email: v})} keyboardType="email-address" autoCapitalize="none" />
                    <View style={styles.roleContainer}>
                        {["participant", "serviceProvider"].map(role => (
                            <TouchableOpacity key={role} onPress={() => setForm({...form, role})} style={[styles.roleButton, form.role === role && styles.roleButtonActive]}>
                                <Text style={[styles.roleText, form.role === role && styles.roleTextActive]}>{role === "participant" ? "Participant" : "Service Provider"}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.cinButton} onPress={pickCIN}>
                        <Text style={styles.cinButtonText}>{cinPhoto ? "✅ CIN Photo Selected" : "📷 Upload CIN Photo"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Request</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.link}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16", padding: 24 },
    card: { backgroundColor: "#141428", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "#1f1f35", marginTop: 48 },
    title: { color: "#7C3AED", fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 4 },
    subtitle: { color: "#9ca3af", fontSize: 14, textAlign: "center", marginBottom: 32 },
    input: { backgroundColor: "#1f1f35", borderRadius: 16, padding: 16, color: "#fff", marginBottom: 16, fontSize: 14 },
    roleContainer: { flexDirection: "row", gap: 8, marginBottom: 16 },
    roleButton: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#1f1f35", alignItems: "center", borderWidth: 1, borderColor: "#1f1f35" },
    roleButtonActive: { backgroundColor: "#7C3AED20", borderColor: "#7C3AED" },
    roleText: { color: "#9ca3af", fontSize: 12, fontWeight: "700" },
    roleTextActive: { color: "#A78BFA" },
    cinButton: { backgroundColor: "#1f1f35", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#7C3AED50" },
    cinButtonText: { color: "#A78BFA", fontWeight: "700", fontSize: 14 },
    button: { backgroundColor: "#7C3AED", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 16 },
    buttonText: { color: "#fff", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 },
    link: { color: "#7C3AED", textAlign: "center", fontSize: 13 }
});