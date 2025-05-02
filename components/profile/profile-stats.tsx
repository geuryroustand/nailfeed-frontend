import { ProfileStatsClient } from "@/components/profile/profile-stats-client"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileStatsProps {
  user: UserProfileResponse
}

export default function ProfileStats({ user }: ProfileStatsProps) {
  return <ProfileStatsClient userData={user} />
}
