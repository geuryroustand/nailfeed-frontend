import { toast } from "@/hooks/use-toast";
import { API_CONFIG, constructApiUrl, getAuthHeaders } from "./config";

// Types for authentication
export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  profileImage?: {
    url: string;
  };
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface TokenData {
  token: string;
  expiresAt: number;
}

// Base URL for API requests
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nailfeed-backend-production.up.railway.app/api";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "";

// Token expiration buffer (5 minutes in milliseconds)
const TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000;

// Authentication service
export const AuthService = {
  // Register a new user
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse | { error: string }> {
    try {
      const response = await fetch(constructApiUrl("/auth/local/register"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: error.error.message || "Registration failed" };
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      console.error("Registration error:", error);
      return {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  },

  // Login user
  async login(
    identifier: string,
    password: string
  ): Promise<AuthResponse | { error: string } | null> {
    try {
      const response = await fetch(constructApiUrl("/auth/local"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error.message || "Login failed" };
      }

      const data = await response.json();
      if (data?.jwt) {
        // Set the JWT cookie on the client side
        document.cookie = `jwt=${data.jwt}; path=/; max-age=2592000; SameSite=Lax; Secure`;
      }
      return data;
    } catch (error) {
      console.error("Login error:", error);
      return {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  },

  // Request password reset
  async forgotPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch(constructApiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || "Password reset request failed");
      }

      return true;
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Request failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  },

  // Reset password with token
  async resetPassword(
    code: string,
    password: string,
    passwordConfirmation: string
  ): Promise<AuthResponse | null> {
    try {
      const response = await fetch(constructApiUrl("/auth/reset-password"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code,
          password,
          passwordConfirmation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || "Password reset failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Password reset failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    }
  },

  // Get current user profile
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const response = await fetch(
        constructApiUrl("/users/me?populate=profileImage"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          return null;
        }
        const error = await response.json();
        throw new Error(error.error.message || "Failed to get user profile");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(
    token: string,
    userData: Partial<User>
  ): Promise<User | null> {
    try {
      const response = await fetch(constructApiUrl("/users/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || "Failed to update profile");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Profile update failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    }
  },

  // Upload profile image
  async uploadProfileImage(
    token: string,
    userId: number,
    file: File
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("ref", "plugin::users-permissions.user");
      formData.append("refId", userId.toString());
      formData.append("field", "profileImage");

      const response = await fetch(constructApiUrl("/api/upload"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || "Failed to upload image");
      }

      return true;
    } catch (error) {
      console.error("Upload profile image error:", error);
      toast({
        title: "Image upload failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse | null> {
    try {
      const response = await fetch(constructApiUrl("/token/refresh"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || "Token refresh failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  },

  // Parse JWT token to get expiration time
  parseJwt(token: string): { exp: number } | null {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("JWT parse error:", error);
      return null;
    }
  },

  // Check if token is about to expire
  isTokenExpiringSoon(token: string): boolean {
    const parsed = this.parseJwt(token);
    if (!parsed) return true;

    const expirationTime = parsed.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Token is expiring soon if it's within the buffer time
    return expirationTime - currentTime < TOKEN_EXPIRATION_BUFFER;
  },

  // Store tokens in localStorage with expiration
  storeTokens(accessToken: string, refreshToken?: string): void {
    const parsed = this.parseJwt(accessToken);
    if (!parsed) return;

    const expiresAt = parsed.exp * 1000; // Convert to milliseconds

    // Store access token with expiration
    localStorage.setItem("auth_token", accessToken);
    localStorage.setItem("token_expires_at", expiresAt.toString());

    // Store refresh token if provided
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
  },

  // Get stored tokens
  getStoredTokens(): {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  } {
    const accessToken = localStorage.getItem("auth_token");
    const refreshToken = localStorage.getItem("refresh_token");
    const expiresAtStr = localStorage.getItem("token_expires_at");
    const expiresAt = expiresAtStr ? Number.parseInt(expiresAtStr, 10) : null;

    return { accessToken, refreshToken, expiresAt };
  },

  // Clear stored tokens
  clearTokens(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
  },

  // Get authorization URL for social auth
  async getAuthorizationUrl(
    provider: string,
    redirectUri: string
  ): Promise<string> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/auth/${provider}/redirect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ redirectUri }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get authorization URL");
    }

    const data = await response.json();
    return data.url;
  },
};
