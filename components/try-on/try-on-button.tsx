"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface TryOnButtonProps {
  onClick: () => void
  className?: string
}

export function TryOnButton({ onClick, className }: TryOnButtonProps) {
  return (
    <Button onClick={onClick} className={className} variant="outline" size="sm">
      <Sparkles className="h-4 w-4 mr-2" />
      Try this design
    </Button>
  )
}
