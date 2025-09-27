import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/authStore";
// Store the environment variable in a constant at the top level
const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Single Axios instance with interceptors
class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl?: string) {
    const config = baseUrl || NEXT_PUBLIC_API_BASE_URL;
    this.axiosInstance = axios.create({
      baseURL: config,
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

// Singleton instance
export const apiService = new ApiService().getInstance();

// Export the class for custom instances if needed
export { ApiService };
