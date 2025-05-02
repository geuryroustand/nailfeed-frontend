"use client"

import { useState, useRef } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check, QrCode, Facebook, Twitter, Linkedin, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface ShareMenuProps {
  url: string
  title: string
  description?: string
  image?: string
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
  onShare?: () => void
}

export function ShareMenu({
  url,
  title,
  description = "",
  image = "",
  variant = "outline",
  size = "default",
  className,
  showText = true,
  onShare,
}: ShareMenuProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useMobile()

  const handleCopyLink = async () => {
    try {
      setCopying(true)
      await navigator.clipboard.writeText(url)

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set a new timeout to reset the copying state
      timeoutRef.current = setTimeout(() => {
        setCopying(false)
      }, 2000)

      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
        duration: 2000,
      })

      if (onShare) {
        onShare()
      }
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the URL manually.",
        variant: "destructive",
      })
      setCopying(false)
    }

    setOpen(false)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        })

        if (onShare) {
          onShare()
        }

        toast({
          title: "Shared successfully!",
          duration: 2000,
        })
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          toast({
            title: "Sharing failed",
            description: "Please try another sharing method.",
            variant: "destructive",
          })
        }
      }
    } else {
      setOpen(true)
    }
  }

  const handleSocialShare = (platform: string) => {
    let shareUrl = ""

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      default:
        return
    }

    window.open(shareUrl, "_blank", "width=600,height=400")
    setOpen(false)

    if (onShare) {
      onShare()
    }
  }

  return (
    <>
      {isMobile && navigator.share ? (
        <Button variant={variant} size={size} onClick={handleNativeShare} className={cn("", className)}>
          <Share2 className="h-4 w-4 mr-2" />
          {showText && "Share"}
        </Button>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={size} className={cn("", className)}>
              <Share2 className="h-4 w-4 mr-2" />
              {showText && "Share"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Share this post</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 focus:bg-gray-100"
              onClick={() => handleSocialShare("facebook")}
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <span>Facebook</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 focus:bg-gray-100"
              onClick={() => handleSocialShare("twitter")}
            >
              <Twitter className="h-4 w-4 text-sky-500" />
              <span>Twitter</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 focus:bg-gray-100"
              onClick={() => handleSocialShare("linkedin")}
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              <span>LinkedIn</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 focus:bg-gray-100"
              onClick={handleCopyLink}
            >
              {copying ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span>{copying ? "Copied!" : "Copy link"}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 focus:bg-gray-100"
              onClick={() => {
                window.open(
                  `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this post: ${url}`)}`,
                  "_blank",
                )
                setOpen(false)
                if (onShare) onShare()
              }}
            >
              <Send className="h-4 w-4" />
              <span>Email</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 focus:bg-gray-100"
              onClick={() => {
                // Open QR code modal or view
                toast({
                  title: "QR Code",
                  description: "QR code generation is coming soon!",
                })
                setOpen(false)
              }}
            >
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}
