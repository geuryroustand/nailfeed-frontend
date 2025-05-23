/**
 * Ensures a URL is absolute by prepending the API base URL if necessary
 * @param url The URL to process
 * @returns The absolute URL
 */
export function ensureAbsoluteUrl(url?: string): string {
  if (!url) return ""

  // If the URL already starts with http, it's already absolute
  if (url.startsWith("http")) return url

  // Get the API base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

  // Ensure the URL starts with a single slash
  const formattedUrl = url.startsWith("/") ? url : `/${url}`

  // Return the absolute URL
  return `${apiBaseUrl}${formattedUrl}`
}

/**
 * Gets the profile image URL for a user
 * @param user The user object
 * @returns The profile image URL
 */
export function getProfileImageUrl(user: any): string {
  if (!user) return ""

  // Try to get the profile image URL from the user object
  const profileImageUrl = user.profileImage?.url || user.profileImage?.formats?.thumbnail?.url || ""

  // If we have a profile image URL, ensure it's absolute
  if (profileImageUrl) {
    return ensureAbsoluteUrl(profileImageUrl)
  }

  // If we don't have a profile image URL, generate a placeholder
  return `/placeholder.svg?height=150&width=150&query=profile+${encodeURIComponent(user.username || "user")}`
}

/**
 * Gets the cover image URL for a user
 * @param user The user object
 * @returns The cover image URL
 */
export function getCoverImageUrl(user: any): string {
  if (!user) return ""

  // Try to get the cover image URL from the user object
  const coverImageUrl = user.coverImage?.url || user.coverImage?.formats?.medium?.url || ""

  // If we have a cover image URL, ensure it's absolute
  if (coverImageUrl) {
    return ensureAbsoluteUrl(coverImageUrl)
  }

  // If we don't have a cover image URL, generate a placeholder
  return `/placeholder.svg?height=400&width=1200&query=cover+${encodeURIComponent(user.username || "background")}`
}
