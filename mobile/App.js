import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./app/context/AuthContext";
import { ActivityIndicator, View, Text } from "react-native";

import LoginScreen from "./app/screens/LoginScreen";
import RegisterScreen from "./app/screens/RegisterScreen";
import FeedScreen from "./app/screens/FeedScreen";
import ListingDetailsScreen from "./app/screens/ListingDetailsScreen";
import MyEventsScreen from "./app/screens/MyEventsScreen";
import RequestsScreen from "./app/screens/RequestsScreen";
import ProfileScreen from "./app/screens/ProfileScreen";
import ProviderListingsScreen from "./app/screens/provider/ProviderListingsScreen";
import AvailabilityScreen from "./app/screens/provider/AvailabilityScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_STYLE = {
    backgroundColor: "#141428",
    borderTopColor: "#1f1f35",
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 4,
};

function TabIcon({ icon, focused }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{icon}</Text>;
}

function ParticipantTabs() {
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarStyle: TAB_STYLE,
            tabBarActiveTintColor: "#A78BFA",
            tabBarInactiveTintColor: "#6b7280",
            tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        }}>
            <Tab.Screen name="FeedTab" component={FeedScreen}
                options={{ tabBarLabel: "Explore", tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} /> }} />
            <Tab.Screen name="EventsTab" component={MyEventsScreen}
                options={{ tabBarLabel: "My Events", tabBarIcon: ({ focused }) => <TabIcon icon="🎉" focused={focused} /> }} />
            <Tab.Screen name="RequestsTab" component={RequestsScreen}
                options={{ tabBarLabel: "Requests", tabBarIcon: ({ focused }) => <TabIcon icon="📩" focused={focused} /> }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen}
                options={{ tabBarLabel: "Profile", tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
        </Tab.Navigator>
    );
}

function ProviderTabs() {
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarStyle: TAB_STYLE,
            tabBarActiveTintColor: "#A78BFA",
            tabBarInactiveTintColor: "#6b7280",
            tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        }}>
            <Tab.Screen name="FeedTab" component={FeedScreen}
                options={{ tabBarLabel: "Explore", tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} /> }} />
            <Tab.Screen name="ListingsTab" component={ProviderListingsScreen}
                options={{ tabBarLabel: "Listings", tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} /> }} />
            <Tab.Screen name="RequestsTab" component={RequestsScreen}
                options={{ tabBarLabel: "Requests", tabBarIcon: ({ focused }) => <TabIcon icon="📩" focused={focused} /> }} />
            <Tab.Screen name="AvailabilityTab" component={AvailabilityScreen}
                options={{ tabBarLabel: "Calendar", tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} /> }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen}
                options={{ tabBarLabel: "Profile", tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
        </Tab.Navigator>
    );
}

function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) return (
        <View style={{ flex: 1, backgroundColor: "#0b0b16", justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color="#7C3AED" size="large" />
        </View>
    );

    const isProvider = user?.role === "serviceProvider";

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <>
                    <Stack.Screen name="MainTabs" component={isProvider ? ProviderTabs : ParticipantTabs} />
                    <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}
