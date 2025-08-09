import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require authentication
const protectedRoutes = ["/profile$", "/settings", "/collections", "/moods", "/analytics"]

// Define auth routes that should redirect to home if already authenticated
const authRoutes = ["/auth", "/auth/verify", "/auth/reset-password"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("jwt")?.value || request.cookies.get("authToken")?.value

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => {
    // Use regex to match exact routes with $ anchor
    const regex = new RegExp(`^${route}`, "i")
    return regex.test(pathname)
  })

  // Check if it's a public profile route (e.g., /profile/username)
  const isPublicProfileRoute = pathname.startsWith("/profile/") && pathname !== "/profile/"

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token && !isPublicProfileRoute) {
    const url = new URL("/auth", request.url)
    url.searchParams.set("callbackUrl", encodeURIComponent(pathname))
    return NextResponse.redirect(url)
  }

  // If accessing auth routes with a token, redirect to home
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
}
