import axios from "axios";

const API_URL = "http://localhost:3000/api/auth";

//register
export function registerRequest(formData) {
  return axios.post(`${API_URL}/register`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

//login
export function loginRequest(email, password) {
  return axios.post(`${API_URL}/login`, {
    email,
    password,
  });
}

export function updateProfile(data) {
  const token = localStorage.getItem('token');
  return axios.put(`${API_URL}/profile`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
