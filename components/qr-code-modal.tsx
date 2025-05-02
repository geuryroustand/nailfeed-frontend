"use client"

import { useState, useRef, useEffect } from "react"
import QRCode from "qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface QRCodeModalProps {
  url: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRCodeModal({ url, title, open, onOpenChange }: QRCodeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open && url) {
      generateQRCode()
    }
  }, [open, url])

  const generateQRCode = async () => {
    try {
      const canvas = canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, url, {
          width: 250,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        })

        // Generate data URL for download
        const dataUrl = canvas.toDataURL("image/png")
        setQrCodeDataUrl(dataUrl)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      })
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement("a")
    link.href = qrCodeDataUrl
    link.download = `qrcode-${title.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Downloaded",
      description: "QR code has been downloaded",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share via QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <canvas ref={canvasRef} className="mx-auto" />
          </div>
          <p className="text-sm text-center mt-4 text-gray-500 max-w-xs">
            Scan this QR code with your phone camera to open this post
          </p>
          <Button onClick={downloadQRCode} className="mt-4" disabled={!qrCodeDataUrl}>
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
