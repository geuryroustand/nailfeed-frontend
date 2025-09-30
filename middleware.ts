import type { NextRequest } from "next/server"
import { authMiddleware } from "@/lib/auth/middleware"

export async function middleware(request: NextRequest) {
  // Use the secure auth middleware for all matched routes
  return await authMiddleware(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
}
