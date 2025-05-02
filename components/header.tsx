"use client"

import { Bell, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useMemo } from "react"

export default function Header() {
  // Use a safe approach to get auth context
  const auth = useAuth()

  const { user, isAuthenticated, logout } = useMemo(() => {
    try {
      return {
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        logout: auth.logout,
      }
    } catch (error) {
      // If auth context is not available, use default values
      console.error("Auth context not available:", error)
      return {
        user: null,
        isAuthenticated: false,
        logout: () => {},
      }
    }
  }, [auth])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-3">
      <div className="container max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold mr-2">
                  N
                </div>
                <h1 className="text-xl font-bold hidden sm:block">NailFeed</h1>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Middle section - removed search input */}
        <div className="flex-1"></div>

        <div className="flex items-center space-x-1">
          {!isAuthenticated ? (
            <div className="hidden sm:flex items-center space-x-2 mr-2">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full"></span>
              </Button>

              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImage?.url || "/diverse-avatars.png"} alt="Your profile" />
                  <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || "YP"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings/account" className="flex items-center w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem>
                    <Link href="/auth" className="flex items-center w-full">
                      Login / Sign up
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
