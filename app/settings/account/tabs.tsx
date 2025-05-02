"use client"

import { useState } from "react"
import { Mail, Lock, User } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProfileForm } from "./profile-form"
import { EmailForm } from "./email-form"
import { PasswordForm } from "./password-form"
import type { UserProfile } from "@/lib/profile-service"
import type { User as AuthUser } from "@/lib/auth-service"

interface AccountTabsProps {
  profile: UserProfile
  user: AuthUser
}

export function AccountTabs({ profile, user }: AccountTabsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "email" | "password">("profile")

  return (
    <Tabs
      defaultValue="profile"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "profile" | "email" | "password")}
      className="w-full"
    >
      <div className="px-4 pt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-500">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-500">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-500">
            <Lock className="h-4 w-4 mr-2" />
            Password
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="p-6">
        <TabsContent value="profile" className="mt-0">
          <ProfileForm profile={profile} user={user} />
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <EmailForm user={user} />
        </TabsContent>

        <TabsContent value="password" className="mt-0">
          <PasswordForm />
        </TabsContent>
      </div>
    </Tabs>
  )
}
