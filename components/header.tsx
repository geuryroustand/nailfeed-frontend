"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileMenu } from "@/components/mobile-menu"
import { useAuth } from "@/context/auth-context"
import { ClientHeaderWrapper } from "@/components/client-header-wrapper"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch by only rendering client components after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  // Don't render anything during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-pink-600">
              NailFeed
            </Link>
          </div>
          <div className="w-full max-w-md mx-4 hidden md:block"></div>
          <div className="flex items-center space-x-4"></div>
        </div>
      </header>
    )
  }

  return (
    <ClientHeaderWrapper>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>

            <Link href="/" className="text-xl font-bold text-pink-600">
              NailFeed
            </Link>
          </div>

          <form onSubmit={handleSearch} className="w-full max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search for nail designs, artists, or hashtags..."
                className="w-full bg-gray-100 border-none pl-9 pr-4 py-2 rounded-full focus-visible:ring-pink-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                  </Link>
                </Button>

                <Link href={user?.username ? `/profile/${user.username}` : "/profile"} className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.profileImage?.url || "/abstract-user-icon.png"}
                      alt={user?.username || "User"}
                    />
                    <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <Button asChild className="bg-pink-600 hover:bg-pink-700 hidden md:flex">
                <Link href="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </ClientHeaderWrapper>
  )
}
