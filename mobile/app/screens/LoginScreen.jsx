import { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        try {
            setLoading(true);
            await login(email.trim(), password);
            const user = await login(email.trim(), password);
            if (user.role === "participant") navigation.replace("Feed");
            else if (user.role === "serviceProvider") navigation.replace("Feed");
            else if (user.role === "admin") navigation.replace("Feed");
        } catch (err) {
            Alert.alert("Login Failed", err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.card}>
                <Text style={styles.title}>Axia Event Planner</Text>
                <Text style={styles.subtitle}>Welcome back</Text>
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                    <Text style={styles.link}>Don't have an account? Register</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16", justifyContent: "center", padding: 24 },
    card: { backgroundColor: "#141428", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "#1f1f35" },
    title: { color: "#7C3AED", fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 4 },
    subtitle: { color: "#9ca3af", fontSize: 14, textAlign: "center", marginBottom: 32 },
    input: { backgroundColor: "#1f1f35", borderRadius: 16, padding: 16, color: "#fff", marginBottom: 16, fontSize: 14 },
    button: { backgroundColor: "#7C3AED", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 16 },
    buttonText: { color: "#fff", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 },
    link: { color: "#7C3AED", textAlign: "center", fontSize: 13 }
});