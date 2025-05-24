import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { MoodProvider } from "@/context/mood-context"
import { CollectionsProvider } from "@/context/collections-context"
import { ProfileProvider } from "@/context/profile-context"
import ClientHeaderWrapper from "@/components/client-header-wrapper"
import ApiStatusIndicator from "@/components/api-status-indicator"
import { ReactionProvider } from "@/context/reaction-context"
import AuthDebug from "@/components/auth-debug"
import config from "@/lib/config"
import type { Metadata } from "next"

// Safely initialize configuration
try {
  config.initialize()
} catch (error) {
  console.warn("Configuration initialization failed:", error)
}

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NailFeed - Nail Art Social Network",
  description: "Share and discover amazing nail art designs",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ProfileProvider>
              <CollectionsProvider>
                <MoodProvider>
                  <ClientHeaderWrapper />
                  <ReactionProvider>{children}</ReactionProvider>
                  <ApiStatusIndicator />
                  <Toaster />
                  <AuthDebug />
                </MoodProvider>
              </CollectionsProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
