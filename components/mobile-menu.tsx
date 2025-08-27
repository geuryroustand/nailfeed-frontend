"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Home,
  Search,
  Compass,
  Heart,
  MessageCircle,
  PlusSquare,
  User,
  Bookmark,
  Palette,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  activeItem?: string
}

export default function MobileMenu({ isOpen, onClose, activeItem = "home" }: MobileMenuProps) {
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const menuItems = [
    { id: "home", icon: Home, label: "Home", href: "/" },
    { id: "search", icon: Search, label: "Search", href: "/" },
    { id: "explore", icon: Compass, label: "Explore", href: "/explore" },
    { id: "suggestions", icon: Lightbulb, label: "Community Ideas", href: "/suggestions" },
    { id: "messages", icon: MessageCircle, label: "Messages", href: "/" },
    { id: "notifications", icon: Heart, label: "Notifications", href: "/" },
    { id: "create", icon: PlusSquare, label: "Create", href: "/" },
    { id: "profile", icon: User, label: "Profile", href: "/profile" },
    { id: "collections", icon: Bookmark, label: "Collections", href: "/collections" },
    { id: "mood", icon: Palette, label: "Mood", href: "/mood" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-0 left-0 bottom-0 w-4/5 max-w-xs bg-white z-50 flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <Link href="/" onClick={onClose}>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  NailFeed
                </h1>
              </Link>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.id

                return (
                  <Link href={item.href} key={item.id} onClick={onClose} className="block">
                    <div
                      className={`flex items-center px-4 py-3 ${
                        isActive ? "text-pink-500 font-medium" : "text-gray-700"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isActive ? "text-pink-500" : ""}`} />
                      <span className="ml-4">{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="p-4 border-t">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImage?.url || "/diverse-avatars.png"} alt="Your profile" />
                    <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || "YP"}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.displayName || user?.username || "Your Profile"}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth" onClick={onClose}>
                    <Button variant="outline" className="w-full bg-transparent">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth?tab=signup" onClick={onClose}>
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
