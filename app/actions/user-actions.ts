"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { UserService, type UserUpdateInput } from "@/lib/services/user-service";
import { redirect } from "next/navigation";
import {
  validateImage,
  IMAGE_VALIDATION_PRESETS,
} from "@/lib/image-validation";
import { AuthService } from "@/lib/auth-service";

type UserProfileResponse = {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  profileImage?: {
    formats?: {
      thumbnail?: { url: string };
      small?: { url: string };
      medium?: { url: string };
      large?: { url: string };
    };
    url: string;
  };
  coverImage?: {
    formats?: {
      thumbnail?: { url: string };
      small?: { url: string };
      medium?: { url: string };
      large?: { url: string };
    };
    url: string;
  };
};

type UserActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type AuthResponse = {
  success: boolean;
  data?: UserProfileResponse;
  error?: string;
};

type ImageUploadResponse = {
  success: boolean;
  data?: {
    imageUrl: string;
  };
  error?: string;
};

/**
 * Get the current user's profile from the server
 */
export async function getCurrentUser(): Promise<UserProfileResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt")?.value;

    if (!token) {
      console.log("No JWT token found in cookies");
      return null;
    }

    const user = await AuthService.getCurrentUser(token);
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Get a user's profile by username
 */
export async function getUserByUsername(
  username: string
): Promise<UserActionResult<UserProfileResponse>> {
  try {
    const user = await UserService.getUserByUsername(username);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error(`Error in getUserByUsername action for ${username}:`, error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(
  formData: FormData
): Promise<UserActionResult<UserProfileResponse>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt")?.value;

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: formData.get("displayName"),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to update profile",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Upload a profile image
 */
export async function uploadProfileImage(
  formData: FormData
): Promise<ImageUploadResponse> {
  try {
    const userResult = await getCurrentUser();
    if (!userResult) {
      console.error("Failed to get current user for profile image upload");
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const userId = userResult.id;
    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("jwt")?.value;
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const uploadFormData = new FormData();
    uploadFormData.append("files", file);
    uploadFormData.append("ref", "plugin::users-permissions.user");
    uploadFormData.append("refId", userId.toString());
    uploadFormData.append("field", "profileImage");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    const updatedUserResult = await getCurrentUser();
    if (!updatedUserResult) {
      console.error("Failed to get updated user profile after image upload");
      return {
        success: false,
        error: "Failed to get updated profile",
      };
    }

    return {
      success: true,
      data: {
        imageUrl: updatedUserResult.profileImage?.url || "",
      },
    };
  } catch (error) {
    console.error("Error in uploadProfileImage:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

/**
 * Upload a cover image
 */
export async function uploadCoverImage(
  formData: FormData
): Promise<ImageUploadResponse> {
  try {
    const userResult = await getCurrentUser();
    if (!userResult) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const userId = userResult.id;
    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("jwt")?.value;
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const uploadFormData = new FormData();
    uploadFormData.append("files", file);
    uploadFormData.append("ref", "plugin::users-permissions.user");
    uploadFormData.append("refId", userId.toString());
    uploadFormData.append("field", "coverImage");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    const updatedUserResult = await getCurrentUser();
    if (!updatedUserResult) {
      return {
        success: false,
        error: "Failed to get updated profile",
      };
    }

    return {
      success: true,
      data: {
        imageUrl: updatedUserResult.coverImage?.url || "",
      },
    };
  } catch (error) {
    console.error("Error in uploadCoverImage:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

/**
 * Check if the user is authenticated
 */
export async function checkAuth(): Promise<
  UserActionResult<{ isAuthenticated: boolean }>
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt")?.value;

    if (!token) {
      return {
        success: true,
        data: { isAuthenticated: false },
      };
    }

    const user = await AuthService.getCurrentUser(token);
    return {
      success: true,
      data: { isAuthenticated: !!user },
    };
  } catch (error) {
    console.error("Error in checkAuth:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check authentication",
    };
  }
}

/**
 * Require authentication or redirect to login
 */
export async function requireAuth(
  callbackUrl?: string
): Promise<UserProfileResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt")?.value;

    if (!token) {
      console.log("No token found, redirecting to auth");
      redirect(
        `/auth${
          callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
        }`
      );
    }

    const user = await AuthService.getCurrentUser(token);
    if (!user) {
      console.log("Invalid token, redirecting to auth");
      redirect(
        `/auth${
          callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
        }`
      );
    }

    return user;
  } catch (error) {
    console.error("Error in requireAuth:", error);
    redirect(
      `/auth${
        callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
      }`
    );
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await AuthService.login(email, password);
    if (response && "jwt" in response) {
      const cookieStore = await cookies();
      cookieStore.set("jwt", response.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return {
        success: true,
        data: response.user,
      };
    }
    return {
      success: false,
      error: response?.error || "Login failed",
    };
  } catch (error) {
    console.error("Error in loginUser:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

export async function logoutUser(): Promise<AuthResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("jwt");
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in logoutUser:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Logout failed",
    };
  }
}
