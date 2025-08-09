import { createPost } from "@/app/actions/post-actions"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const result = await createPost(formData)

    if (result.success) {
      return Response.json(result, { status: 200 })
    } else {
      return Response.json(result, { status: 400 })
    }
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
