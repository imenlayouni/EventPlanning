import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3000/api/listings";

//helper to get token
const config = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const fetchListings = createAsyncThunk("listings/fetchListings", async (params, { rejectWithValue }) => {
    try {
        const res = await axios.get(API_URL, { params });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch listings");
    }
});

export const fetchMyListings = createAsyncThunk("listings/fetchMyListings", async (userId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${API_URL}?organizer=${userId}`, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch my listings");
    }
});

export const createListing = createAsyncThunk("listings/createListing", async (data, { rejectWithValue }) => {
    try {
        const configRaw = config();
        if (data instanceof FormData) {
            delete configRaw.headers["Content-Type"];
        }
        const res = await axios.post(API_URL, data, configRaw);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to create listing");
    }
});

export const updateListing = createAsyncThunk("listings/updateListing", async ({ id, data }, { rejectWithValue }) => {
    try {
        const configRaw = config();
        if (data instanceof FormData) {
            delete configRaw.headers["Content-Type"];
        }
        const res = await axios.put(`${API_URL}/${id}`, data, configRaw);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to update listing");
    }
});

export const deleteListing = createAsyncThunk("listings/deleteListing", async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`${API_URL}/${id}`, config());
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to delete listing");
    }
});

const listingSlice = createSlice({
    name: "listings",
    initialState: {
        listings: [],
        myListings: [],
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
            //fetch all
            .addCase(fetchListings.pending, (state) => { state.loading = true; })
            .addCase(fetchListings.fulfilled, (state, action) => {
                state.loading = false;
                state.listings = action.payload;
            })
            //fetch my listings
            .addCase(fetchMyListings.fulfilled, (state, action) => {
                state.myListings = action.payload;
            })
            //create
            .addCase(createListing.fulfilled, (state, action) => {
                state.myListings.unshift(action.payload);
                state.successMessage = "Listing created successfully";
            })
            .addCase(createListing.rejected, (state, action) => {
                state.error = action.payload;
            })
            //update
            .addCase(updateListing.fulfilled, (state, action) => {
                const index = state.myListings.findIndex(l => l._id === action.payload._id);
                if (index !== -1) state.myListings[index] = action.payload;
                state.successMessage = "Listing updated successfully";
            })
            .addCase(updateListing.rejected, (state, action) => {
                state.error = action.payload;
            })
            //delete
            .addCase(deleteListing.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteListing.fulfilled, (state, action) => {
                state.loading = false;
                state.myListings = state.myListings.filter(l => l._id !== action.payload);
                state.successMessage = "Listing deleted successfully";
                state.error = null;
            })
            .addCase(deleteListing.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.successMessage = null;
            });
    }
});

export const { clearMessages } = listingSlice.actions;
export default listingSlice.reducer;
