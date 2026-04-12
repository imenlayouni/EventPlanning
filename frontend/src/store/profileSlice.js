import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3000/api/provider";

//helper to get token
const config = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

//thunks
export const updateProfile = createAsyncThunk("profile/update", async (data, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${API_URL}/profile`, data, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to update profile");
    }
});



export const fetchDashboardStats = createAsyncThunk("profile/fetchStats", async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${API_URL}/dashboard-stats`, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
});

const profileSlice = createSlice({
    name: "profile",
    initialState: {
        stats: null,
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            //stats
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.stats = action.payload;
            })
            //update profile
            .addCase(updateProfile.fulfilled, (state) => {
                state.successMessage = "Profile updated successfully";
            })

    }
});

export const { clearMessages } = profileSlice.actions;
export default profileSlice.reducer;
