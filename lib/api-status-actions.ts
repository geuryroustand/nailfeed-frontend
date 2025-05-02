"use server"

/**
 * Server action to safely check API token status
 * Returns only a boolean indicating if the token exists, not the token itself
 */
export async function checkApiTokenStatus() {
  // Check if the API token exists on the server side without directly referencing the variable name
  // This prevents the variable name from being included in the client bundle
  const hasToken = !!process.env.API_TOKEN

  // Return only a boolean, not the token itself
  return {
    hasToken,
  }
}

/**
 * Get environment information safely from the server
 * Only returns public information and boolean flags for sensitive data
 */
export async function getEnvironmentInfo() {
  // Check token existence without directly referencing the sensitive variable name
  const hasToken = !!process.env.API_TOKEN

  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "Not set",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "Not set",
    appEnv: process.env.NEXT_PUBLIC_APP_ENV || "Not set",
    hasApiToken: hasToken,
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || "Not set",
  }
}
