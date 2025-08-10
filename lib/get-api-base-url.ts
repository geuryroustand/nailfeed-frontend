export const getApiBaseUrl = (): string => {
  const serverUrl = (process.env.API_URL || "").trim()
  const publicUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim()

  if (serverUrl) return serverUrl
  if (publicUrl) return publicUrl

  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:1337"
  }

  return "https://nailfeed-backend-production.up.railway.app"
}
