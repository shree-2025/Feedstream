import axios from 'axios';

// Create a dedicated Axios instance for the app
// Base URL comes from Vite env: VITE_API_URL
// Production is set in .env.production; you can override locally with .env.local
const baseURL = (import.meta as any).env?.VITE_API_URL as string | undefined;

// Ensure legacy imports of axios use the same base URL
if (baseURL && baseURL.trim().length > 0) {
  axios.defaults.baseURL = baseURL;
}

const api = axios.create({
  baseURL: baseURL && baseURL.trim().length > 0 ? baseURL : undefined,
  // withCredentials: true, // enable if you use cookies/sessions
});

export default api;
