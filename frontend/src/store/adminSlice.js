import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  validateUserRequest,
  rejectUserRequest,
  getAllUsersRequest,
  updateUserRoleRequest,
  updateUserStatusRequest,
  getAnalyticsRequest
  , getPendingRequestsRequest, approveListingRequest, rejectListingRequest, approveServiceRequest, rejectServiceRequest, getAdminServiceRequests, adminUpdateServiceRequestStatus
} from "../api/adminApi";

//thunks
export const fetchAllUsers = createAsyncThunk("admin/fetchAllUsers", async (params, { rejectWithValue }) => {
  try {
    const res = await getAllUsersRequest(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
  }
});

export const fetchAnalytics = createAsyncThunk("admin/fetchAnalytics", async (_, { rejectWithValue }) => {
  try {
    const res = await getAnalyticsRequest();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch analytics");
  }
});

export const fetchPendingRequests = createAsyncThunk("admin/fetchPendingRequests", async (_, { rejectWithValue }) => {
  try {
    const res = await getPendingRequestsRequest();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch pending requests");
  }
});

export const approveListing = createAsyncThunk("admin/approveListing", async ({ listingId }, { rejectWithValue }) => {
  try {
    const res = await approveListingRequest(listingId);
    return res.data.listing || { _id: listingId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to approve listing");
  }
});

export const rejectListing = createAsyncThunk("admin/rejectListing", async ({ listingId }, { rejectWithValue }) => {
  try {
    await rejectListingRequest(listingId);
    return listingId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to reject listing");
  }
});

export const approveService = createAsyncThunk("admin/approveService", async ({ serviceId }, { rejectWithValue }) => {
  try {
    const res = await approveServiceRequest(serviceId);
    return res.data.service || { _id: serviceId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to approve service");
  }
});

export const rejectService = createAsyncThunk("admin/rejectService", async ({ serviceId }, { rejectWithValue }) => {
  try {
    const res = await rejectServiceRequest(serviceId);
    return res.data.service || { _id: serviceId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to reject service");
  }
});

export const fetchAdminServiceRequests = createAsyncThunk("admin/fetchAdminServiceRequests", async (_, { rejectWithValue }) => {
  try {
    const res = await getAdminServiceRequests();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch admin service requests");
  }
});

export const adminUpdateRequestStatus = createAsyncThunk("admin/adminUpdateRequestStatus", async ({ requestId, data }, { rejectWithValue }) => {
  try {
    const res = await adminUpdateServiceRequestStatus(requestId, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update request status");
  }
});

export const validateUser = createAsyncThunk("admin/validateUser", async ({ userId }, { rejectWithValue }) => {
  try {
    await validateUserRequest(userId);
    return userId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Validation failed");
  }
});

export const rejectUser = createAsyncThunk("admin/rejectUser", async ({ userId }, { rejectWithValue }) => {
  try {
    await rejectUserRequest(userId);
    return userId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Rejection failed");
  }
});

export const updateUserRole = createAsyncThunk("admin/updateUserRole", async ({ userId, role }, { rejectWithValue }) => {
  try {
    const res = await updateUserRoleRequest(userId, role);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Role update failed");
  }
});

export const updateUserStatus = createAsyncThunk("admin/updateUserStatus", async ({ userId, status }, { rejectWithValue }) => {
  try {
    const res = await updateUserStatusRequest(userId, status);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Status update failed");
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    analytics: null,
    pendingRequests: { listings: [], services: [] },
    adminServiceRequests: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Fetch Analytics
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })

      // Fetch pending requests
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.pendingRequests = action.payload;
      })

      // Approve listing
      .addCase(approveListing.fulfilled, (state, action) => {
        // remove listing from pending list
        state.pendingRequests.listings = state.pendingRequests.listings.filter(l => l._id !== action.payload._id);
      })

      // Reject listing
      .addCase(rejectListing.fulfilled, (state, action) => {
        state.pendingRequests.listings = state.pendingRequests.listings.filter(l => l._id !== action.payload);
      })

      // Approve service
      .addCase(approveService.fulfilled, (state, action) => {
        state.pendingRequests.services = state.pendingRequests.services.filter(s => s._id !== action.payload._id);
      })

      // Reject service
      .addCase(rejectService.fulfilled, (state, action) => {
        state.pendingRequests.services = state.pendingRequests.services.filter(s => s._id !== action.payload._id);
      })

      // Admin service requests
      .addCase(fetchAdminServiceRequests.fulfilled, (state, action) => {
        state.adminServiceRequests = action.payload;
      })

      .addCase(adminUpdateRequestStatus.fulfilled, (state, action) => {
        // remove or update request in list
        state.adminServiceRequests = state.adminServiceRequests.map(r => r._id === action.payload._id ? action.payload : r).filter(r => r.status === 'pending');
      })

      // Validate User
      .addCase(validateUser.fulfilled, (state, action) => {
        state.users = state.users.map(user =>
          user._id === action.payload ? { ...user, status: "ACTIVE" } : user
        );
      })

      // Reject User
      .addCase(rejectUser.fulfilled, (state, action) => {
        state.users = state.users.map(user =>
          user._id === action.payload ? { ...user, status: "REJECTED" } : user
        );
      })

      // Update Role
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.users = state.users.map(user =>
          user._id === action.payload._id ? action.payload : user
        );
      })

      // Update Status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.users = state.users.map(user =>
          user._id === action.payload._id ? action.payload : user
        );
      });
  },
});

export default adminSlice.reducer;