import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const authToken = cookies().get("authToken")?.value

  return NextResponse.json({
    isAuthenticated: !!authToken,
  })
}
