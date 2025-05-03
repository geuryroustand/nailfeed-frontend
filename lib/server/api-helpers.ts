import { cookies } from "next/headers";
import { API_CONFIG, constructApiUrl, getAuthHeaders } from "../config";

// Get auth token with priority order: user JWT > API token
export function getServerAuthToken(): string | undefined {
  try {
    // Try to get user JWT from cookies first (server-side)
    const cookieStore = cookies();
    const jwtCookie = cookieStore.get("jwt");
    if (jwtCookie?.value) return jwtCookie.value;

    // Fall back to server-side API token (not exposed to client)
    return API_CONFIG.API_TOKEN;
  } catch (error) {
    console.error("Error getting server auth token:", error);
    return undefined;
  }
}

// Helper for making authenticated API requests from the server
export async function serverFetch(endpoint: string, options: RequestInit = {}) {
  const token = getServerAuthToken();
  const url = constructApiUrl(endpoint);

  const headers = getAuthHeaders(token);

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}
