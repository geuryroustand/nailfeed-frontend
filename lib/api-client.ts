// API client for making requests to the backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com"
const API_TOKEN = process.env.API_TOKEN || ""

// Cache management
const cache = new Map<string, any>()
const defaultTTL = 5 * 60 * 1000 // 5 minutes

// Function to clear the cache
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

// API client for making requests to the backend
export const apiClient = {
  async get(endpoint: string, options: RequestInit = {}, useAuth = false) {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`
    const cachedResponse = cache.get(cacheKey)

    if (cachedResponse) {
      console.log(`Using cached response for ${endpoint}`)
      return cachedResponse
    }

    const url = `${API_URL}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (useAuth && API_TOKEN) {
      headers["Authorization"] = `Bearer ${API_TOKEN}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      cache.set(cacheKey, data, defaultTTL)
      return data
    } catch (error) {
      console.error("API client error:", error)
      throw error
    }
  },

  async post(endpoint: string, data: any, options: RequestInit = {}, useAuth = false) {
    const url = `${API_URL}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (useAuth && API_TOKEN) {
      headers["Authorization"] = `Bearer ${API_TOKEN}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API client error:", error)
      throw error
    }
  },

  async put(endpoint: string, data: any, options: RequestInit = {}, useAuth = false) {
    const url = `${API_URL}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (useAuth && API_TOKEN) {
      headers["Authorization"] = `Bearer ${API_TOKEN}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API client error:", error)
      throw error
    }
  },

  async delete(endpoint: string, options: RequestInit = {}, useAuth = false) {
    const url = `${API_URL}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (useAuth && API_TOKEN) {
      headers["Authorization"] = `Bearer ${API_TOKEN}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers,
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API client error:", error)
      throw error
    }
  },

  // Placeholder for upload method - needs implementation based on your upload logic
  async upload(endpoint: string, formData: FormData, options: RequestInit = {}, useAuth = false): Promise<any> {
    const url = `${API_URL}${endpoint}`
    const headers: HeadersInit = {
      ...options.headers,
    }

    if (useAuth && API_TOKEN) {
      headers["Authorization"] = `Bearer ${API_TOKEN}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // Increased timeout for uploads

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API upload error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API upload error:", error)
      throw error
    }
  },
}
