import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// export const SERVER_BASE = "http://192.168.0.119:3000";
export const SERVER_BASE = "http://172.20.10.2:3000";
const API_URL = `${SERVER_BASE}/api`;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;