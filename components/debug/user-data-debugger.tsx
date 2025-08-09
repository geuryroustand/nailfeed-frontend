"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserService } from "@/lib/services/user-service"
import config from "@/lib/config"

export function UserDataDebugger() {
  const [documentId, setDocumentId] = useState("")
  const [username, setUsername] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("documentId")

  const fetchByDocumentId = async () => {
    if (!documentId) {
      setError("Please enter a document ID")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = config.api.getApiToken()
      if (!token) {
        throw new Error("No API token available")
      }

      const userData = await UserService.getUserByDocumentId(documentId, token)
      setResult(userData)

      if (!userData) {
        setError(`No user found with document ID: ${documentId}`)
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchByUsername = async () => {
    if (!username) {
      setError("Please enter a username")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = config.api.getApiToken()
      if (!token) {
        throw new Error("No API token available")
      }

      const userData = await UserService.getUserByUsername(username, token)
      setResult(userData)

      if (!userData) {
        setError(`No user found with username: ${username}`)
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>User Data Debugger</CardTitle>
        <CardDescription>Test fetching user data by document ID or username</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="documentId">By Document ID</TabsTrigger>
            <TabsTrigger value="username">By Username</TabsTrigger>
          </TabsList>

          <TabsContent value="documentId">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter document ID"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              />
              <Button onClick={fetchByDocumentId} disabled={loading}>
                {loading ? "Loading..." : "Fetch User"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="username">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <Button onClick={fetchByUsername} disabled={loading}>
                {loading ? "Loading..." : "Fetch User"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-md">{error}</div>}

        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">User Data:</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        This tool helps debug user data fetching issues with Strapi v5.
      </CardFooter>
    </Card>
  )
}
