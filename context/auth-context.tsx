"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AuthService, type User, type AuthResponse } from "@/lib/auth-service";
import {
  refreshAuthToken,
  fetchWithTokenRefresh,
  subscribeToTokenRefresh,
} from "@/lib/token-refresh";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (
    code: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<User | null>;
  uploadProfileImage: (file: File) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  handleSocialAuth: (
    response: AuthResponse | { error: string }
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token refresh interval (every 10 minutes)
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000;

function SearchParamsProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");

  // Store the callback URL in a ref or state if needed
  useEffect(() => {
    if (callbackUrl) {
      // You can store this in a ref or state if needed
      console.log("Callback URL:", callbackUrl);
    }
  }, [callbackUrl]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Fetch with token refresh
  const authenticatedFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      return fetchWithTokenRefresh(url, options);
    },
    []
  );

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Attempting to refresh token...");
      const newToken = await refreshAuthToken();
      if (newToken) {
        console.log("Token refreshed successfully");
        setToken(newToken);

        // Fetch user data with new token
        const userData = await AuthService.getCurrentUser(newToken);
        if (userData) {
          setUser(userData);
        }

        return true;
      }
      console.log("Token refresh failed - no new token returned");
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }, []);

  // Handle token change
  const handleTokenChange = useCallback(async (newToken: string | null) => {
    if (newToken) {
      setToken(newToken);
      // Fetch user data with new token
      const userData = await AuthService.getCurrentUser(newToken);
      if (userData) {
        setUser(userData);
      } else {
        // If user data fetch fails, clear everything
        setUser(null);
        setToken(null);
        AuthService.clearTokens();
      }
    } else {
      // If token is null, clear user and token
      setUser(null);
      setToken(null);
    }
  }, []);

  // Subscribe to token refresh
  useEffect(() => {
    subscribeToTokenRefresh(handleTokenChange);
  }, [handleTokenChange]);

  // Set up token refresh interval
  useEffect(() => {
    if (!token) return;

    // Check token on interval
    const intervalId = setInterval(async () => {
      const { accessToken } = AuthService.getStoredTokens();
      if (accessToken && AuthService.isTokenExpiringSoon(accessToken)) {
        await refreshToken();
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [token, refreshToken]);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { accessToken, expiresAt } = AuthService.getStoredTokens();

      if (accessToken) {
        // If token is expired or about to expire, refresh it
        if (expiresAt && Date.now() >= expiresAt - 5 * 60 * 1000) {
          const success = await refreshToken();
          if (!success) {
            setIsLoading(false);
            return;
          }
        } else {
          // Use existing token
          setToken(accessToken);

          // Fetch user data
          const userData = await AuthService.getCurrentUser(accessToken);
          if (userData) {
            setUser(userData);
          } else {
            // If user data fetch fails, try to refresh token
            const success = await refreshToken();
            if (!success) {
              AuthService.clearTokens();
            }
          }
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [refreshToken]);

  // Login function
  const login = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(identifier, password);

      if (response && "error" in response) {
        // Return the specific error message
        return { success: false, error: response.error };
      }

      if (response && "jwt" in response) {
        handleAuthSuccess(response);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await AuthService.register(username, email, password);
      if (response && "jwt" in response) {
        handleAuthSuccess(response);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    AuthService.clearTokens();
    router.push("/auth");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  // Forgot password
  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      return await AuthService.forgotPassword(email);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (
    code: string,
    password: string,
    passwordConfirmation: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await AuthService.resetPassword(
        code,
        password,
        passwordConfirmation
      );
      if (response) {
        handleAuthSuccess(response);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (
    userData: Partial<User>
  ): Promise<User | null> => {
    if (!token) return null;
    setIsLoading(true);
    try {
      const updatedUser = await AuthService.updateProfile(token, userData);
      if (updatedUser) {
        setUser(updatedUser);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated",
        });
        return updatedUser;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile image
  const uploadProfileImage = async (file: File): Promise<boolean> => {
    if (!token || !user) return false;
    setIsLoading(true);
    try {
      const success = await AuthService.uploadProfileImage(
        token,
        user.id,
        file
      );
      if (success) {
        // Refresh user data to get updated image
        const updatedUser = await AuthService.getCurrentUser(token);
        if (updatedUser) {
          setUser(updatedUser);
        }
        toast({
          title: "Image uploaded",
          description: "Your profile image has been updated",
        });
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle successful authentication
  const handleAuthSuccess = (response: AuthResponse) => {
    setToken(response.jwt);
    setUser(response.user);
    setIsLoading(false);
  };

  const handleSocialAuth = async (
    response: AuthResponse | { error: string }
  ): Promise<boolean> => {
    try {
      if ("error" in response) {
        toast({
          title: "Authentication Error",
          description: response.error,
          variant: "destructive",
        });
        return false;
      }

      handleAuthSuccess(response);
      return true;
    } catch (error) {
      console.error("Social auth error:", error);
      return false;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    uploadProfileImage,
    refreshToken,
    authenticatedFetch,
    handleSocialAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsProvider>{children}</SearchParamsProvider>
      </Suspense>
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
