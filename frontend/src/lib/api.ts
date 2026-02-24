import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,         // JWT stored in httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — redirect to /login on 401
// Skip redirect when already on /login (avoids infinite reload from GET /auth/me)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    // Unwrap the error body for consistent error handling in components
    return Promise.reject(error.response?.data ?? error);
  },
);

export default api;
