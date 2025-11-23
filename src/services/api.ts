import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { refreshToken } from "@/services/authService";

// Store the environment variable in a constant at the top level
const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Single Axios instance with interceptors
class ApiService {
  private axiosInstance: AxiosInstance;

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
            // Redirect to profile page with security tab
            if (typeof window !== "undefined") {
              window.location.href = "/profile?tab=security";
            }
          }
        }

        // Handle 401 Unauthorized - Token refresh
        if (error.response?.status === 401) {
          const authStore = useAuthStore.getState();
          const accessToken = authStore.tokens?.accessToken;
          if (accessToken && this.isTokenExpired(accessToken)) {
            const refreshTokenValue = authStore.tokens?.refreshToken;

            if (refreshTokenValue) {
              try {
                const newTokens = await refreshToken({
                  refreshToken: refreshTokenValue,
                });
                authStore.refreshTokens(newTokens);
                // Retry the original request with new token
                error.config.headers.set(
                  "Authorization",
                  `Bearer ${newTokens.accessToken}`
                );
                return this.axiosInstance.request(error.config);
              } catch {
                authStore.logout();
              }
            }
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
