// API Configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337",

  // API Token for server-side requests
  API_TOKEN: process.env.API_TOKEN,

  // Public API Token for client-side requests
  PUBLIC_API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN,
} as const;

// Helper function to construct API URLs
export function constructApiUrl(endpoint: string): string {
  if (!API_CONFIG.BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
  }

  // Remove trailing slash from base URL if present
  const baseUrl = API_CONFIG.BASE_URL.endsWith("/")
    ? API_CONFIG.BASE_URL.slice(0, -1)
    : API_CONFIG.BASE_URL;

  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  // Remove 'api/' from endpoint if it's already there
  const finalEndpoint = cleanEndpoint.startsWith("api/")
    ? cleanEndpoint.slice(4)
    : cleanEndpoint;

  // If the base URL already ends with /api, don't add it again
  if (baseUrl.endsWith("/api")) {
    return `${baseUrl}/${finalEndpoint}`;
  }

  return `${baseUrl}/api/${finalEndpoint}`;
}

// Helper function to get auth headers
export function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add API token if available
  if (API_CONFIG.PUBLIC_API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_CONFIG.PUBLIC_API_TOKEN}`;
  }

  // Add JWT token if provided
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Cookie names
export const TOKEN_COOKIE = "auth_token";
export const USER_COOKIE = "user_data";
export const CSRF_COOKIE = "social_auth_csrf";

// Auth response types
export interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    displayName?: string;
  };
}

export interface AuthError {
  error: string;
}
