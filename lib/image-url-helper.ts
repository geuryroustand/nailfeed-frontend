/**
 * Ensures a URL is absolute by prepending the API base URL if it's relative
 * @param url The URL to process
 * @returns The absolute URL
 */
export function ensureAbsoluteUrl(url: string | undefined | null): string {
  if (!url) return ""

  // If the URL is already absolute, return it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // If the URL is relative, prepend the API base URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

  // Handle URLs that start with a slash
  if (url.startsWith("/")) {
    return `${apiUrl}${url}`
  }

  // Handle URLs that don't start with a slash
  return `${apiUrl}/${url}`
}

/**
 * Gets the profile image URL from a user object
 * @param profileImage The profile image object
 * @returns The profile image URL
 */
export function getProfileImageUrl(profileImage: any): string {
  if (!profileImage) return ""

  // Try to get the URL from the profile image object
  const url =
    profileImage.url || (profileImage.data && profileImage.data.attributes && profileImage.data.attributes.url)

  return ensureAbsoluteUrl(url)
}

/**
 * Gets the cover image URL from a user object
 * @param coverImage The cover image object
 * @returns The cover image URL
 */
export function getCoverImageUrl(coverImage: any): string {
  if (!coverImage) return ""

  // Try to get the URL from the cover image object
  const url = coverImage.url || (coverImage.data && coverImage.data.attributes && coverImage.data.attributes.url)

  return ensureAbsoluteUrl(url)
}
