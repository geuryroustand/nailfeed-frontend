import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import AuthProviderServer from "@/components/auth/auth-provider-server"
import { MoodProvider } from "@/context/mood-context"
import { CollectionsProvider } from "@/context/collections-context"
import { ProfileProvider } from "@/context/profile-context"
import ClientHeaderWrapper from "@/components/client-header-wrapper"
import ApiStatusIndicator from "@/components/api-status-indicator"
import { ReactionProvider } from "@/context/reaction-context"
import config from "@/lib/config"
// Import our polyfill
import "@/lib/polyfills"
import QueryProvider from "@/components/query-provider"
import PWAInstaller from "@/components/pwa-installer"
import PWAUpdatePrompt from "@/components/pwa-update-prompt"
import Script from "next/script"
import FirstTimeVisitorNotification from "@/components/first-time-visitor-notification"
import NotificationPermissionPrompt from "@/components/notification-permission-prompt"
import NotificationHandler from "@/components/notification-handler"
import ServiceWorkerManager from "@/components/service-worker-manager"

// Initialize configuration
config.initialize()

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "NailFeed",
    template: "%s | NailFeed",
  },
  description: "Share and discover amazing nail art designs with the community",
  applicationName: "NailFeed",
  generator: "v0.dev",
  keywords: ["nail art", "nail designs", "beauty", "manicure", "nail polish", "nail inspiration"],
  authors: [{ name: "NailFeed Team" }],
  creator: "NailFeed",
  publisher: "NailFeed",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NailFeed",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ec4899",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "production" && (
          <>
            <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-Z3MYDXLS7Y" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-Z3MYDXLS7Y');
      `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProviderServer>
              <ProfileProvider>
                <CollectionsProvider>
                  <MoodProvider>
                    <ClientHeaderWrapper />
                    {/* Wrap with ReactionProvider */}
                    <ReactionProvider>{children}</ReactionProvider>
                    <ApiStatusIndicator />
                    <Toaster />
                    <ServiceWorkerManager />
                    <PWAInstaller />
                    <PWAUpdatePrompt />
                    <FirstTimeVisitorNotification />
                    <NotificationPermissionPrompt />
                    <NotificationHandler />
                  </MoodProvider>
                </CollectionsProvider>
              </ProfileProvider>
            </AuthProviderServer>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
