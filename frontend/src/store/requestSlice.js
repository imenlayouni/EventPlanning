import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3000/api/service-requests";

const config = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const createServiceRequest = createAsyncThunk("requests/create", async (data, { rejectWithValue }) => {
    try {
        const res = await axios.post(API_URL, data, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to create request");
    }
});

export const fetchMyRequests = createAsyncThunk("requests/fetchMy", async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${API_URL}/my`, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch requests");
    }
});

export const fetchProviderRequests = createAsyncThunk("requests/fetchProvider", async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${API_URL}/provider`, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch requests");
    }
});

export const updateRequestStatus = createAsyncThunk("requests/updateStatus", async ({ id, status, providerNote, finalPrice }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${API_URL}/${id}/status`, { status, providerNote, finalPrice }, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to update request");
    }
});

export const sendProviderResponse = createAsyncThunk("requests/respond", async ({ id, providerNote }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${API_URL}/${id}/respond`, { providerNote }, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to send response");
    }
});

export const sendRequestMessage = createAsyncThunk("requests/sendMessage", async ({ id, text }, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${API_URL}/${id}/message`, { text }, config());
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to send message");
    }
});

// 👇 only one signContract
export const signContract = createAsyncThunk("requests/signContract", async (contractId, { rejectWithValue }) => {
    try {
        const res = await axios.put(`http://localhost:3000/api/contracts/${contractId}/sign`, {}, config());
        return { contractId, contract: res.data };
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to sign contract");
    }
});

const requestSlice = createSlice({
    name: "serviceRequests",
    initialState: {
        myRequests: [],
        providerRequests: [],
        loading: false,
        error: null,
        successMessage: null,
        contracts: {}
    },
    reducers: {
        clearRequestStatus: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createServiceRequest.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createServiceRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.myRequests.unshift(action.payload);
                state.successMessage = "Request sent successfully!";
            })
            .addCase(createServiceRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchMyRequests.pending, (state) => { state.loading = true; })
            .addCase(fetchMyRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.myRequests = action.payload;
            })
            .addCase(fetchProviderRequests.pending, (state) => { state.loading = true; })
            .addCase(fetchProviderRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.providerRequests = action.payload;
            })
            .addCase(updateRequestStatus.fulfilled, (state, action) => {
                const idx = state.providerRequests.findIndex(r => r._id === action.payload._id);
                if (idx !== -1) state.providerRequests[idx] = action.payload;
            })
            .addCase(sendProviderResponse.fulfilled, (state, action) => {
                const idx = state.providerRequests.findIndex(r => r._id === action.payload._id);
                if (idx !== -1) state.providerRequests[idx] = action.payload;
            })
            .addCase(sendRequestMessage.fulfilled, (state, action) => {
                const id = action.payload._id;
                const pi = state.providerRequests.findIndex(r => r._id === id);
                if (pi !== -1) state.providerRequests[pi] = action.payload;
                const mi = state.myRequests.findIndex(r => r._id === id);
                if (mi !== -1) state.myRequests[mi] = action.payload;
            })
            // 👇 only one signContract case
            .addCase(signContract.fulfilled, (state, action) => {
                state.contracts[action.payload.contractId] = action.payload.contract;
                state.myRequests = state.myRequests.map(r =>
                    r.contract?._id === action.payload.contractId
                        ? { ...r, contract: action.payload.contract }
                        : r
                );
                state.providerRequests = state.providerRequests.map(r =>
                    r.contract?._id === action.payload.contractId
                        ? { ...r, contract: action.payload.contract }
                        : r
                );
            });
    }
});

export const { clearRequestStatus } = requestSlice.actions;
export default requestSlice.reducer;