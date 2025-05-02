"use client"

import { Home, Search, PlusSquare, User, Menu } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"
import MobileMenu from "./mobile-menu"

interface BottomNavProps {
  activeTab?: string
}

export default function BottomNav({ activeTab: initialActiveTab = "home" }: BottomNavProps) {
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Update active tab when prop changes
  useEffect(() => {
    setActiveTab(initialActiveTab)
  }, [initialActiveTab])

  const tabs = [
    { id: "menu", icon: Menu, label: "Menu", action: () => setIsMobileMenuOpen(true) },
    { id: "home", icon: Home, label: "Home", href: "/" },
    { id: "create", icon: PlusSquare, label: "Create", href: isAuthenticated ? "/" : "/auth" },
    { id: "search", icon: Search, label: "Explore", href: "/explore" },
    // Conditionally change the profile tab to point to auth if not logged in
    {
      id: "profile",
      icon: User,
      label: isAuthenticated ? "Profile" : "Login",
      href: isAuthenticated ? "/profile" : "/auth",
    },
  ]

  return (
    <>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} activeItem={activeTab} />

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      >
        <div className="container max-w-md mx-auto flex items-center justify-between px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id && tab.id !== "menu"

            if (tab.id === "menu") {
              return (
                <motion.button
                  key={tab.id}
                  className="relative flex flex-col items-center justify-center py-2 px-3 text-gray-500"
                  onClick={tab.action}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{tab.label}</span>
                </motion.button>
              )
            }

            return (
              <Link href={tab.href} key={tab.id}>
                <motion.button
                  className={`relative flex flex-col items-center justify-center py-2 px-3 ${
                    isActive ? "text-pink-500" : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
