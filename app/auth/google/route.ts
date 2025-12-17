import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin") ?? "web";

  console.log("Starting Google auth flow from:", origin);

  const strapiUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:1337"
      : process.env.NEXT_PUBLIC_API_URL || "https://api.nailfeed.com";
  const frontendUrl = request.nextUrl.origin;
  const redirectUrl = `${frontendUrl}/connect/google/redirect?origin=${encodeURIComponent(
    origin
  )}`;
  const redirectToStrapi = `${strapiUrl}/api/connect/google?redirectUrl=${encodeURIComponent(
    redirectUrl
  )}`;

  console.log("Redirecting to Strapi Google connect:", {
    origin,
    redirectToStrapi,
    redirectUrl,
  });

  return NextResponse.redirect(redirectToStrapi);
}
