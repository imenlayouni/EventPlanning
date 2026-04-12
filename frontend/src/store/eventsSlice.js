import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3000/api/events";

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

export const fetchMyEvents = createAsyncThunk("events/fetchMyEvents", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/my`, getConfig());
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch events");
  }
});

export const addEventAction = createAsyncThunk("events/addEvent", async (name, { rejectWithValue }) => {
  try {
    const res = await axios.post(API_URL, { name }, getConfig());
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create event");
  }
});

export const addServiceToEventAction = createAsyncThunk("events/addServiceToEvent", async ({ eventId, serviceId }, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_URL}/add-service`, { eventId, serviceId }, getConfig());
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to add service to event");
  }
});

export const removeServiceFromEventAction = createAsyncThunk("events/removeServiceFromEvent", async ({ eventId, serviceId }, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`${API_URL}/remove-service`, {
      ...getConfig(),
      data: { eventId, serviceId }
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to remove service");
  }
});

const eventsSlice = createSlice({
  name: "events",
  initialState: {
    myEvents: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEvents.pending, (state) => { state.loading = true; })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.myEvents = action.payload;
      })
      .addCase(addEventAction.fulfilled, (state, action) => {
        state.myEvents.push(action.payload);
      })
      .addCase(addServiceToEventAction.fulfilled, (state, action) => {
        const index = state.myEvents.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.myEvents[index] = action.payload;
      })
      .addCase(removeServiceFromEventAction.fulfilled, (state, action) => {
        const index = state.myEvents.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.myEvents[index] = action.payload;
      });
  }
});

export default eventsSlice.reducer;

