import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const strapiUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:1337"
      : process.env.NEXT_PUBLIC_API_URL || "https://api.nailfeed.com";

  const frontendUrl = request.nextUrl.origin;
  const redirectUrl = `${frontendUrl}/connect/google/redirect`;
  const redirectToStrapi = `${strapiUrl}/api/connect/google?redirectUrl=${encodeURIComponent(redirectUrl)}`;

  return NextResponse.redirect(redirectToStrapi);
}
