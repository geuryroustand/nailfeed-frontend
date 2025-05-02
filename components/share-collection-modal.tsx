"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Loader2, User, LucideLink } from "lucide-react"
import { useCollections, type Collection } from "@/context/collections-context"

interface ShareCollectionModalProps {
  collection: Collection
  onClose: () => void
}

export default function ShareCollectionModal({ collection, onClose }: ShareCollectionModalProps) {
  const { shareCollection, getShareLink } = useCollections()
  const [shareType, setShareType] = useState<"link" | "user">("link")
  const [recipient, setRecipient] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [isLinkCopied, setIsLinkCopied] = useState(false)

  const handleShare = async () => {
    setIsLoading(true)
    try {
      if (shareType === "link") {
        const link = await getShareLink(collection.id)
        setShareLink(link)
        navigator.clipboard.writeText(link)
        setIsLinkCopied(true)
        setTimeout(() => setIsLinkCopied(false), 2000)
      } else if (shareType === "user") {
        await shareCollection(collection.id, "user", { recipient })
      }
      onClose()
    } catch (error) {
      console.error("Error sharing collection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={shareType === "link" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareType("link")}
            >
              <LucideLink className="h-4 w-4 mr-2" />
              Shareable Link
            </Button>
            <Button
              variant={shareType === "user" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareType("user")}
            >
              <User className="h-4 w-4 mr-2" />
              Share with User
            </Button>
          </div>

          {shareType === "link" ? (
            <>
              <p>Anyone with this link can view the collection.</p>
              {shareLink ? (
                <div className="flex items-center space-x-2">
                  <Input value={shareLink} readOnly />
                  <Button variant="outline" size="sm" onClick={handleShare} disabled={isLoading}>
                    {isLinkCopied ? <Check className="h-4 w-4" /> : "Copy Link"}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleShare} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Link...
                    </>
                  ) : (
                    "Generate Shareable Link"
                  )}
                </Button>
              )}
            </>
          ) : (
            <>
              <Label htmlFor="recipient">Recipient Username</Label>
              <Input
                id="recipient"
                placeholder="username"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </>
          )}
        </div>

        <Button onClick={handleShare} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sharing...
            </>
          ) : (
            "Share"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
