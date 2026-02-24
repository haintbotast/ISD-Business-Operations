import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,         // JWT stored in httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — redirect to /login on 401
// Do NOT redirect for /auth/me (handled by useAuth → PrivateRoute → React Router Navigate).
// Only redirect for other endpoints (session expired mid-use).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthMe = error.config?.url === '/auth/me';
    if (error.response?.status === 401 && !isAuthMe) {
      window.location.href = '/login';
    }
    // Unwrap the error body for consistent error handling in components
    return Promise.reject(error.response?.data ?? error);
  },
);

export default api;
