import { useState, useCallback } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, TextInput, FlatList
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

function StatusBadge({ status }) {
    const map = {
        pending:  { bg: "#f59e0b20", border: "#f59e0b40", text: "#f59e0b",  label: "Pending" },
        accepted: { bg: "#10B98120", border: "#10B98140", text: "#10B981",  label: "Accepted" },
        declined: { bg: "#ef444420", border: "#ef444440", text: "#ef4444",  label: "Declined" },
    };
    const c = map[status] || map.pending;
    return (
        <View style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: c.text, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</Text>
        </View>
    );
}

// ── Participant view ──────────────────────────────────────────────────────────
function ParticipantRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [signingId, setSigningId] = useState(null);
    const [agreedTo, setAgreedTo] = useState({});
    const [replyTexts, setReplyTexts] = useState({});
    const [sendingReply, setSendingReply] = useState({});

    useFocusEffect(useCallback(() => { fetchRequests(); }, []));

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get("/service-requests/my");
            setRequests(res.data || []);
        } catch (err) {
            Alert.alert("Error", "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleSignContract = async (contractId) => {
        try {
            await api.put(`/contracts/${contractId}/sign`);
            fetchRequests();
            Alert.alert("Signed!", "You have signed the contract.");
        } catch (err) {
            Alert.alert("Error", "Failed to sign contract");
        }
    };

    const handleSendMessage = async (requestId) => {
        const text = replyTexts[requestId]?.trim();
        if (!text) return;
        setSendingReply(prev => ({ ...prev, [requestId]: true }));
        try {
            await api.post(`/service-requests/${requestId}/message`, { text });
            setReplyTexts(prev => ({ ...prev, [requestId]: "" }));
            fetchRequests();
        } catch (err) {
            Alert.alert("Error", "Failed to send message");
        } finally {
            setSendingReply(prev => ({ ...prev, [requestId]: false }));
        }
    };

    if (loading) return <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 40 }} />;

    if (requests.length === 0) return (
        <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📩</Text>
            <Text style={s.emptyTitle}>No requests yet</Text>
            <Text style={s.emptySub}>Browse services and make your first request.</Text>
        </View>
    );

    return (
        <FlatList
            data={requests}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            onRefresh={fetchRequests}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: req }) => {
                const contract = req.contract;
                const userSigned = contract?.clientSigned;
                const fullySigned = contract?.status === "FULLY_SIGNED";
                const contractKey = contract?._id;
                const agreed = agreedTo[contractKey] || false;

                return (
                    <View style={s.reqCard}>
                        <View style={s.reqCardTop}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.reqTitle}>{req.listing?.title || "Service"}</Text>
                                <Text style={s.reqMeta}>To: {req.provider?.firstName} {req.provider?.lastName}</Text>
                                <Text style={s.reqType}>{req.requestType?.replace("_", " ")}</Text>
                            </View>
                            <View style={{ alignItems: "flex-end", gap: 6 }}>
                                <Text style={s.reqDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                                <StatusBadge status={req.status} />
                            </View>
                        </View>

                        <Text style={s.reqDescription}>{req.description}</Text>
                        {req.finalPrice && <Text style={s.reqPrice}>Agreed price: {req.finalPrice} TND</Text>}

                        {/* Submitted form details */}
                        {req.formAnswers?.length > 0 && (
                            <View style={s.formAnswersBox}>
                                <Text style={s.formAnswersTitle}>Your Submitted Details</Text>
                                {req.formAnswers.map((ans, i) => (
                                    <View key={i} style={s.answerRow}>
                                        <Text style={s.answerLabel}>{ans.label}</Text>
                                        <Text style={s.answerValue}>{ans.value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Conversation */}
                        {req.messages?.length > 0 && (
                            <View style={s.conversationBox}>
                                <Text style={s.conversationTitle}>Conversation</Text>
                                {req.messages.map((msg, i) => (
                                    <View key={i} style={[s.msgBubbleWrapper, msg.senderRole === "participant" ? s.msgRight : s.msgLeft]}>
                                        <View style={[s.msgBubble, msg.senderRole === "participant" ? s.msgBubbleParticipant : s.msgBubbleProvider]}>
                                            <Text style={[s.msgSender, msg.senderRole === "participant" ? s.msgSenderParticipant : s.msgSenderProvider]}>
                                                {msg.senderRole === "participant" ? "You" : req.provider?.firstName}
                                            </Text>
                                            <Text style={s.msgText}>{msg.text}</Text>
                                            <Text style={s.msgTime}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Reply input */}
                        {req.status === "pending" && (
                            <View style={s.replyRow}>
                                <TextInput
                                    style={s.replyInput}
                                    placeholder="Reply to provider..."
                                    placeholderTextColor="#4b5563"
                                    value={replyTexts[req._id] || ""}
                                    onChangeText={text => setReplyTexts(prev => ({ ...prev, [req._id]: text }))}
                                    multiline
                                />
                                <TouchableOpacity
                                    style={[s.sendBtn, (!replyTexts[req._id]?.trim() || sendingReply[req._id]) && s.btnDisabled]}
                                    onPress={() => handleSendMessage(req._id)}
                                    disabled={!replyTexts[req._id]?.trim() || sendingReply[req._id]}
                                >
                                    <Text style={s.sendBtnText}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Contract section */}
                        {req.status === "accepted" && contract && (
                            <View style={s.contractBox}>
                                <View style={s.contractHeader}>
                                    <Text style={s.contractTitle}>📄 Service Contract</Text>
                                    <View style={[s.contractStatusBadge, fullySigned ? s.contractFullySigned : s.contractPending]}>
                                        <Text style={[s.contractStatusText, fullySigned ? s.contractFullySignedText : s.contractPendingText]}>
                                            {fullySigned ? "✅ Fully Signed" : userSigned ? "⏳ Waiting for Provider" : "✍️ Needs Your Signature"}
                                        </Text>
                                    </View>
                                </View>

                                <ScrollView style={s.contractTerms} nestedScrollEnabled>
                                    <Text style={s.contractTermsText}>{contract.terms}</Text>
                                </ScrollView>

                                <View style={s.signatureStatus}>
                                    <Text style={[s.signerLabel, contract.clientSigned && s.signerSigned]}>
                                        {contract.clientSigned ? "✅" : "⬜"} You
                                    </Text>
                                    <Text style={[s.signerLabel, contract.providerSigned && s.signerSigned]}>
                                        {contract.providerSigned ? "✅" : "⬜"} {req.provider?.firstName}
                                    </Text>
                                </View>

                                {!userSigned && (
                                    <>
                                        <TouchableOpacity
                                            style={s.agreeRow}
                                            onPress={() => setAgreedTo(prev => ({ ...prev, [contractKey]: !prev[contractKey] }))}
                                        >
                                            <View style={[s.checkBox, agreed && s.checkBoxChecked]} />
                                            <Text style={s.agreeText}>
                                                I have read and agree to all the <Text style={{ color: "#A78BFA" }}>terms and conditions</Text>.
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[s.signBtn, !agreed && s.btnDisabled]}
                                            onPress={() => agreed && handleSignContract(contractKey)}
                                            disabled={!agreed}
                                        >
                                            <Text style={s.signBtnText}>✍️ Sign Contract</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {fullySigned && (
                                    <View style={s.fullySignedBanner}>
                                        <Text style={s.fullySignedText}>🎉 Contract fully signed! Service is confirmed.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        {req.status === "accepted" && !contract && (
                            <Text style={s.contractPending}>Contract is being prepared...</Text>
                        )}
                    </View>
                );
            }}
        />
    );
}

// ── Provider view ─────────────────────────────────────────────────────────────
function ProviderRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [respondingTo, setRespondingTo] = useState(null);
    const [note, setNote] = useState("");
    const [price, setPrice] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useFocusEffect(useCallback(() => { fetchRequests(); }, []));

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get("/service-requests/provider");
            setRequests(res.data || []);
        } catch (err) {
            Alert.alert("Error", "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id, status) => {
        setSubmitting(true);
        try {
            await api.put(`/service-requests/${id}/status`, {
                status,
                providerNote: note,
                finalPrice: status === "accepted" && price ? Number(price) : null,
            });
            setRespondingTo(null);
            setNote("");
            setPrice("");
            fetchRequests();
            Alert.alert(status === "accepted" ? "Accepted!" : "Declined", status === "accepted" ? "Request accepted. A contract will be generated." : "Request has been declined.");
        } catch (err) {
            Alert.alert("Error", "Failed to update request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignContract = async (contractId) => {
        try {
            await api.put(`/contracts/${contractId}/sign`);
            fetchRequests();
            Alert.alert("Signed!", "You have signed the contract.");
        } catch (err) {
            Alert.alert("Error", "Failed to sign contract");
        }
    };

    const TYPE_LABELS = {
        price_change: "💰 Price Change",
        add_item: "➕ Add Item",
        remove_item: "➖ Remove Item",
        custom: "✏️ Custom",
    };

    if (loading) return <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 40 }} />;

    if (requests.length === 0) return (
        <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📩</Text>
            <Text style={s.emptyTitle}>No requests yet</Text>
            <Text style={s.emptySub}>Incoming service requests will appear here.</Text>
        </View>
    );

    return (
        <FlatList
            data={requests}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            onRefresh={fetchRequests}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: req }) => {
                const isPending = req.status === "pending";
                const contract = req.contract;
                const fullySigned = contract?.status === "FULLY_SIGNED";
                const clientSigned = contract?.clientSigned;
                const providerSigned = contract?.providerSigned;

                return (
                    <View style={s.reqCard}>
                        <View style={s.reqCardTop}>
                            <View style={s.providerAvatar}>
                                <Text style={s.providerAvatarText}>{req.user?.firstName?.[0] || "?"}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={s.reqTitle}>{req.user?.firstName} {req.user?.lastName}</Text>
                                <Text style={s.reqType}>{TYPE_LABELS[req.requestType] || req.requestType} • {req.listing?.title || "Service"}</Text>
                            </View>
                            <StatusBadge status={req.status} />
                        </View>

                        <View style={s.descBox}>
                            <Text style={s.reqDescription}>{req.description}</Text>
                            {req.suggestedPrice && <Text style={s.reqPrice}>Suggested: {req.suggestedPrice} TND</Text>}
                        </View>

                        {/* Form answers */}
                        {req.formAnswers?.length > 0 && (
                            <View style={s.formAnswersBox}>
                                <Text style={s.formAnswersTitle}>Service Details</Text>
                                {req.formAnswers.map((ans, i) => (
                                    <View key={i} style={s.answerRow}>
                                        <Text style={s.answerLabel}>{ans.label}</Text>
                                        <Text style={s.answerValue}>{ans.value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Text style={s.reqDate}>{new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>

                        {/* Actions for pending */}
                        {isPending && (
                            <View style={{ marginTop: 12 }}>
                                {respondingTo === req._id ? (
                                    <View style={{ gap: 8 }}>
                                        <TextInput
                                            style={s.input}
                                            placeholder="Note to client (optional)..."
                                            placeholderTextColor="#4b5563"
                                            value={note}
                                            onChangeText={setNote}
                                        />
                                        <TextInput
                                            style={s.input}
                                            placeholder="Final price (TND)..."
                                            placeholderTextColor="#4b5563"
                                            keyboardType="numeric"
                                            value={price}
                                            onChangeText={setPrice}
                                        />
                                        <View style={s.actionBtns}>
                                            <TouchableOpacity
                                                style={[s.acceptBtn, submitting && s.btnDisabled]}
                                                onPress={() => handleRespond(req._id, "accepted")}
                                                disabled={submitting}
                                            >
                                                <Text style={s.acceptBtnText}>✅ Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[s.declineBtn, submitting && s.btnDisabled]}
                                                onPress={() => handleRespond(req._id, "declined")}
                                                disabled={submitting}
                                            >
                                                <Text style={s.declineBtnText}>❌ Decline</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={s.cancelRespondBtn}
                                                onPress={() => { setRespondingTo(null); setNote(""); setPrice(""); }}
                                            >
                                                <Text style={s.cancelRespondText}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={s.respondBtn} onPress={() => setRespondingTo(req._id)}>
                                        <Text style={s.respondBtnText}>Respond</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {req.providerNote && req.status !== "pending" && (
                            <View style={s.providerNoteBox}>
                                <Text style={s.providerNoteLabel}>Your response</Text>
                                <Text style={s.providerNoteText}>"{req.providerNote}"</Text>
                                {req.finalPrice && <Text style={s.reqPrice}>Agreed: {req.finalPrice} TND</Text>}
                            </View>
                        )}

                        {/* Contract section */}
                        {req.status === "accepted" && contract && (
                            <View style={s.contractBox}>
                                <View style={s.contractHeader}>
                                    <Text style={s.contractTitle}>📄 Service Contract</Text>
                                    <View style={[s.contractStatusBadge, fullySigned ? s.contractFullySigned : s.contractPendingBadge]}>
                                        <Text style={[s.contractStatusText, fullySigned ? s.contractFullySignedText : s.contractPendingText]}>
                                            {fullySigned ? "✅ Fully Signed" : providerSigned ? "⏳ Waiting for Client" : clientSigned ? "✍️ Client Signed — Your Turn" : "⏳ Waiting for Client"}
                                        </Text>
                                    </View>
                                </View>

                                <ScrollView style={s.contractTerms} nestedScrollEnabled>
                                    <Text style={s.contractTermsText}>{contract.terms}</Text>
                                </ScrollView>

                                <View style={s.signatureStatus}>
                                    <Text style={[s.signerLabel, clientSigned && s.signerSigned]}>
                                        {clientSigned ? "✅" : "⬜"} Client
                                    </Text>
                                    <Text style={[s.signerLabel, providerSigned && s.signerSigned]}>
                                        {providerSigned ? "✅" : "⬜"} You
                                    </Text>
                                </View>

                                {clientSigned && !providerSigned && (
                                    <TouchableOpacity style={s.signBtn} onPress={() => handleSignContract(contract._id)}>
                                        <Text style={s.signBtnText}>✍️ Sign Contract</Text>
                                    </TouchableOpacity>
                                )}
                                {!clientSigned && (
                                    <Text style={s.waitingText}>Waiting for client to sign first...</Text>
                                )}
                                {fullySigned && (
                                    <View style={s.fullySignedBanner}>
                                        <Text style={s.fullySignedText}>🎉 Contract fully signed! Service is confirmed.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                );
            }}
        />
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RequestsScreen() {
    const { user } = useAuth();
    const isProvider = user?.role === "serviceProvider";

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.headerTitle}>{isProvider ? "Incoming Requests" : "My Requests"}</Text>
            </View>
            {isProvider ? <ProviderRequests /> : <ParticipantRequests />}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16" },
    header: { padding: 24, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: "#1f1f35" },
    headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },

    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 6 },
    emptySub: { color: "#6b7280", fontSize: 13, textAlign: "center", lineHeight: 20 },

    reqCard: { backgroundColor: "#141428", borderRadius: 18, borderWidth: 1, borderColor: "#1f1f35", padding: 16, marginBottom: 14 },
    reqCardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
    reqTitle: { color: "#fff", fontWeight: "800", fontSize: 15, marginBottom: 2 },
    reqMeta: { color: "#6b7280", fontSize: 11 },
    reqType: { color: "#6b7280", fontSize: 11, marginTop: 2 },
    reqDate: { color: "#4b5563", fontSize: 11, marginTop: 8 },
    reqDescription: { color: "#9ca3af", fontSize: 13, lineHeight: 20 },
    reqPrice: { color: "#A78BFA", fontWeight: "700", fontSize: 12, marginTop: 4 },

    providerAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#7C3AED20", borderWidth: 1, borderColor: "#7C3AED30", justifyContent: "center", alignItems: "center" },
    providerAvatarText: { color: "#A78BFA", fontWeight: "900", fontSize: 15 },

    descBox: { backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12, marginBottom: 10 },
    formAnswersBox: { backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12, marginBottom: 10 },
    formAnswersTitle: { color: "#6b7280", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    answerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    answerLabel: { color: "#6b7280", fontSize: 12 },
    answerValue: { color: "#fff", fontWeight: "700", fontSize: 12 },

    input: { backgroundColor: "#0b0b16", borderRadius: 12, padding: 12, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 13 },
    actionBtns: { flexDirection: "row", gap: 8 },
    acceptBtn: { flex: 1, backgroundColor: "#10B98120", borderWidth: 1, borderColor: "#10B98140", borderRadius: 12, padding: 10, alignItems: "center" },
    acceptBtnText: { color: "#10B981", fontWeight: "800", fontSize: 13 },
    declineBtn: { flex: 1, backgroundColor: "#ef444420", borderWidth: 1, borderColor: "#ef444440", borderRadius: 12, padding: 10, alignItems: "center" },
    declineBtnText: { color: "#ef4444", fontWeight: "800", fontSize: 13 },
    cancelRespondBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#1f1f35" },
    cancelRespondText: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
    respondBtn: { backgroundColor: "#1f1f35", borderRadius: 12, padding: 12, alignItems: "center" },
    respondBtnText: { color: "#9ca3af", fontWeight: "700", fontSize: 13 },

    providerNoteBox: { marginTop: 10, backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12 },
    providerNoteLabel: { color: "#6b7280", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    providerNoteText: { color: "#9ca3af", fontSize: 13, fontStyle: "italic" },

    // Contract styles
    contractBox: { marginTop: 14, backgroundColor: "#0b0b16", borderRadius: 14, borderWidth: 1, borderColor: "#1f1f35", padding: 14 },
    contractHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    contractTitle: { color: "#A78BFA", fontWeight: "900", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },
    contractStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    contractFullySigned: { backgroundColor: "#10B98120", borderColor: "#10B98140" },
    contractFullySignedText: { color: "#10B981", fontSize: 10, fontWeight: "800" },
    contractPendingBadge: { backgroundColor: "#f59e0b20", borderColor: "#f59e0b40" },
    contractPendingText: { color: "#f59e0b", fontSize: 10, fontWeight: "800" },
    contractStatusText: { fontSize: 10, fontWeight: "800" },
    contractTerms: { backgroundColor: "#141428", borderRadius: 10, padding: 10, maxHeight: 120, marginBottom: 10 },
    contractTermsText: { color: "#6b7280", fontSize: 11, lineHeight: 18, fontFamily: "monospace" },
    signatureStatus: { flexDirection: "row", gap: 16, marginBottom: 10 },
    signerLabel: { color: "#4b5563", fontSize: 12, fontWeight: "700" },
    signerSigned: { color: "#10B981" },

    agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
    checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: "#374151", marginTop: 2, flexShrink: 0 },
    checkBoxChecked: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
    agreeText: { color: "#9ca3af", fontSize: 13, flex: 1, lineHeight: 20 },
    signBtn: { backgroundColor: "#7C3AED", borderRadius: 12, padding: 12, alignItems: "center" },
    signBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
    btnDisabled: { opacity: 0.4 },
    waitingText: { color: "#f59e0b", fontSize: 12, textAlign: "center", fontStyle: "italic", paddingVertical: 6 },
    fullySignedBanner: { backgroundColor: "#10B98115", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#10B98130" },
    fullySignedText: { color: "#10B981", fontWeight: "700", fontSize: 13 },
    contractPending: { color: "#6b7280", fontSize: 12, fontStyle: "italic", marginTop: 8 },

    conversationBox: { backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12, marginTop: 10, marginBottom: 4 },
    conversationTitle: { color: "#6b7280", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    msgBubbleWrapper: { marginBottom: 8 },
    msgLeft: { alignItems: "flex-start" },
    msgRight: { alignItems: "flex-end" },
    msgBubble: { maxWidth: "80%", borderRadius: 12, padding: 10 },
    msgBubbleParticipant: { backgroundColor: "#7C3AED20", borderWidth: 1, borderColor: "#7C3AED40" },
    msgBubbleProvider: { backgroundColor: "#1f1f35", borderWidth: 1, borderColor: "#2d2d4e" },
    msgSender: { fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3, opacity: 0.7 },
    msgSenderParticipant: { color: "#A78BFA" },
    msgSenderProvider: { color: "#9ca3af" },
    msgText: { color: "#e5e7eb", fontSize: 13, lineHeight: 18 },
    msgTime: { color: "#6b7280", fontSize: 9, marginTop: 4, textAlign: "right" },

    replyRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 10 },
    replyInput: { flex: 1, backgroundColor: "#0b0b16", borderRadius: 12, padding: 12, color: "#fff", borderWidth: 1, borderColor: "#1f1f35", fontSize: 13, maxHeight: 80 },
    sendBtn: { backgroundColor: "#7C3AED", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
    sendBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
