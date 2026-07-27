import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://apex-esports.onrender.com/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
