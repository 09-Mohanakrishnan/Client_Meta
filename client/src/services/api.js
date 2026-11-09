import axios from 'axios';

const getRawBaseURL = () => {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const envUrl = import.meta.env.VITE_API_URL;

  // When running locally in the browser, always use the local backend
  if (isLocalhost) {
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return envUrl;
    }
    return 'http://localhost:5001/api';
  }

  // In production browser, use envUrl if set, otherwise relative '/api'
  if (envUrl) {
    return envUrl;
  }
  return '/api';
};

const rawBaseURL = getRawBaseURL();

// Normalize baseURL so it always ends with /api regardless of trailing slashes
const getNormalizedBaseURL = (url) => {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl += '/api';
  }
  return cleanUrl;
};

const API = axios.create({
  baseURL: getNormalizedBaseURL(rawBaseURL),
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on login page, redirect
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
