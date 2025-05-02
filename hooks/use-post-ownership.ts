"use client"

import { useCallback } from "react"

// In a real app, this would use authentication context to get the current user
// For demo purposes, we'll simulate a logged-in user
const CURRENT_USER = "jane_doe" // Simulating the current logged-in user

export function usePostOwnership() {
  const isPostOwner = useCallback((postUsername: string) => {
    // Compare the post's username with the current user
    return postUsername === CURRENT_USER
  }, [])

  return { isPostOwner, currentUser: CURRENT_USER }
}
