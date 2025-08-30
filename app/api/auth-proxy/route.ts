import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Server-only environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

// Helper: normalize URL join
function joinUrl(base: string, path: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base
  const p = path.startsWith("/") ? path : `/${path}`
  return `${b}${p}`
}

/**
 * POST /api/auth-proxy
 * Body: { endpoint: string, method?: string, data?: any, headers?: Record<string, string>, authorizationOverride?: string }
 * Behavior:
 * - Builds a request to the backend at API_BASE_URL + endpoint
 * - Authorization priority: cookie JWT > authorizationOverride (from client) > SERVER_API_TOKEN
 * - Never exposes secrets to the client; runs server-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { endpoint, method = "GET", data, headers: incomingHeaders = {}, authorizationOverride } = body || {}

    if (endpoint && endpoint.includes("/comments/")) {
      console.log("[v0] Auth proxy handling comment request:", { endpoint, method })
    }

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "bad_request",
            message: "Missing or invalid 'endpoint'.",
          },
        },
        { status: 400 },
      )
    }

    const upperMethod = String(method).toUpperCase()
    const needsUserIdentity =
      /\/api\/(likes|comments|push-subscriptions)(\/|$)/.test(endpoint) &&
      !["GET", "HEAD", "OPTIONS"].includes(upperMethod)

    const url = joinUrl(API_BASE_URL, endpoint)

    // Start with safe defaults. Whitelist a small set of headers from the client.
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Allow forwarding a few benign headers. Do not forward auth from client blindly.
    const allowedHeaderNames = new Set(["content-type", "accept"])
    for (const [k, v] of Object.entries(incomingHeaders || {})) {
      if (typeof v === "string" && allowedHeaderNames.has(k.toLowerCase())) {
        headers[k] = v
      }
    }

    const cookieStore = await cookies()

    // Try multiple cookie names that might contain the JWT
    const jwtCookie = cookieStore.get("jwt")
    const authTokenCookie = cookieStore.get("authToken")
    const auth_tokenCookie = cookieStore.get("auth_token")

    // Debug logging for comment requests
    if (endpoint && endpoint.includes("/comments/")) {
      console.log("[v0] Cookie debug for comment request:", {
        jwtCookie: jwtCookie ? `present (length: ${jwtCookie.value.length})` : "not found",
        authTokenCookie: authTokenCookie ? `present (length: ${authTokenCookie.value.length})` : "not found",
        auth_tokenCookie: auth_tokenCookie ? `present (length: ${auth_tokenCookie.value.length})` : "not found",
        hasServerToken: !!SERVER_API_TOKEN,
        authorizationOverride: authorizationOverride ? "provided" : "not provided",
      })
    }

    const jwt = jwtCookie?.value ?? authTokenCookie?.value ?? auth_tokenCookie?.value ?? null

    if (needsUserIdentity && !jwt) {
      return NextResponse.json({ error: { code: "unauthorized", message: "User JWT required" } }, { status: 401 })
    }

    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
      if (endpoint && endpoint.includes("/comments/")) {
        console.log("[v0] Using JWT from cookies for comment request, token length:", jwt.length)
      }
    } else if (authorizationOverride && typeof authorizationOverride === "string") {
      headers["Authorization"] = authorizationOverride
      if (endpoint && endpoint.includes("/comments/")) {
        console.log("[v0] Using authorization override for comment request")
      }
    } else if (!needsUserIdentity && SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
      if (endpoint && endpoint.includes("/comments/")) {
        console.log("[v0] Using server API token for comment request")
      }
    } else {
      if (endpoint && endpoint.includes("/comments/")) {
        console.log("[v0] No authorization found for comment request - this will likely fail")
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: "no-store",
    }

    if (method.toUpperCase() !== "GET" && data !== undefined) {
      fetchOptions.body = typeof data === "string" ? data : JSON.stringify(data)
    }

    if (endpoint && endpoint.includes("/comments/")) {
      console.log("[v0] Making request to Strapi:", {
        url,
        method,
        hasAuth: !!headers["Authorization"],
        authType: headers["Authorization"] ? headers["Authorization"].substring(0, 20) + "..." : "none",
      })
    }

    const resp = await fetch(url, fetchOptions)

    if (endpoint && endpoint.includes("/comments/")) {
      console.log("[v0] Strapi response:", {
        status: resp.status,
        statusText: resp.statusText,
        ok: resp.ok,
      })

      // If it's an error response, log more details
      if (!resp.ok) {
        const errorText = await resp.text()
        console.log("[v0] Strapi error response body:", errorText)

        // Return the error response
        try {
          const errorJson = JSON.parse(errorText)
          return NextResponse.json(errorJson, { status: resp.status })
        } catch {
          return NextResponse.json({ error: errorText }, { status: resp.status })
        }
      }
    }

    // Proxy back response as-is (JSON or text)
    const contentType = resp.headers.get("content-type") || ""
    const status = resp.status

    // Check if the response should have no body
    if (status === 204 || status === 205 || (status >= 100 && status < 200)) {
      return new NextResponse(null, { status })
    }

    if (contentType.includes("application/json")) {
      try {
        const json = await resp.json()
        return NextResponse.json(json, { status })
      } catch (error) {
        console.log("[v0] Failed to parse JSON response, returning empty response")
        return new NextResponse(null, { status })
      }
    }

    try {
      const text = await resp.text()
      if (!text && (status === 200 || status === 201)) {
        return new NextResponse(null, { status })
      }
      return new NextResponse(text, {
        status,
        headers: { "content-type": contentType || "text/plain" },
      })
    } catch (error) {
      console.log("[v0] Failed to read response text, returning empty response")
      return new NextResponse(null, { status })
    }
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
