import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * Optimized cache revalidation endpoint for Next.js 15
 * Handles immediate cache invalidation for better performance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paths, tags, secret } = body

    // Optional: Add security check
    if (secret && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
    }

    console.log("[v0] Cache revalidation requested:", { paths, tags })

    // Revalidate specific paths
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        console.log(`[v0] Revalidating path: ${path}`)
        revalidatePath(path, "layout")
        revalidatePath(path, "page")
      }
    }

    // Revalidate specific cache tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        console.log(`[v0] Revalidating tag: ${tag}`)
        revalidateTag(tag)
      }
    }

    console.log("[v0] Cache revalidation completed successfully")

    return NextResponse.json({
      success: true,
      message: "Cache revalidated successfully",
      revalidated: {
        paths: paths || [],
        tags: tags || [],
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("[v0] Cache revalidation error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for testing cache revalidation
 */
export async function GET() {
  return NextResponse.json({
    message: "Cache revalidation endpoint is working",
    timestamp: new Date().toISOString(),
    availableMethods: ["POST"]
  })
}
