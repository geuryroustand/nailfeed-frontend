import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isPopularPost } from "@/lib/popular-posts"

export async function POST(request: NextRequest) {
  try {
    // Verify the request has the correct secret
    const secret = request.headers.get("x-revalidate-secret")
    const expectedSecret = process.env.REVALIDATE_SECRET

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ success: false, message: "Invalid revalidation secret" }, { status: 401 })
    }

    // Get post ID from request body
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 })
    }

    // Revalidate the specific post page
    revalidatePath(`/post/${postId}`)

    // Check if this is a popular post
    const isPopular = await isPopularPost(postId)

    // If it's a popular post, also revalidate the home page
    if (isPopular) {
      revalidatePath("/")
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      message: `Revalidated post ${postId}${isPopular ? " and home page" : ""}`,
    })
  } catch (error) {
    console.error("Error revalidating post:", error)
    return NextResponse.json({ success: false, message: "Error revalidating post" }, { status: 500 })
  }
}
