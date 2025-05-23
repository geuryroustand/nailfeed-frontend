/**
 * Formats a date or timestamp string into a user-friendly format
 * @param timestamp The timestamp to format (Date object, ISO string, or pre-formatted string)
 * @returns A user-friendly formatted date string
 */
export function formatDate(timestamp: string | Date | undefined): string {
  // If no timestamp is provided, return a default value
  if (!timestamp) return "Recently"

  // If timestamp is already a formatted string (not an ISO date), use it directly
  if (typeof timestamp === "string" && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)) {
    return timestamp
  }

  try {
    const date = typeof timestamp === "object" ? timestamp : new Date(timestamp)

    // Check if date is valid
    if (isNaN(date.getTime())) return "Recently"

    // Format relative time
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) {
      return "Just now"
    } else if (diffMin < 60) {
      return `${diffMin}m ago`
    } else if (diffHour < 24) {
      return `${diffHour}h ago`
    } else if (diffDay < 7) {
      return `${diffDay}d ago`
    } else {
      // For older posts, show the full date
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Recently"
  }
}

/**
 * Formats a date specifically for the backend format (ISO string)
 * @param dateString The date string from the backend (e.g., "2025-05-19T16:57:04.044Z")
 * @returns A user-friendly formatted date string
 */
export function formatBackendDate(dateString: string | undefined): string {
  if (!dateString) return "Recently"

  try {
    // Parse the ISO date string from the backend
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) return "Recently"

    // Use the same formatting logic as formatDate
    return formatDate(date)
  } catch (error) {
    console.error("Error formatting backend date:", error)
    return "Recently"
  }
}
