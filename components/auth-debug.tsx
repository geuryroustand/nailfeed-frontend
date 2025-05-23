"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function AuthDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const [cookieData, setCookieData] = useState<string | null>(null)
  const [localStorageData, setLocalStorageData] = useState<string | null>(null)
  const { user, isAuthenticated, checkAuthStatus } = useAuth()

  useEffect(() => {
    if (isOpen) {
      // Get cookie data
      setCookieData(document.cookie)

      // Get localStorage data
      const authToken = localStorage.getItem("auth_token")
      setLocalStorageData(authToken)
    }
  }, [isOpen])

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={() => setIsOpen(!isOpen)} className="bg-gray-800 hover:bg-gray-700 text-white" size="sm">
        Debug Auth
      </Button>

      {isOpen && (
        <div className="fixed bottom-16 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 overflow-auto">
          <h3 className="font-bold mb-2">Auth Debug</h3>

          <div className="mb-4">
            <p className="text-sm font-semibold">Authentication Status:</p>
            <p className="text-sm">{isAuthenticated ? "Authenticated" : "Not Authenticated"}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold">User Data:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
              {user ? JSON.stringify(user, null, 2) : "No user data"}
            </pre>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold">Cookies:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">{cookieData || "No cookies"}</pre>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold">LocalStorage Token:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
              {localStorageData || "No token in localStorage"}
            </pre>
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => checkAuthStatus()} size="sm" variant="outline" className="text-xs">
              Refresh Auth
            </Button>
            <Button onClick={() => window.location.reload()} size="sm" variant="outline" className="text-xs">
              Reload Page
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
