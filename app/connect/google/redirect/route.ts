import { type NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const access_token = searchParams.get("access_token");
    const id_token = searchParams.get("id_token");
    const error = searchParams.get("error");
    const state = searchParams.get("state");
    const origin = request.cookies.get("login_origin")?.value || "web";

    console.log("Google redirect callback received:", {
      access_token: !!access_token,
      id_token: !!id_token,
      error,
    });

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/auth?error=${error}`, request.url)
      );
    }

    if (!access_token && !id_token) {
      console.error("No token received from Google");
      return NextResponse.redirect(
        new URL("/auth?error=no_token", request.url)
      );
    }

    const strapiUrl =
      process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:1337"
        : process.env.API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "https://api.nailfeed.com";

    console.log("Using Strapi URL for Google auth:", strapiUrl);

    // Add more detailed logging to debug the environment detection
    console.log("Environment details:", {
      NODE_ENV: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === "development",
      API_URL: process.env.API_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      resolvedStrapiUrl: strapiUrl,
    });

    try {
      // Build the callback URL for Strapi
      let callbackUrl = `${strapiUrl}/api/auth/google/callback`;

      if (access_token) {
        callbackUrl += `?access_token=${encodeURIComponent(access_token)}`;
      } else if (id_token) {
        callbackUrl += `?id_token=${encodeURIComponent(id_token)}`;
      }

      console.log(
        "Calling Strapi callback:",
        callbackUrl.replace(/(token=)[^&]+/, "$1***")
      );

      const response = await fetch(callbackUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Strapi callback failed:", response.status, errorText);

        // More specific error messages
        if (response.status === 400) {
          return NextResponse.redirect(
            new URL("/auth?error=provider_disabled", request.url)
          );
        } else if (response.status === 401) {
          return NextResponse.redirect(
            new URL("/auth?error=invalid_token", request.url)
          );
        } else {
          return NextResponse.redirect(
            new URL("/auth?error=strapi_auth_failed", request.url)
          );
        }
      }

      const data = await response.json();
      console.log("Strapi authentication successful:", {
        hasJwt: !!data.jwt,
        hasUser: !!data.user,
        origin,
      });

      if (!data.jwt) {
        console.error("No JWT received from Strapi");
        return NextResponse.redirect(
          new URL("/auth?error=no_jwt", request.url)
        );
      }

      if (origin === "app") {
        const appUrl = `nailfeedapp://auth?jwt=${encodeURIComponent(
          data.jwt
        )}&userId=${encodeURIComponent(
          data.user?.id ?? ""
        )}&username=${encodeURIComponent(data.user?.username ?? "")}`;

        console.log("Redirecting to Expo app deep link:", appUrl);
        return NextResponse.redirect(appUrl);
      }

      await createSession(data.user, data.jwt, false);

      console.log("Session created, redirecting to home");
      return NextResponse.redirect(new URL("/", request.url));
    } catch (fetchError) {
      console.error("Error calling Strapi:", fetchError);
      return NextResponse.redirect(
        new URL("/auth?error=network_error", request.url)
      );
    }
  } catch (error) {
    console.error("Google redirect handler error:", error);
    return NextResponse.redirect(
      new URL("/auth?error=handler_error", request.url)
    );
  }
}
