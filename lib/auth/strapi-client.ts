"use server"

import { verifySession } from "./session"

/**
 * Server-side Strapi client for authenticated requests
 */
export async function createStrapiClient() {
  const session = await verifySession()

  if (!session) {
    throw new Error("No valid session found")
  }

  const strapiUrl = process.env.API_URL ||
                   process.env.NEXT_PUBLIC_API_URL ||
                   "https://nailfeed-backend-production.up.railway.app"

  return {
    async fetch(endpoint: string, options: RequestInit = {}) {
      const url = `${strapiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

      const response = await fetch(url, {
        ...options,
        headers: {
          "Authorization": `Bearer ${session.strapiJWT}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`Strapi request failed: ${response.status} ${response.statusText}`)
      }

      return response
    },

    async get(endpoint: string) {
      const response = await this.fetch(endpoint, { method: "GET" })
      return response.json()
    },

    async post(endpoint: string, data: any) {
      const response = await this.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      })
      return response.json()
    },

    async put(endpoint: string, data: any) {
      const response = await this.fetch(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      })
      return response.json()
    },

    async delete(endpoint: string) {
      const response = await this.fetch(endpoint, { method: "DELETE" })
      return response.status === 204 ? null : response.json()
    },
  }
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<number | null> {
  const session = await verifySession()
  return session ? Number(session.userId) : null
}