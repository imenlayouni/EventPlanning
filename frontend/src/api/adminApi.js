import axios from "axios";

const API_URL = "http://localhost:3000/api/admin";

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
export const getAllUsersRequest = (params) => axios.get(`${API_URL}/users`, { params, ...config() });
export const validateUserRequest = (userId) => axios.post(`${API_URL}/validate/${userId}`, {}, config());
export const rejectUserRequest = (userId) => axios.post(`${API_URL}/reject/${userId}`, {}, config());
export const updateUserRoleRequest = (userId, role) => axios.patch(`${API_URL}/users/${userId}/role`, { role }, config());
export const updateUserStatusRequest = (userId, status) => axios.patch(`${API_URL}/users/${userId}/status`, { status }, config());
export const getAnalyticsRequest = () => axios.get(`${API_URL}/analytics`, config());
export const getPendingRequestsRequest = () => axios.get(`${API_URL}/pending-requests`, config());
export const approveListingRequest = (listingId) => axios.post(`${API_URL}/listings/${listingId}/approve`, {}, config());
export const rejectListingRequest = (listingId) => axios.post(`${API_URL}/listings/${listingId}/reject`, {}, config());
export const approveServiceRequest = (serviceId) => axios.post(`${API_URL}/services/${serviceId}/approve`, {}, config());
export const rejectServiceRequest = (serviceId) => axios.post(`${API_URL}/services/${serviceId}/reject`, {}, config());
export const getAdminServiceRequests = () => axios.get(`${API_URL}/service-requests`, config());
export const adminUpdateServiceRequestStatus = (requestId, data) => axios.patch(`${API_URL}/service-requests/${requestId}/status`, data, config());