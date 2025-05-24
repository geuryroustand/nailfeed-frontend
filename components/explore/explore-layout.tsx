import type React from "react"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"

interface ExploreLayoutProps {
  children: React.ReactNode
}

export default function ExploreLayout({ children }: ExploreLayoutProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="explore" />
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-7xl mx-auto px-4 pt-2 pb-16 md:py-8">{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="search" />
      </div>

      <Toaster />
    </main>
  )
}
