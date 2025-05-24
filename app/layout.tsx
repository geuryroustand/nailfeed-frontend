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
import { Suspense } from "react"

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
                  {/* Wrap client components with Suspense for better loading experience */}
                  <Suspense fallback={<div className="w-full h-16 bg-background animate-pulse" />}>
                    <ClientHeaderWrapper />
                  </Suspense>
                  {/* Wrap with ReactionProvider */}
                  <ReactionProvider>
                    {/* Main content */}
                    {children}
                  </ReactionProvider>
                  <Suspense fallback={null}>
                    <ApiStatusIndicator />
                  </Suspense>
                  <Toaster />
                  {/* Add auth debug component */}
                  <Suspense fallback={null}>
                    <AuthDebug />
                  </Suspense>
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
