/**
 * Global Configuration
 * 
 * VITE_API_URL should be set in your production environment (e.g., Vercel, Railway).
 * If not set, it defaults to localhost for development.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
