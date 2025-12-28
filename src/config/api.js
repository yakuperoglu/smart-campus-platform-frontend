import axios from 'axios';

// Determine API base URL from environment variables
const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) ||
  (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.trim()) ||
  'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiry or errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');

        // Try to refresh the token
        if (refreshToken) {
          try {
            // Create a new axios instance without interceptors to avoid infinite loop
            const refreshAxios = axios.create({
              baseURL: API_BASE_URL,
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const refreshResponse = await refreshAxios.post('/auth/refresh', { refreshToken });

            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data.tokens;

            // Update tokens in localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            // Retry the original request
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh token is invalid or expired, clear storage and redirect to login
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        } else {
          // No refresh token, clear storage and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
