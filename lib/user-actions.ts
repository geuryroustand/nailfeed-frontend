"use server"

import { revalidatePath } from "next/cache"
import type { FollowActionResult, ProfileUpdateResult } from "./user-data"

export async function toggleFollow(username: string, currentlyFollowing: boolean): Promise<FollowActionResult> {
  try {
    // In a real app, this would update a database
    console.log(`${currentlyFollowing ? "Unfollowing" : "Following"} user ${username}`)

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Calculate new follower count (increase if following, decrease if unfollowing)
    const baseCount = 24800
    const newFollowerCount = currentlyFollowing ? baseCount - 1 : baseCount + 1

    // Return success response
    const result: FollowActionResult = {
      success: true,
      isFollowing: !currentlyFollowing,
      newFollowerCount,
    }

    // Revalidate the profile page to reflect the changes
    revalidatePath("/profile")
    revalidatePath(`/profile/${username}`) // Also revalidate the user's profile page if it exists

    return result
  } catch (error) {
    console.error("Error toggling follow status:", error)
    return {
      success: false,
      isFollowing: currentlyFollowing,
      message: "Failed to update follow status",
    }
  }
}

export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  try {
    // Extract form data
    const displayName = formData.get("displayName") as string
    const bio = formData.get("bio") as string
    const website = formData.get("website") as string
    const location = formData.get("location") as string

    // Validate data
    if (!displayName) {
      return {
        success: false,
        message: "Display name is required",
      }
    }

    // In a real app, this would update a database
    console.log("Updating profile:", { displayName, bio, website, location })

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Return updated user data
    const updatedUser = {
      displayName,
      bio,
      website,
      location,
    }

    // Revalidate the profile page to reflect the changes
    revalidatePath("/profile")

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return {
      success: false,
      message: "Failed to update profile",
    }
  }
}
