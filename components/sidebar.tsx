"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Search,
  Compass,
  Heart,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Palette,
  BookMarked,
  TrendingUp,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isAuthenticated, logout, user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      requiresAuth: false,
    },
    {
      name: "Explore",
      href: "/explore",
      icon: Compass,
      requiresAuth: false,
    },
    {
      name: "Search",
      href: "/search",
      icon: Search,
      requiresAuth: false,
    },
    {
      name: "Trending",
      href: "/analytics/reactions",
      icon: TrendingUp,
      requiresAuth: false,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
      requiresAuth: true,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Heart,
      requiresAuth: true,
    },
    {
      name: "Profile",
      href: isAuthenticated && user?.username ? `/profile/${user.username}` : "/profile",
      icon: User,
      requiresAuth: true,
    },
    {
      name: "Collections",
      href: "/collections",
      icon: BookMarked,
      requiresAuth: true,
    },
    {
      name: "Moods",
      href: "/moods",
      icon: Palette,
      requiresAuth: true,
    },
    {
      name: "Settings",
      href: "/settings/account",
      icon: Settings,
      requiresAuth: true,
    },
  ]

  return (
    <div className={cn("py-4 flex flex-col h-full", className)}>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
          {navItems.map((item) => {
            // Skip items that require auth if user is not authenticated
            if (item.requiresAuth && !isAuthenticated) return null

            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  isActive
                    ? "bg-pink-50 text-pink-600 font-medium"
                    : "text-gray-600 hover:text-pink-600 hover:bg-gray-100",
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-pink-600" : "text-gray-500")} />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="py-2">
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Support</h3>
          </div>
          <div className="space-y-1 px-3 py-2">
            <Link
              href="/help"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-pink-600 hover:bg-gray-100 transition-all"
            >
              <HelpCircle className="h-5 w-5 text-gray-500" />
              Help Center
            </Link>

            <Link
              href="/about"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-pink-600 hover:bg-gray-100 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-gray-500"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              About
            </Link>
          </div>
        </div>
      </ScrollArea>

      {isAuthenticated && (
        <div className="mt-auto px-3 py-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-auto px-3 py-2">
          <Button variant="default" className="w-full bg-pink-600 hover:bg-pink-700" asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
