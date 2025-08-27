import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { APP_CONFIG } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";

// Single Axios instance with interceptors
class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl: string = APP_CONFIG.apiBaseUrl) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for JWT token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get access token from Zustand store
        const authStore = useAuthStore.getState();
        const accessToken = authStore.tokens?.accessToken;
        console.log("accessToken", accessToken);

        if (accessToken) {
          config.headers.set('Authorization', `Bearer ${accessToken}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
  // Get the raw axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export a singleton instance
export const apiService = new ApiService().getInstance();

// Export the class for custom instances if needed
export { ApiService };
