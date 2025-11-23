import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { refreshToken } from "@/services/authService";

// Store the environment variable in a constant at the top level
const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Single Axios instance with interceptors
class ApiService {
  private axiosInstance: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: any[] = [];

  constructor(baseUrl?: string, publicMode: boolean = false) {
    const config = baseUrl || NEXT_PUBLIC_API_BASE_URL;
    this.axiosInstance = axios.create({
      baseURL: config,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!publicMode) {
      this.setupInterceptors();
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private setupInterceptors(): void {
    // Request interceptor for JWT token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get access token from Zustand store
        const authStore = useAuthStore.getState();
        const accessToken = authStore.tokens?.accessToken;

        if (accessToken) {
          config.headers.set("Authorization", `Bearer ${accessToken}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling 401, 403, and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle 403 Forbidden - Check for mustChangePassword
        if (error.response?.status === 403) {
          const message = error.response?.data?.message || "";
          if (message.toLowerCase().includes("must change your password")) {
            // Only redirect if not already on profile page to prevent loop
            if (typeof window !== "undefined") {
              const currentPath = window.location.pathname;
              if (!currentPath.startsWith("/profile")) {
                window.location.href = "/profile?tab=security";
              }
            }
          }
        }

        // Handle 401 Unauthorized - Token refresh
        if (
          error.response?.status === 401 &&
          error.config &&
          !error.config._retry
        ) {
          const originalRequest = error.config;

          // Skip token refresh for login and refresh endpoints
          if (
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/refresh") ||
            originalRequest.url?.includes("/auth/login/2fa")
          ) {
            // These are authentication endpoints, don't try to refresh token
            // Just reject the error so the login form can handle it
            return Promise.reject(error);
          }

          const authStore = useAuthStore.getState();
          const accessToken = authStore.tokens?.accessToken;
          const refreshTokenValue = authStore.tokens?.refreshToken;

          // If no access token or refresh token, just reject (user not logged in)
          if (!accessToken || !refreshTokenValue) {
            // Don't redirect to login here - might be a login attempt
            return Promise.reject(error);
          }

          // If token is expired, try to refresh
          if (this.isTokenExpired(accessToken)) {
            if (this.isRefreshing) {
              // If already refreshing, queue this request
              return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
              })
                .then((token) => {
                  originalRequest.headers.set(
                    "Authorization",
                    `Bearer ${token}`
                  );
                  return this.axiosInstance.request(originalRequest);
                })
                .catch((err) => {
                  return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            this.isRefreshing = true;

            try {
              const newTokens = await refreshToken({
                refreshToken: refreshTokenValue,
              });
              authStore.refreshTokens(newTokens);
              this.isRefreshing = false;
              this.processQueue(null, newTokens.accessToken);

              // Retry the original request with new token
              originalRequest.headers.set(
                "Authorization",
                `Bearer ${newTokens.accessToken}`
              );
              return this.axiosInstance.request(originalRequest);
            } catch (refreshError) {
              this.isRefreshing = false;
              this.processQueue(refreshError, null);
              authStore.logout();
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              return Promise.reject(refreshError);
            }
          } else {
            // Token is not expired but got 401, logout
            authStore.logout();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }
  // Get the raw axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Singleton instance
export const apiService = new ApiService().getInstance();

// Public instance without auth headers
export const publicApiService = new ApiService(undefined, true).getInstance();

// Export the class for custom instances if needed
export { ApiService };
