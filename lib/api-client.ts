"use client"

import axios from "axios"

// Public base URL is safe to use on the client
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

apiClient.interceptors.request.use(
  async (config) => {
    // Only use client-side tokens (JWT) from storage/cookies, never env secrets
    let token: string | null = null

    if (typeof window !== "undefined") {
      token = localStorage.getItem("jwt") || null

      if (!token) {
        const cookies = document.cookie.split(";")
        const jwtCookie = cookies.find((cookie) => cookie.trim().startsWith("jwt="))
        if (jwtCookie) {
          token = jwtCookie.split("=")[1].trim()
        }
      }
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

apiClient.testConnection = async () => {
  try {
    await apiClient.get("/")
    return true
  } catch {
    return false
  }
}

export function clearCache(): void {
  if (typeof window !== "undefined") {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("api_cache_") || key.startsWith("cache_")) {
        localStorage.removeItem(key)
      }
    })
  }
  console.log("API client cache cleared")
}

apiClient.clearCache = clearCache

export { apiClient }
