import axios from 'axios';

const getRawBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If a valid production URL is specified in env, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  // In production browser, if envUrl is localhost or not set, fall back to relative path '/api'
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  // Locally, fall back to the dev server port
  return envUrl || 'http://localhost:5001/api';
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
