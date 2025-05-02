"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface CopyLinkButtonProps {
  url: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
  onCopy?: () => void
}

export function CopyLinkButton({
  url,
  variant = "default",
  size = "default",
  className,
  showText = true,
  onCopy,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (onCopy) onCopy()
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard",
      })
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = url
      textArea.style.position = "fixed"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        if (onCopy) onCopy()
        toast({
          title: "Link copied",
          description: "The link has been copied to your clipboard",
        })
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Could not copy the link to your clipboard",
          variant: "destructive",
        })
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(copied ? "text-green-500" : "", className)}
      onClick={handleCopy}
      aria-label="Copy link"
    >
      {copied ? (
        <>
          <Check className="h-5 w-5 mr-2" />
          {showText && "Copied"}
        </>
      ) : (
        <>
          <Copy className="h-5 w-5 mr-2" />
          {showText && "Copy link"}
        </>
      )}
    </Button>
  )
}
