import LeoProfanity from "leo-profanity"

// Initialize the filter with the default English dictionary
const filter = LeoProfanity
filter.loadDictionary("en")

// Add custom words specific to your community guidelines
filter.add([
  // Add any additional words you want to filter
  "inappropriateterm1",
  "inappropriateterm2",
  // Add nail-art specific inappropriate terms if needed
])

// Remove any false positives that might affect nail art terminology
filter.remove([
  // Example: nail art terms that might be flagged incorrectly
  "nail",
  "polish",
  "strip",
])

/**
 * Checks if text contains profanity
 * @param text The text to check
 * @returns Boolean indicating if profanity was detected
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false
  return filter.check(text)
}

/**
 * Cleans text by replacing profanity with asterisks
 * @param text The text to clean
 * @returns Cleaned text with profanity replaced
 */
export function cleanText(text: string): string {
  if (!text) return ""
  return filter.clean(text)
}

/**
 * Cleans text by replacing profanity with a custom replacement
 * @param text The text to clean
 * @param replacement The replacement string (default: '***')
 * @returns Cleaned text with profanity replaced
 */
export function cleanTextWithReplacement(text: string, replacement = "***"): string {
  if (!text) return ""
  return filter.clean(text, replacement)
}

/**
 * Gets all profane words found in the text
 * @param text The text to analyze
 * @returns Array of profane words found
 */
export function getProfaneWords(text: string): string[] {
  if (!text) return []
  return filter.list(text)
}

/**
 * Checks content for profanity and returns a user-friendly validation result
 * @param text The text to check
 * @returns Validation result object
 */
export function validateContent(text: string): { isValid: boolean; errorMessage?: string } {
  if (!text) return { isValid: true }

  if (containsProfanity(text)) {
    return {
      isValid: false,
      errorMessage: "Your post contains inappropriate language. Please revise it.",
    }
  }

  return { isValid: true }
}
