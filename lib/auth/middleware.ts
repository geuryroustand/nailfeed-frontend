import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionTokenPayload,
} from "./session-token";

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  "/me",
  "/settings",
  "/dashboard",
  "/create",
  "/api/posts",
  "/api/comments",
  "/api/reactions",
];

/**
 * Public routes that do not require authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth",
  "/api/health",
];

/**
 * API routes that should bypass user session validation (handled elsewhere)
 */
const SERVER_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

const ASSET_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".ico",
];

function isAsset(pathname: string): boolean {
  return ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function hasProtectedPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((route) => {
    // Special case for /profile - only protect exact match, not dynamic routes
    if (route === "/me") {
      return pathname === "/me";
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function buildUnauthorizedResponse(): NextResponse {
  const response = NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
  });
  return response;
}

function buildRedirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/auth", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
  });
  return response;
}

async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionTokenPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  console.log(`[AuthMiddleware] Cookie check:`, {
    cookieName: SESSION_COOKIE_NAME,
    tokenPresent: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : "none",
  });

  if (!token) {
    console.log(`[AuthMiddleware] No session token found`);
    return null;
  }

  try {
    const session = await verifySessionToken(token);
    console.log(`[AuthMiddleware] Session verification:`, {
      sessionValid: !!session,
      userId: session?.userId,
      email: session?.email,
    });
    return session;
  } catch (error) {
    console.error(`[AuthMiddleware] Session verification failed:`, error);
    return null;
  }
}

/**
 * Check if a route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return hasProtectedPrefix(pathname, PROTECTED_ROUTES);
}

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return hasProtectedPrefix(pathname, PUBLIC_ROUTES);
}

/**
 * Check if a route should use server authentication
 */
export function isServerApiRoute(pathname: string): boolean {
  return hasProtectedPrefix(pathname, SERVER_API_ROUTES);
}

/**
 * Middleware function for request authentication
 */
export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  console.log(`[AuthMiddleware] Processing: ${pathname}`);

  if (pathname.startsWith("/_next") || isAsset(pathname)) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname) || isServerApiRoute(pathname)) {
    console.log(`[AuthMiddleware] Public/Server route: ${pathname}`);
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  console.log(`[AuthMiddleware] Session check for ${pathname}:`, {
    hasSession: !!session,
    sessionValid: session ? true : false,
    cookiePresent: !!request.cookies.get(SESSION_COOKIE_NAME)?.value,
  });

  if (!session) {
    if (isProtectedRoute(pathname)) {
      console.log(
        `[AuthMiddleware] No session, redirecting protected route: ${pathname}`
      );
      if (pathname.startsWith("/api/")) {
        return buildUnauthorizedResponse();
      }
      return buildRedirectToLogin(request);
    }

    // For non-protected routes, simply clear invalid cookies if present
    if (request.cookies.has(SESSION_COOKIE_NAME)) {
      const response = NextResponse.next();
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: "",
        expires: new Date(0),
        path: "/",
      });
      return response;
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.userId.toString());
    requestHeaders.set("x-user-email", session.email);
    requestHeaders.set("x-session-valid", "true");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

/**
 * Get user information from request headers (set by middleware)
 */
export function getUserFromRequest(request: NextRequest): {
  userId: string | null;
  email: string | null;
  isValid: boolean;
} {
  return {
    userId: request.headers.get("x-user-id"),
    email: request.headers.get("x-user-email"),
    isValid: request.headers.get("x-session-valid") === "true",
  };
}
