import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

// Join base and path
function joinUrl(base: string, path: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base
  const p = path.startsWith("/") ? path : `/${path}`
  return `${b}${p}`
}

/**
 * POST /api/auth-proxy/upload?endpoint=/api/upload
 * Accepts multipart/form-data and forwards to the backend with Authorization.
 */
export async function POST(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get("endpoint") || "/api/upload"
    const url = joinUrl(API_BASE_URL, endpoint)

    const formData = await request.formData()

    // Determine Authorization header: JWT cookie > server token
    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value
    const headers: HeadersInit = {}
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`
    else if (SERVER_API_TOKEN) headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`

    // Important: DO NOT set Content-Type header here. Let fetch set the multipart boundary automatically.
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    })

    const contentType = resp.headers.get("content-type") || ""
    const status = resp.status

    if (contentType.includes("application/json")) {
      const json = await resp.json()
      return NextResponse.json(json, { status })
    }

    const text = await resp.text()
    return new NextResponse(text, {
      status,
      headers: { "content-type": contentType || "text/plain" },
    })
  } catch (error) {
    console.error("Upload proxy error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
