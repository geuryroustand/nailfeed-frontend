import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/get-api-base-url"

const API_BASE_URL = getApiBaseUrl()
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

// Helper: normalize URL join
const joinUrl = (base: string, path: string) => {
  const b = base.endsWith("/") ? base.slice(0, -1) : base
  const p = path.startsWith("/") ? path : `/${path}`
  return `${b}${p}`
}

/**
 * POST /api/auth-proxy
 * Body: { endpoint: string, method?: string, data?: any, headers?: Record<string, string>, authorizationOverride?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { endpoint, method = "GET", data, headers: incomingHeaders = {}, authorizationOverride } = body || {}

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Missing or invalid 'endpoint'." } },
        { status: 400 },
      )
    }

    const url = joinUrl(API_BASE_URL, endpoint)

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const allowedHeaderNames = new Set(["content-type", "accept"])
    for (const [k, v] of Object.entries(incomingHeaders || {})) {
      if (typeof v === "string" && allowedHeaderNames.has(k.toLowerCase())) {
        headers[k] = v
      }
    }

    // Await cookies per Next.js 15 dynamic API [^2][^3]
    const cookieStore = await cookies()
    const jwt =
      cookieStore.get("jwt")?.value ?? cookieStore.get("authToken")?.value ?? cookieStore.get("auth_token")?.value

    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    } else if (authorizationOverride && typeof authorizationOverride === "string") {
      headers["Authorization"] = authorizationOverride
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: "no-store",
    }

    if (method.toUpperCase() !== "GET" && data !== undefined) {
      fetchOptions.body = typeof data === "string" ? data : JSON.stringify(data)
    }

    const resp = await fetch(url, fetchOptions)

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
    console.error("API proxy error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
