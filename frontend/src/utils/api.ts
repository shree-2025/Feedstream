import axios from 'axios';

// Create an axios instance with default config
// Ensure the base URL doesn't end with a slash
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Fail fast on network issues in dev
  timeout: 10000,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('elog_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      const { status, config } = error.response;
      const method = (config?.method || 'GET').toString().toUpperCase();
      const url = config?.url || '(unknown url)';
      const data = error.response.data;
      const msg = (data && (data.error || data.message)) || `Request failed with status ${status}`;
      console.error(`API Error ${status} ${method} ${url}:`, data);

      // Global 401 handler: token missing/expired -> force sign-in
      if (status === 401) {
        try {
          localStorage.removeItem('elog_token');
          localStorage.removeItem('elog_user');
        } catch {}
        if (typeof window !== 'undefined' && window.location.pathname !== '/signin') {
          window.location.href = '/signin';
        }
      }
      return Promise.reject({ message: msg, status, data, url });
    } else if (error.request) {
      // The request was made but no response was received
      const { config } = error;
      const method = (config?.method || 'GET').toString().toUpperCase();
      const url = config?.url || '(unknown url)';
      console.error(`API Error: No response received for ${method} ${url}`, error.request);
      return Promise.reject({ message: 'No response from server', url });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error (setup):', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export default api;
