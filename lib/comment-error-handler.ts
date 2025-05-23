import { toast } from "@/hooks/use-toast"

export const handleCommentError = (error: any): string => {
  // Check for 403 Forbidden error specifically
  if (error?.error?.status === 403 || error?.status === 403) {
    return "You need to be logged in to perform this action. Please sign in to continue."
  }

  if (typeof error === "string") return error

  if (error instanceof Error) return error.message

  if (error?.error?.message) return error.error.message

  if (error?.message) return error.message

  if (error?.data?.error?.message) return error.data.error.message

  // For Strapi's error format
  if (error?.error?.details?.errors && Array.isArray(error.error.details.errors)) {
    return error.error.details.errors.map((e: any) => e.message).join(", ")
  }

  return "An unknown error occurred"
}

export const showCommentErrorToast = (error: any, action = "performing action") => {
  const errorMessage = handleCommentError(error)

  // Only show toast if we're in a browser environment
  if (typeof window !== "undefined") {
    toast({
      title: `Error ${action}`,
      description: errorMessage,
      variant: "destructive",
    })
  }

  return errorMessage
}
