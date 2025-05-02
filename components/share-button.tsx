"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Share2, Facebook, Twitter, Linkedin, Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"

interface ShareButtonProps {
  url: string
  title?: string
  description?: string
  image?: string
  children?: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onShare?: () => void
}

export function ShareButton({
  url,
  title = "Check out this post",
  description = "I found this interesting post",
  image,
  children,
  variant = "default",
  size = "default",
  className,
  onShare,
}: ShareButtonProps) {
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)

  // Function to handle native sharing (for mobile devices)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        })
        if (onShare) onShare()
        toast({
          title: "Shared successfully",
          description: "The post has been shared",
        })
      } catch (error) {
        // User cancelled or share failed
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback for devices that don't support native sharing
      setIsOpen(true)
    }
  }

  // Function to handle sharing to specific platforms
  const handleShare = (platform: string) => {
    let shareUrl = ""
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    const encodedDescription = encodeURIComponent(description)

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case "email":
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
        break
      default:
        break
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer")
      if (onShare) onShare()
      setIsOpen(false)
      toast({
        title: "Shared successfully",
        description: `The post has been shared to ${platform}`,
      })
    }
  }

  // If native sharing is available on mobile, use that
  if (isMobile && navigator.share) {
    return (
      <Button variant={variant} size={size} className={className} onClick={handleNativeShare} aria-label="Share post">
        {children || (
          <>
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </>
        )}
      </Button>
    )
  }

  // Otherwise, use the popover menu
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className={className} aria-label="Share post">
          {children || (
            <>
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Share this post</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleShare("twitter")}>
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleShare("linkedin")}
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleShare("email")}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
