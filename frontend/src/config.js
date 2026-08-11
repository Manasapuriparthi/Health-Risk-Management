// Centralized API configuration supporting Vercel cloud environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : 'http://localhost:8000/api';

console.log('Connected to API Backend:', API_BASE_URL);
