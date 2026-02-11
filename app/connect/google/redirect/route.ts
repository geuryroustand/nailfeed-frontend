import { type NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const access_token = searchParams.get("access_token");
    const id_token = searchParams.get("id_token");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL(`/auth?error=${error}`, request.url));
    }

    if (!access_token && !id_token) {
      return NextResponse.redirect(new URL("/auth?error=no_token", request.url));
    }

    const strapiUrl =
      process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:1337"
        : process.env.API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "https://api.nailfeed.com";

    // Build the callback URL for Strapi
    let callbackUrl = `${strapiUrl}/api/auth/google/callback`;

    if (access_token) {
      callbackUrl += `?access_token=${encodeURIComponent(access_token)}`;
    } else if (id_token) {
      callbackUrl += `?id_token=${encodeURIComponent(id_token)}`;
    }

    const response = await fetch(callbackUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        return NextResponse.redirect(new URL("/auth?error=provider_disabled", request.url));
      } else if (response.status === 401) {
        return NextResponse.redirect(new URL("/auth?error=invalid_token", request.url));
      } else {
        return NextResponse.redirect(new URL("/auth?error=strapi_auth_failed", request.url));
      }
    }

    const data = await response.json();

    if (!data.jwt) {
      return NextResponse.redirect(new URL("/auth?error=no_jwt", request.url));
    }

    await createSession(data.user, data.jwt, false);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Google redirect handler error:", error);
    return NextResponse.redirect(new URL("/auth?error=handler_error", request.url));
  }
}
