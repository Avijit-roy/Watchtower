/**
 * apiClient.js — Centralized Axios instance
 *
 * Why centralize? FRONTEND_GUIDELINES.md rule: "No fetch calls directly inside
 * components — always go through api/". This means the base URL, auth header,
 * and error handling are configured in one place.
 *
 * The interceptor attaches the JWT automatically so no individual API function
 * needs to read from localStorage — that stays isolated here.
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT from localStorage to every outbound request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ic_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: if the server returns 401, clear the session and
// redirect to login. This handles token expiry transparently.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ic_token');
      localStorage.removeItem('ic_user');
      // Navigate to login — we avoid importing useNavigate here (not a component)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
