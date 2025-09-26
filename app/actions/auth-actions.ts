"use server";

import { revalidatePath } from "next/cache";
import { validateSession, deleteSession } from "@/lib/auth/session";

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export async function getCurrentUser() {
  try {
    const { user } = await validateSession();
    return user;
  } catch (error) {
    console.error("[auth-actions] Failed to fetch current user:", error);
    return null;
  }
}

export async function logoutAction(): Promise<AuthResponse> {
  try {
    await deleteSession();

    revalidatePath("/", "layout");
    revalidatePath("/me", "layout");
    revalidatePath("/me/settings", "layout");

    return { success: true };
  } catch (error) {
    console.error("[auth-actions] Logout action failed:", error);
    return { success: false, error: "Logout failed" };
  }
}
