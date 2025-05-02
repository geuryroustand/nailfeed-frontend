import { NextResponse } from "next/server"

export async function GET() {
  // Safely check if the token exists on the server side
  const hasApiToken = !!process.env.API_TOKEN

  // Return only a boolean indicating if the token exists, not the token itself
  return NextResponse.json({ hasToken: hasApiToken })
}
