import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { constructApiUrl, getAuthHeaders } from "@/lib/config";

interface CallbackPageProps {
  params: {
    provider: string;
  };
  searchParams: {
    access_token?: string;
    error?: string;
    code?: string;
    state?: string;
  };
}

export default async function CallbackPage({
  params,
  searchParams,
}: CallbackPageProps) {
  const { provider } = params;
  const { access_token, error, code, state } = searchParams;

  // Check for errors
  if (error) {
    redirect(`/auth?error=${error}`);
  }

  // Verify CSRF token if state is provided
  if (state) {
    const storedCsrf = cookies().get("social_auth_csrf")?.value;
    if (!storedCsrf || storedCsrf !== state) {
      redirect("/auth?error=invalid_state");
    }
  }

  try {
    // Handle the authentication based on provider
    if (access_token) {
      // Exchange the access token for user data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}/callback?access_token=${access_token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to authenticate");
      }

      const data = await response.json();

      // Set auth cookies
      cookies().set("auth_token", data.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      // Redirect to home page
      redirect("/");
    } else if (code) {
      // Exchange the code for an access token
      const response = await fetch(
        constructApiUrl(`/api/auth/${provider}/callback?code=${code}`),
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to authenticate");
      }

      const data = await response.json();

      // Set auth cookies
      cookies().set("auth_token", data.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      // Redirect to home page
      redirect("/");
    } else {
      // No token or code provided
      redirect("/auth?error=missing_token");
    }
  } catch (error) {
    console.error("Social auth callback error:", error);
    redirect("/auth?error=authentication_failed");
  }
}
