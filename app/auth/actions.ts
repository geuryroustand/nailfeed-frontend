"use server";

import { cookies } from "next/headers";
import { AuthService } from "@/lib/auth-service";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  TOKEN_COOKIE,
  USER_COOKIE,
  CSRF_COOKIE,
  AuthResponse,
  AuthError,
} from "@/lib/config";

// Cookie names
const COOKIE_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

export async function registerAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  try {
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!username || !email || !password) {
      return { success: false, error: "Missing required fields" };
    }

    const response = await AuthService.register(username, email, password);

    if ("error" in response) {
      return { success: false, error: response.error };
    }

    if ("jwt" in response) {
      const cookieStore = await cookies();

      // Set the JWT cookie
      await cookieStore.set("jwt", response.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      // Set the user data cookie
      await cookieStore.set(
        "user_data",
        JSON.stringify({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
        }
      );

      // Revalidate the auth path to update the UI
      revalidatePath("/auth");
      revalidatePath("/");

      return { success: true, redirectTo: "/" };
    }

    return { success: false, error: "Registration failed" };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  try {
    const response = await AuthService.login(email, password);

    if (response && "jwt" in response) {
      // Set cookies with the JWT token and user data
      const { jwt, user } = response;
      const cookieStore = await cookies();

      // Calculate expiration - 30 days if remember me is checked, session otherwise
      const maxAge = rememberMe ? COOKIE_EXPIRY : undefined;

      // Set the auth token cookie
      cookieStore.set(TOKEN_COOKIE, jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge,
        path: "/",
      });

      // Set the user data cookie
      cookieStore.set(
        USER_COOKIE,
        JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge,
          path: "/",
        }
      );

      revalidatePath("/auth");
      return {
        success: true,
        error: null,
      };
    } else if (response && "error" in response) {
      // Login failed with specific error
      return {
        success: false,
        error: response.error,
      };
    } else {
      // Generic login failure
      return {
        success: false,
        error: "Invalid email or password",
      };
    }
  } catch (error) {
    console.error("Login action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function logoutAction() {
  // Clear the auth cookies
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(USER_COOKIE);

  revalidatePath("/");
  return { success: true };
}

export async function getSocialAuthUrl(provider: string, redirectUri: string) {
  try {
    const csrfToken = uuidv4();
    const cookieStore = await cookies();

    // Store the CSRF token in a cookie
    cookieStore.set(CSRF_COOKIE, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 5, // 5 minutes
      path: "/",
    });

    // Get the authorization URL from the social auth service
    const authUrl = await AuthService.getAuthorizationUrl(
      provider,
      redirectUri
    );
    return { success: true, url: authUrl };
  } catch (error) {
    console.error("Social auth URL error:", error);
    return { success: false, error: "Failed to get authorization URL" };
  }
}

export async function initiateSocialAuthAction(provider: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/connect/${provider}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to initiate social auth");
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Social auth initiation error:", error);
    return {
      success: false,
      error: "Failed to initiate social authentication",
    };
  }
}
