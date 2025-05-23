"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function CommentApiDebugger() {
  const [postId, setPostId] = useState("")
  const [commentContent, setCommentContent] = useState("")
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testCommentApi = async () => {
    if (!postId || !commentContent) {
      setError("Please provide both post ID and comment content")
      return
    }

    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      // Get JWT from cookie
      const cookies = document.cookie.split(";")
      let jwt = ""
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.startsWith("jwt=")) {
          jwt = cookie.substring(4)
          break
        }
      }

      if (!jwt) {
        setError("No JWT found in cookies. Please log in first.")
        setIsLoading(false)
        return
      }

      // Format the content type according to Strapi Comments plugin requirements
      const contentType = "api::post.post"

      // Construct the endpoint URL
      const endpoint = `/api/comments/${contentType}:${postId}`
      const url = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${
        endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
      }`

      console.log("Testing comment API at URL:", url)

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      }

      const body = { content: commentContent }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      const responseText = await response.text()
      let responseData

      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        responseData = { text: responseText }
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
      })

      if (!response.ok) {
        setError(`API Error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error testing comment API:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Comment API Debugger</CardTitle>
        <CardDescription>Test the Strapi Comments plugin API directly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">API URL</label>
          <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://your-strapi-api.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Post ID</label>
          <Input
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            placeholder="Enter post ID or document ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Comment Content</label>
          <Textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Enter your comment"
            rows={3}
          />
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>}

        {response && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="font-medium mb-2">Response:</h4>
            <pre className="text-xs overflow-auto max-h-60 p-2 bg-gray-100 rounded">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testCommentApi} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Comment API"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
