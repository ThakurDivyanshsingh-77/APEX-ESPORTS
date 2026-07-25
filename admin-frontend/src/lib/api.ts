import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const adminToken =
      localStorage.getItem('adminToken') ||
      localStorage.getItem('token') ||
      'dev-admin-token';
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

export default api;
