// Application constants
const getApiBaseUrl = () => {
  // Check for runtime environment variable (set via Docker --env-file)
  if (typeof window !== 'undefined') {
    // In browser, check if there's a global config set by the server
    const runtimeConfig = (window as any).__NEXT_RUNTIME_CONFIG__;
    if (runtimeConfig?.NEXT_PUBLIC_API_BASE_URL) {
      return runtimeConfig.NEXT_PUBLIC_API_BASE_URL;
    }
    // Fallback to build-time env var if available
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
  }
  // In server environment, fallback to env var or default
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
};

export const getAppConfig = () => ({
  name: 'Admin Dashboard',
  version: '1.0.0',
  apiBaseUrl: getApiBaseUrl(),
});

// For backward compatibility - this will be evaluated when the module loads
export const APP_CONFIG = getAppConfig();

// Export function to allow runtime reconfiguration
export const setRuntimeConfig = (config: { NEXT_PUBLIC_API_BASE_URL?: string }) => {
  if (typeof window !== 'undefined') {
    (window as any).__NEXT_RUNTIME_CONFIG__ = {
      ...(window as any).__NEXT_RUNTIME_CONFIG__ || {},
      ...config,
    };
  }
};

// Common constants
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
