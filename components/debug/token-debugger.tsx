"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TokenDebugger() {
  const [token, setToken] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    // Function to get cookie value
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null
      return null
    }

    setToken(getCookie("jwt"))
    setAuthToken(getCookie("authToken"))
  }, [])

  const refreshTokens = () => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null
      return null
    }

    setToken(getCookie("jwt"))
    setAuthToken(getCookie("authToken"))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Token Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">JWT Token:</h3>
            {token ? (
              <div className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-20">
                <code className="text-xs break-all">{token}</code>
              </div>
            ) : (
              <p className="text-red-500">No JWT token found in cookies</p>
            )}
          </div>

          <div>
            <h3 className="font-medium">Auth Token:</h3>
            {authToken ? (
              <div className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-20">
                <code className="text-xs break-all">{authToken}</code>
              </div>
            ) : (
              <p className="text-red-500">No Auth token found in cookies</p>
            )}
          </div>

          <Button onClick={refreshTokens}>Refresh Tokens</Button>
        </div>
      </CardContent>
    </Card>
  )
}
