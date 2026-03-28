import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Get tenant ID from various sources
const getTenantId = (): string | null => {
  // Try to get from subdomain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0]; // First part is tenant ID
    }
  }
  
  // Try to get from URL parameter
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get('tenantId');
    if (tenantId) return tenantId;
  }
  
  // Try to get from localStorage (fallback)
  if (typeof window !== 'undefined') {
    const storedTenantId = localStorage.getItem('tenantId');
    if (storedTenantId) return storedTenantId;
  }

  // Default tenant for local development
  return 'demo';
};

// Create Axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 30000, // 30 seconds
  withCredentials: true, // Include HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for tenant ID injection
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tenantId = getTenantId();
    
    // Inject tenant ID into URL path
    if (tenantId && config.url) {
      // Check if URL already has tenant ID
      if (!config.url.includes(`/${tenantId}/`)) {
        // Format: /api/{tenantId}/...
        // Remove leading slash from URL if present
        const cleanUrl = config.url.startsWith('/') ? config.url.slice(1) : config.url;
        // Build the full URL with tenant ID
        config.url = `/${tenantId}/${cleanUrl}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;

      // If already on the login page, don't attempt refresh — just reject
      if (typeof window !== 'undefined' && window.location.pathname === '/login') {
        isRefreshing = false;
        processQueue(new Error('Unauthenticated'));
        return Promise.reject(error);
      }
      
      try {
        // Attempt to refresh the token
        const tenantId = getTenantId();
        await apiClient.post(`/${tenantId}/auth/refresh`);
        
        // Token refreshed successfully, process queued requests
        processQueue();
        isRefreshing = false;
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear queue and redirect to login
        processQueue(refreshError as Error);
        isRefreshing = false;
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        originalError: error,
      });
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

export default apiClient;
