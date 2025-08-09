import { NextResponse } from "next/server"

export async function GET() {
  // Never return the token value; only non-sensitive info
  const tokenExists = !!process.env.API_TOKEN
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
  return NextResponse.json({ tokenExists, apiUrl })
}
