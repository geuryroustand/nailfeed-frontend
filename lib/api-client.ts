import { API_CONFIG, constructApiUrl, getAuthHeaders } from "./config";

// Cache configuration - DISABLED AS REQUESTED
// const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
// const cache: Record<string, { data: any; timestamp: number }> = {}

// Function to clear cache for specific endpoints or all cache - DISABLED
export const clearCache = (endpoint?: string) => {
  console.log("Cache is disabled, nothing to clear");
  /* Original code commented out
  if (endpoint) {
    // Clear specific endpoint
    const fullUrl = constructUrl(endpoint)
    delete cache[fullUrl]
    console.log(`Cleared cache for endpoint: ${endpoint}`)
  } else {
    // Clear all cache
    Object.keys(cache).forEach((key) => delete cache[key])
    console.log("Cleared all API cache")
  }
  */
};

// Helper function to get auth token from cookies (works on both client and server)
const getAuthToken = async (): Promise<string | undefined> => {
  if (typeof window !== "undefined") {
    // Client-side cookie access
    const cookies = document.cookie.split(";");
    const jwtCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("jwt=")
    );
    if (jwtCookie) {
      const token = jwtCookie.split("=")[1].trim();
      // Check if token is valid (not expired and has correct format)
      if (isValidToken(token)) {
        console.log("Found valid JWT token in client-side cookies");
        return token;
      } else {
        console.log("Found invalid JWT token, removing it");
        // Remove invalid token
        document.cookie =
          "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    }
    console.log("No valid JWT token found in client-side cookies");
  } else {
    // Server-side cookie access
    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get("jwt");
    if (jwtCookie) {
      const token = jwtCookie.value;
      if (isValidToken(token)) {
        console.log("Found valid JWT token in server-side cookies");
        return token;
      } else {
        console.log("Found invalid JWT token, removing it");
        // Remove invalid token
        cookieStore.delete("jwt");
      }
    }
    console.log("No valid JWT token found in server-side cookies");
  }
  return undefined;
};

// Helper function to check if a token is valid
function isValidToken(token: string): boolean {
  try {
    // Check if token has the correct format (header.payload.signature)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }

    // Decode the payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Check if token is expired
    if (currentTime > expirationTime) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

// API client with methods for different HTTP verbs
export const apiClient = {
  // GET request with fallback to public endpoint if authentication fails
  async get(endpoint: string, options: RequestInit = {}) {
    try {
      const token = await getAuthToken();
      console.log("Auth token available:", token ? "Yes" : "No");
      console.log(
        "Public API token available:",
        API_CONFIG.PUBLIC_API_TOKEN ? "Yes" : "No"
      );

      // Get headers with proper token validation
      const headers = getAuthHeaders(token);
      console.log("Using headers:", headers);

      const url = constructApiUrl(endpoint);
      console.log(`Making GET request to ${url}`);

      // Ensure credentials are included
      const requestOptions: RequestInit = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: "include",
      };

      const response = await fetch(url, requestOptions);

      // If we get a 401, remove any user token and retry with public token
      if (response.status === 401) {
        console.log(
          "Got 401, removing any user token and retrying with public token"
        );

        // Remove any user token
        if (token) {
          if (typeof window !== "undefined") {
            document.cookie =
              "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          } else {
            const { cookies } = require("next/headers");
            const cookieStore = await cookies();
            cookieStore.delete("jwt");
          }
        }

        // Retry with public token
        const publicHeaders = getAuthHeaders();
        console.log("Retrying with public token headers:", publicHeaders);

        const publicResponse = await fetch(url, {
          ...options,
          headers: {
            ...publicHeaders,
            ...options.headers,
          },
          credentials: "include",
        });

        if (!publicResponse.ok) {
          const errorText = await publicResponse.text();
          console.error(
            `API error with public token (${publicResponse.status}): ${errorText}`
          );
          throw new Error(`API error (${publicResponse.status}): ${errorText}`);
        }

        return await publicResponse.json();
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `GET request failed: ${response.status} ${response.statusText}`
        );
        console.error("Error response:", errorText);
        console.error("Request URL:", url);
        console.error("Request headers:", requestOptions.headers);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error in apiClient.get:", error);
      throw error;
    }
  },

  // POST request
  async post(endpoint: string, data: any = {}, options: RequestInit = {}) {
    const url = constructApiUrl(endpoint);
    console.log(`Making POST request to ${url}`);

    try {
      // Get auth token
      const token = await getAuthToken();
      console.log(`Auth token available: ${token ? "Yes" : "No"}`);
      console.log(
        `Public API token available: ${
          API_CONFIG.PUBLIC_API_TOKEN ? "Yes" : "No"
        }`
      );

      // Set headers
      const headers = getAuthHeaders(token);
      console.log("Using headers:", headers);

      // Make the request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        ...options,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API POST request failed for ${url}:`, error);
      throw error;
    }
  },

  // PUT request
  async put(endpoint: string, data: any = {}, options: RequestInit = {}) {
    const url = constructApiUrl(endpoint);
    console.log(`Making PUT request to ${url}`);

    try {
      // Get auth token
      const token = await getAuthToken();
      console.log(`Auth token available: ${token ? "Yes" : "No"}`);
      console.log(
        `Public API token available: ${
          API_CONFIG.PUBLIC_API_TOKEN ? "Yes" : "No"
        }`
      );

      // Set headers
      const headers = getAuthHeaders(token);
      console.log("Using headers:", headers);

      // Make the request
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        ...options,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API PUT request failed for ${url}:`, error);
      throw error;
    }
  },

  // DELETE request
  async delete(endpoint: string, options: RequestInit = {}) {
    const url = constructApiUrl(endpoint);
    console.log(`Making DELETE request to ${url}`);

    try {
      // Get auth token
      const token = await getAuthToken();
      console.log(`Auth token available: ${token ? "Yes" : "No"}`);
      console.log(
        `Public API token available: ${
          API_CONFIG.PUBLIC_API_TOKEN ? "Yes" : "No"
        }`
      );

      // Set headers
      const headers = getAuthHeaders(token);
      console.log("Using headers:", headers);

      // Make the request
      const response = await fetch(url, {
        method: "DELETE",
        headers,
        ...options,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API DELETE request failed for ${url}:`, error);
      throw error;
    }
  },
};
