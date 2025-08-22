import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookiesToClear = ["authToken", "jwt", "auth_token", "userId", "pendingVerificationEmail", "user", "session"]

    cookiesToClear.forEach((cookieName) => {
      cookies().delete(cookieName)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}
