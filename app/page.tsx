"use client"

import type React from "react"

import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { AuthProvider } from "@/context/auth-context"
import { ProfileProvider } from "@/context/profile-context"
import { SearchProvider } from "@/context/search-context"
import { CollectionsProvider } from "@/context/collections-context"
import { MoodProvider } from "@/context/mood-context"
import { ReactionProvider } from "@/context/reaction-context"
import { ErrorBoundary } from "react-error-boundary"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-4 text-red-500">{error.message || "An unexpected error occurred"}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <ProfileProvider>
                <SearchProvider>
                  <CollectionsProvider>
                    <MoodProvider>
                      <ReactionProvider>
                        <div className="flex flex-col min-h-screen">
                          <Header />
                          <div className="flex flex-1 pt-16">
                            <Sidebar className="hidden md:block w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] border-r overflow-y-auto" />
                            <main className="flex-1 md:ml-64">
                              <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
                            </main>
                          </div>
                          <BottomNav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10" />
                        </div>
                        <Toaster />
                      </ReactionProvider>
                    </MoodProvider>
                  </CollectionsProvider>
                </SearchProvider>
              </ProfileProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
