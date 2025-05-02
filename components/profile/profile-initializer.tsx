"use client"
import { useProfileFlow } from "@/hooks/use-profile-flow"

export default function ProfileInitializer() {
  const { isInitializing } = useProfileFlow()

  // This component doesn't render anything visible
  // It just initializes the profile flow when the app loads
  return null
}
