"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { AuthService, type AuthResponse } from "@/lib/auth-service";
import { redirect } from "next/navigation";

type FieldErrors = Record<string, string>;

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  // values are returned on error to repopulate inputs without clearing them
  values?: Partial<{
    identifier: string;
    rememberMe: string;
    username: string;
    email: string;
  }>;
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const loginSchema = z.object({
  identifier: z.string().min(1, { message: "Email or username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().default(false),
});

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(20, { message: "Username must be less than 20 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores",
      }),
    email: z
      .string()
      .regex(emailRegex, { message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    agreeTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must agree to the terms and conditions",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const toBoolean = (value: FormDataEntryValue | null): boolean => {
  if (!value) return false;
  const v = String(value).toLowerCase();
  return v === "true" || v === "on" || v === "1" || v === "yes";
};

const setSessionCookie = async (jwt: string, rememberMe: boolean) => {
  const isProd = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set("auth_token", jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4, // 30d or 4h
  });
};

/**
 * Server Action: Login via FormData
 */
export async function loginWithFormAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    const identifier = (formData.get("identifier") as string) || "";
    const password = (formData.get("password") as string) || "";
    const rememberMeBool = toBoolean(formData.get("rememberMe"));

    const parsed = loginSchema.safeParse({
      identifier,
      password,
      rememberMe: rememberMeBool,
    });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = (issue.path?.[0] as string) || "form";
        fieldErrors[key] = issue.message;
      }
      return {
        status: "error",
        message: "Please fix the errors and try again.",
        fieldErrors,
        values: { identifier, rememberMe: rememberMeBool ? "on" : "" },
      };
    }

    const result: AuthResponse | { error: string } | null =
      await AuthService.login(parsed.data.identifier, parsed.data.password);

    if (!result || "error" in result) {
      return {
        status: "error",
        message: result?.error || "Invalid credentials",
        values: {
          identifier: parsed.data.identifier,
          rememberMe: parsed.data.rememberMe ? "on" : "",
        },
      };
    }
    await setSessionCookie(result.jwt, parsed.data.rememberMe);
    return { status: "success", message: "Login successful" };
    return { status: "success", message: "Login successful" };
  } catch (err) {
    console.error("Login server action error:", err);
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Server Action: Register via FormData
 */
export async function registerWithFormAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    const username = (formData.get("username") as string) || "";
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";
    const agreeTerms = toBoolean(formData.get("agreeTerms"));

    const parsed = registerSchema.safeParse({
      username,
      email,
      password,
      confirmPassword,
      agreeTerms,
    });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = (issue.path?.[0] as string) || "form";
        fieldErrors[key] = issue.message;
      }
      return {
        status: "error",
        message: "Please fix the errors and try again.",
        fieldErrors,
        values: { username, email },
      };
    }

    const result: AuthResponse | { error: string } | null =
      await AuthService.register(
        parsed.data.username,
        parsed.data.email,
        parsed.data.password
      );

    if (!result || "error" in result) {
      return {
        status: "error",
        message: result?.error || "Registration failed",
        values: { username: parsed.data.username, email: parsed.data.email },
      };
    }

    await setSessionCookie(result.jwt, true);
    return { status: "success", message: "Registration successful" };
    return { status: "success", message: "Registration successful" };
  } catch (err) {
    console.error("Registration server action error:", err);
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Backwards-compatible object-based login action (if needed elsewhere)
 */
export const loginAction = async (data: {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const parsed = loginSchema.safeParse({
      identifier: data.identifier,
      password: data.password,
      rememberMe: Boolean(data.rememberMe),
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }
    const result: AuthResponse | { error: string } | null =
      await AuthService.login(parsed.data.identifier, parsed.data.password);
    if (!result || "error" in result) {
      return { success: false, error: result?.error || "Invalid credentials" };
    }
    await setSessionCookie(result.jwt, parsed.data.rememberMe);
    return { success: true };
  } catch (e) {
    console.error("loginAction error:", e);
    return { success: false, error: "Unexpected error" };
  }
};

/**
 * Backwards-compatible object-based register action (if needed elsewhere)
 */
export const registerAction = async (
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> => {
  const state = await registerWithFormAction({ status: "idle" }, formData);
  return { success: state.status === "success", error: state.message };
};

/**
 * Server Action: Initiate Social Authentication
 */
export async function initiateSocialAuthAction(
  prevState: unknown,
  formData: FormData
) {
  try {
    const provider = String(formData.get("provider") || "")
      .trim()
      .toLowerCase();
    if (!provider) {
      redirect("/auth?error=invalid_provider");
      return;
    }

    // Allow-list providers you support; keep flexible to avoid breaking flows
    const allowed = new Set(["google", "facebook", "instagram"]);
    if (!allowed.has(provider)) {
      redirect("/auth?error=invalid_provider");
      return;
    }

    redirect(`/auth/social/${provider}`);
  } catch {
    redirect("/auth?error=unexpected_error");
  }
}
