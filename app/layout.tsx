import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "NailFeed - Share Your Nail Art",
  description: "A social platform for nail art enthusiasts to share designs and connect with others",
    generator: 'v0.dev'
}

import RootLayout from "./page"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout children={children} />
}


import './globals.css'