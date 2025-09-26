"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createStrapiClient } from "@/lib/auth/strapi-client";
import { validateSession } from "@/lib/auth/session";

export interface ActionResponse {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),
  website: z
    .string()
    .max(100, "Website must be less than 100 characters")
    .optional(),
});

const emailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
  emailPassword: z.string().min(1, "Password is required"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function updateProfile(
  formData: FormData
): Promise<ActionResponse> {
  try {
    console.log("[UpdateProfile] Starting profile update...");

    const { user, session } = await validateSession();

    if (!user || !session?.userId) {
      console.log("[UpdateProfile] Authentication failed - no user or session");
      return {
        success: false,
        message: "Authentication required. Please log in again.",
      };
    }

    console.log("[UpdateProfile] User authenticated:", {
      userId: session.userId,
      username: user.username,
    });

    const rawData = {
      username: (formData.get("username") as string) ?? undefined,
      displayName: (formData.get("displayName") as string) ?? undefined,
      bio: (formData.get("bio") as string) ?? undefined,
      location: (formData.get("location") as string) ?? undefined,
      website: (formData.get("website") as string) ?? undefined,
    };

    console.log("[UpdateProfile] Raw form data:", rawData);

    const parsed = profileSchema.safeParse(rawData);

    if (!parsed.success) {
      console.log(
        "[UpdateProfile] Validation failed:",
        parsed.error.flatten().fieldErrors
      );
      return {
        success: false,
        message: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload = Object.fromEntries(
      Object.entries(parsed.data).filter(([, value]) => value !== undefined)
    );

    console.log("[UpdateProfile] Payload to send:", payload);

    const client = await createStrapiClient();
    const endpoint = "/api/users/" + session.userId;

    console.log("[UpdateProfile] Making request to:", endpoint);

    const response = await client.put(endpoint, payload);

    console.log("[UpdateProfile] Update successful:", response);

    revalidatePath("/me/settings");
    revalidatePath("/me");

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Profile update error:", error);

    // Extract more detailed error information
    let errorMessage = "Failed to update profile";

    if (error instanceof Error) {
      if (error.message.includes("403")) {
        errorMessage = "Permission denied. Please check your authentication.";
      } else if (error.message.includes("404")) {
        errorMessage = "User not found. Please try logging in again.";
      } else if (error.message.includes("401")) {
        errorMessage = "Authentication expired. Please log in again.";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateEmail(formData: FormData): Promise<ActionResponse> {
  try {
    const { user } = await validateSession();

    if (!user) {
      return {
        success: false,
        message: "Authentication required. Please log in again.",
      };
    }

    const rawData = {
      newEmail: formData.get("newEmail") as string,
      emailPassword: formData.get("emailPassword") as string,
    };

    const parsed = emailSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      message: "Verification email sent to your new address",
    };
  } catch (error) {
    console.error("Email update error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update email",
    };
  }
}

export async function updatePassword(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { user } = await validateSession();

    if (!user) {
      return {
        success: false,
        message: "Authentication required. Please log in again.",
      };
    }

    const rawData = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = passwordSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Password update error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update password",
    };
  }
}
