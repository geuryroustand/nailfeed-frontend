import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import { MoodProvider } from "@/context/mood-context";
import { CollectionsProvider } from "@/context/collections-context";
import { ProfileProvider } from "@/context/profile-context";
import ClientHeaderWrapper from "@/components/client-header-wrapper";
import ApiStatusIndicator from "@/components/api-status-indicator";
import { ReactionProvider } from "@/context/reaction-context";
import config from "@/lib/config";
// Import our polyfill
import "@/lib/polyfills";
import QueryProvider from "@/components/query-provider";
import PWAInstaller from "@/components/pwa-installer";
import Script from "next/script";

// Initialize configuration
config.initialize();

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="NailFeed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NailFeed" />
        <meta
          name="description"
          content="Share and discover amazing nail art designs with the community"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ec4899" />

        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />

        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              strategy="afterInteractive"
              src="https://www.googletagmanager.com/gtag/js?id=G-Z3MYDXLS7Y"
            />
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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <ProfileProvider>
                <CollectionsProvider>
                  <MoodProvider>
                    <ClientHeaderWrapper />
                    {/* Wrap with ReactionProvider */}
                    <ReactionProvider>{children}</ReactionProvider>
                    <ApiStatusIndicator />
                    <Toaster />
                    <PWAInstaller />
                  </MoodProvider>
                </CollectionsProvider>
              </ProfileProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export const metadata = {
  generator: "v0.dev",
};
