import { useState, useCallback } from "react";
import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function AvailabilityScreen() {
    const { user, updateUser } = useAuth();
    const today = new Date();

    const [unavailable, setUnavailable] = useState(user?.unavailableDates || []);
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [saving, setSaving] = useState(false);

    useFocusEffect(useCallback(() => {
        setUnavailable(user?.unavailableDates || []);
    }, [user]));

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
    };

    const toggleDate = (dateStr) => {
        setUnavailable(prev =>
            prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put("/auth/unavailable-dates", { unavailableDates: unavailable });
            updateUser({ unavailableDates: unavailable });
            Alert.alert("Saved!", "Your availability has been updated.");
        } catch (err) {
            Alert.alert("Error", "Failed to save availability");
        } finally {
            setSaving(false);
        }
    };

    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();

    const renderCalendar = () => {
        const cells = [];

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            cells.push(<View key={`e${i}`} style={s.dayCell} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
            const isUnavail = unavailable.includes(dateStr);

            cells.push(
                <TouchableOpacity
                    key={dateStr}
                    style={[
                        s.dayCell,
                        isToday && s.dayCellToday,
                        isUnavail && s.dayCellUnavail,
                        isPast && s.dayCellPast,
                    ]}
                    onPress={() => !isPast && toggleDate(dateStr)}
                    disabled={isPast}
                >
                    <Text style={[
                        s.dayText,
                        isToday && s.dayTextToday,
                        isUnavail && s.dayTextUnavail,
                        isPast && s.dayTextPast,
                    ]}>
                        {day}
                    </Text>
                </TouchableOpacity>
            );
        }

        return cells;
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>Availability</Text>
                    <Text style={s.headerSub}>Tap days to mark as unavailable</Text>
                </View>
                <TouchableOpacity
                    style={[s.saveBtn, saving && s.btnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={s.calendarCard}>
                    {/* Month navigation */}
                    <View style={s.monthNav}>
                        <TouchableOpacity style={s.navBtn} onPress={prevMonth}>
                            <Text style={s.navBtnText}>‹</Text>
                        </TouchableOpacity>
                        <Text style={s.monthLabel}>{MONTHS[calMonth]} {calYear}</Text>
                        <TouchableOpacity style={s.navBtn} onPress={nextMonth}>
                            <Text style={s.navBtnText}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Day headers */}
                    <View style={s.daysRow}>
                        {DAYS.map(d => (
                            <View key={d} style={s.dayHeaderCell}>
                                <Text style={s.dayHeader}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={s.grid}>
                        {renderCalendar()}
                    </View>

                    {/* Legend */}
                    <View style={s.legend}>
                        <View style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: "#141428", borderWidth: 1, borderColor: "#1f1f35" }]} />
                            <Text style={s.legendText}>Available</Text>
                        </View>
                        <View style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: "#ef444420", borderWidth: 1, borderColor: "#ef444440" }]} />
                            <Text style={[s.legendText, { color: "#ef4444" }]}>Unavailable</Text>
                        </View>
                        <View style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: "#7C3AED20", borderWidth: 1, borderColor: "#7C3AED" }]} />
                            <Text style={[s.legendText, { color: "#A78BFA" }]}>Today</Text>
                        </View>
                    </View>
                </View>

                {/* Marked unavailable list */}
                {unavailable.length > 0 && (
                    <View style={s.unavailableList}>
                        <Text style={s.unavailableListTitle}>
                            Marked Unavailable ({unavailable.length} day{unavailable.length !== 1 ? "s" : ""})
                        </Text>
                        <View style={s.dateChips}>
                            {[...unavailable].sort().map(d => (
                                <TouchableOpacity key={d} style={s.dateChip} onPress={() => toggleDate(d)}>
                                    <Text style={s.dateChipText}>{d} ✕</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b0b16" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, paddingTop: 56 },
    headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
    headerSub: { color: "#6b7280", fontSize: 13, marginTop: 2 },
    saveBtn: { backgroundColor: "#7C3AED", borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, minWidth: 64, alignItems: "center" },
    saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
    btnDisabled: { opacity: 0.5 },

    calendarCard: { backgroundColor: "#141428", borderRadius: 20, borderWidth: 1, borderColor: "#1f1f35", padding: 16, marginBottom: 20 },

    monthNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    navBtn: { backgroundColor: "#1f1f35", borderRadius: 12, width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    navBtnText: { color: "#9ca3af", fontSize: 20, fontWeight: "700" },
    monthLabel: { color: "#fff", fontSize: 16, fontWeight: "900" },

    daysRow: { flexDirection: "row", marginBottom: 8 },
    dayHeaderCell: { flex: 1, alignItems: "center" },
    dayHeader: { color: "#4b5563", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

    grid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center", padding: 2 },
    dayCellToday: { backgroundColor: "#7C3AED20", borderRadius: 10, borderWidth: 1, borderColor: "#7C3AED" },
    dayCellUnavail: { backgroundColor: "#ef444418", borderRadius: 10, borderWidth: 1, borderColor: "#ef444440" },
    dayCellPast: { opacity: 0.3 },
    dayText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
    dayTextToday: { color: "#A78BFA", fontWeight: "900" },
    dayTextUnavail: { color: "#ef4444", fontWeight: "800" },
    dayTextPast: { color: "#374151" },

    legend: { flexDirection: "row", gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#1f1f35" },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 14, height: 14, borderRadius: 4 },
    legendText: { color: "#6b7280", fontSize: 11, fontWeight: "700" },

    unavailableList: { backgroundColor: "#141428", borderRadius: 16, borderWidth: 1, borderColor: "#1f1f35", padding: 16 },
    unavailableListTitle: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
    dateChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    dateChip: { backgroundColor: "#ef444418", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#ef444430" },
    dateChipText: { color: "#ef4444", fontSize: 12, fontWeight: "700" },
});
