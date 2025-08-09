import type React from "react"
import { Inter } from 'next/font/google'
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
import config from "@/lib/config"
// Import our polyfill
import "@/lib/polyfills"

// Initialize configuration
config.initialize()

const inter = Inter({ subsets: ["latin"] })

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
                  {/* Wrap with ReactionProvider */}
                  <ReactionProvider>{children}</ReactionProvider>
                  <ApiStatusIndicator />
                  <Toaster />
                </MoodProvider>
              </CollectionsProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
