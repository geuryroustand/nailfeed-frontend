import { buildBaseEndpoint } from "./path-to-buildBaseEndpoint"
import { proxyRequest } from "./path-to-proxyRequest"

export class CommentsService {
  static async addComment(postId: string | number, documentId: string | undefined, content: string, threadOf?: number) {
    try {
      if (!postId && !documentId) throw new Error("No postId or documentId provided to addComment")

      const base = buildBaseEndpoint(postId, documentId)
      const endpoint = base

      const body: Record<string, any> = { content }
      if (threadOf) body.threadOf = threadOf

      const response = await proxyRequest(endpoint, {
        method: "POST",
        data: body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Error adding comment:", errorText || `HTTP ${response.status}`)
        return {
          success: false,
          error: errorText || `HTTP ${response.status}`,
        }
      }

      const result = await response.json()

      if (result && typeof window !== "undefined") {
        // Get current user from auth context if available
        const event = new CustomEvent("commentAdded", {
          detail: {
            postId,
            documentId,
            commentData: result,
            content,
          },
        })
        window.dispatchEvent(event)
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }
}
