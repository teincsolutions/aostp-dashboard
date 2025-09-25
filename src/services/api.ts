import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { getAppConfig } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";

// Single Axios instance with interceptors
class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl?: string) {
    const config = baseUrl || getAppConfig().apiBaseUrl;
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

// Lazy singleton instance
let apiServiceInstance: AxiosInstance | null = null;

export const getApiService = (): AxiosInstance => {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiService().getInstance();
  } else {
    // Check if the config has changed (for runtime reconfiguration)
    const currentApiBaseUrl = apiServiceInstance.defaults.baseURL || '';
    const newApiBaseUrl = getAppConfig().apiBaseUrl;
    if (currentApiBaseUrl !== newApiBaseUrl) {
      // Recreate the instance with new config
      apiServiceInstance = new ApiService().getInstance();
    }
  }
  return apiServiceInstance;
};

// For backward compatibility
export const apiService = getApiService();

// Export the class for custom instances if needed
export { ApiService };
