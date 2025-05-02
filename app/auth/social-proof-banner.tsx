import { getFeaturedUsers } from "@/lib/user-data"

export async function SocialProofBanner() {
  const featuredUsers = await getFeaturedUsers()

  return (
    <div className="text-center mb-6">
      <h2 className="text-sm font-medium text-gray-500">Trusted by nail artists worldwide</h2>
      <div className="flex justify-center mt-2 space-x-1">
        {featuredUsers.slice(0, 5).map((user) => (
          <div key={user.id} className="w-6 h-6 rounded-full overflow-hidden border border-white -ml-1 first:ml-0">
            {user.profileImage ? (
              <img
                src={user.profileImage.url || "/placeholder.svg"}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
