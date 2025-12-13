import { type NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const access_token = searchParams.get("access_token");
    const id_token = searchParams.get("id_token");

    if (!access_token && !id_token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 400 }
      );
    }

    const strapiUrl =
      process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:1337"
        : process.env.API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "https://api.nailfeed.com";

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
      const errorText = await response.text();
      console.error("Strapi callback failed:", response.status, errorText);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.jwt) {
      return NextResponse.json({ error: "No JWT received" }, { status: 400 });
    }

    // Create session for web users
    await createSession(data.user, data.jwt, false);

    // Return data for mobile users
    return NextResponse.json({
      jwt: data.jwt,
      user: data.user,
    });
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
