"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function NotFoundContent() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from") || "/"

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-6">Sorry, we couldn't find the page you're looking for.</p>
      <Button asChild>
        <Link href={from}>Go back</Link>
      </Button>
    </div>
  )
}

export function NotFoundClient() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
          <p className="text-muted-foreground mb-6">Sorry, we couldn't find the page you're looking for.</p>
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  )
}
