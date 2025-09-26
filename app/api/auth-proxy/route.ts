import { type NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"

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
    const {
      endpoint,
      method = "GET",
      data,
      headers: incomingHeaders = {},
      authorizationOverride,
      useServerToken = false,
    } = body || {}

    if (endpoint && endpoint.includes("/comments/")) {
      console.log("[v0] Auth proxy handling comment request:", { endpoint, method })
    }

    if (endpoint && endpoint.includes("/posts")) {
      console.log("[v0] Auth proxy handling post request:", { endpoint, method })
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

    // ✅ SECURITY: Use secure session system instead of legacy cookies
    const session = await verifySession()
    let jwt: string | undefined

    if (!useServerToken && session) {
      // Get the Strapi JWT from session - we'll need to store this during login
      jwt = session.strapiJWT as string

      if (endpoint && endpoint.includes("/posts")) {
        console.log("[v0] Auth-proxy: Using JWT from secure session")
      }
    }

    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
      if (endpoint && endpoint.includes("/posts")) {
        console.log("[v0] Auth-proxy: Using JWT from cookies, token starts with:", jwt.substring(0, 20) + "...")
      }
    } else if (authorizationOverride && typeof authorizationOverride === "string") {
      headers["Authorization"] = authorizationOverride
      if (endpoint && endpoint.includes("/posts")) {
        console.log("[v0] Auth-proxy: Using authorization override")
      }
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
      if (endpoint && endpoint.includes("/posts")) {
        console.log("[v0] Auth-proxy: Using server API token")
      }
    } else {
      if (endpoint && endpoint.includes("/posts")) {
        console.log("[v0] Auth-proxy: NO AUTHORIZATION FOUND - this will likely fail")
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

    if (endpoint && endpoint.includes("/posts")) {
      console.log("[v0] Auth-proxy: Making request to Strapi:", {
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

/**
 * GET /api/auth-proxy?endpoint={endpoint}&param1=value1&param2=value2
 * Supports GET requests with query parameters for infinite scrolling and other use cases
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "bad_request",
            message: "Missing 'endpoint' query parameter.",
          },
        },
        { status: 400 }
      )
    }

    // Build query parameters (excluding 'endpoint')
    const queryParams = new URLSearchParams()
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'endpoint') {
        queryParams.append(key, value)
      }
    }

    // Check user session for JWT token
    const sessionResult = await verifySession()
    const userJwt = sessionResult?.strapiJWT || null

    // Authorization priority: user JWT > server token
    const token = userJwt || SERVER_API_TOKEN

    if (!token) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "No authentication token available" } },
        { status: 401 }
      )
    }

    // Build final URL with query parameters
    const finalUrl = joinUrl(API_BASE_URL, endpoint) + (queryParams.toString() ? `?${queryParams.toString()}` : '')

    console.log(`[AuthProxy GET] Requesting: ${finalUrl}`)

    const resp = await fetch(finalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(userJwt && { "X-User-Context": "authenticated" }),
      },
    })

    console.log(`[AuthProxy GET] Response status: ${resp.status}`)

    if (!resp.ok) {
      const errorText = await resp.text()
      console.log(`[AuthProxy GET] Error response: ${errorText}`)

      if (resp.status >= 400 && resp.status < 500) {
        try {
          const errorJson = JSON.parse(errorText)
          return NextResponse.json(errorJson, { status: resp.status })
        } catch {
          return NextResponse.json({ error: errorText }, { status: resp.status })
        }
      }
    }

    // Return successful response
    const contentType = resp.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      try {
        const json = await resp.json()
        return NextResponse.json(json, { status: resp.status })
      } catch (error) {
        console.log("[AuthProxy GET] Failed to parse JSON response")
        return new NextResponse(null, { status: resp.status })
      }
    }

    const text = await resp.text()
    return new NextResponse(text, {
      status: resp.status,
      headers: { 'Content-Type': contentType }
    })

  } catch (error) {
    console.error("Auth proxy GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
