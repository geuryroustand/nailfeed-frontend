"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"

export default function ApiResponseDebugger() {
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get("/api/posts?populate=*&pagination[page]=1&pagination[pageSize]=3")
      setResponse(result)
      console.log("API Response:", JSON.stringify(result, null, 2))
    } catch (err: any) {
      console.error("Error fetching posts:", err)
      setError(err.message || "Failed to fetch posts")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>API Response Debugger</span>
          <Button onClick={fetchPosts} disabled={loading}>
            {loading ? "Loading..." : "Test API"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{error}</div>}

        {response && (
          <Tabs defaultValue="structure">
            <TabsList>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="meta">Meta</TabsTrigger>
            </TabsList>

            <TabsContent value="structure" className="mt-2">
              <div className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(
                    {
                      hasData: !!response.data,
                      dataType: response.data
                        ? Array.isArray(response.data)
                          ? "array"
                          : typeof response.data
                        : "none",
                      dataLength: Array.isArray(response.data) ? response.data.length : 0,
                      hasMeta: !!response.meta,
                      firstItemKeys: response.data && response.data[0] ? Object.keys(response.data[0]) : [],
                      firstItemAttributesKeys:
                        response.data && response.data[0]?.attributes ? Object.keys(response.data[0].attributes) : [],
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-2">
              <div className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(response.data, null, 2)}</pre>
              </div>
            </TabsContent>

            <TabsContent value="meta" className="mt-2">
              <div className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(response.meta, null, 2)}</pre>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
