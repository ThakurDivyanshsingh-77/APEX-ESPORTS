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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If request failed due to connection refused on localhost, fallback retry to Render backend
    if (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      !error.response
    ) {
      if (originalRequest && !originalRequest._retry && originalRequest.url) {
        originalRequest._retry = true;
        const renderBase = 'https://apex-esports.onrender.com/api/v1';
        originalRequest.baseURL = renderBase;
        console.warn(`[API Connection Fallback] Local server unreachable. Retrying request to ${renderBase}${originalRequest.url}`);
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
