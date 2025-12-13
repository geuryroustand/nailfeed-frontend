import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin") ?? "web";

  console.log("Starting Google auth flow from:", origin);

  const strapiUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:1337"
      : process.env.NEXT_PUBLIC_API_URL || "https://api.nailfeed.com";

  const redirectToStrapi = `${strapiUrl}/api/connect/google`;

  console.log("Redirecting to Strapi Google connect:", {
    origin,
    redirectToStrapi,
  });

  const response = NextResponse.redirect(redirectToStrapi);

  response.cookies.set("login_origin", origin, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
