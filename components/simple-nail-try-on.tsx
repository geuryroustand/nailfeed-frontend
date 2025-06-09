"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Move, Eye } from "lucide-react"
import { processHandImage } from "@/lib/simple-hand-detection"

interface NailDesign {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fingerId: number
  fingerName: string
}

export default function SimpleNailTryOn() {
  const [handImageSrc, setHandImageSrc] = useState<string>("")
  const [nailDesignSrc, setNailDesignSrc] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>("")
  const [nailDesigns, setNailDesigns] = useState<NailDesign[]>([])
  const [selectedDesignId, setSelectedDesignId] = useState<string>("")
  const [showControls, setShowControls] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handImageRef = useRef<HTMLImageElement>(null)
  const nailImageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nailInputRef = useRef<HTMLInputElement>(null)

  const handleHandImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setHandImageSrc(e.target?.result as string)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleNailDesignUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNailDesignSrc(e.target?.result as string)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const applyNailDesign = useCallback(async () => {
    if (!handImageSrc || !nailDesignSrc || !handImageRef.current) {
      setError("Please upload both a hand image and nail design")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      // Process the hand image to detect nail positions
      const result = await processHandImage(handImageRef.current)

      // Create nail designs for each detected position
      const newDesigns: NailDesign[] = result.nailPositions.map((position, index) => ({
        id: `nail-${index}`,
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
        rotation: position.rotation,
        opacity: 0.8,
        fingerId: position.fingerId,
        fingerName: position.fingerName,
      }))

      setNailDesigns(newDesigns)
      setShowControls(true)

      // Render the initial composition
      renderComposition(newDesigns)
    } catch (err) {
      setError("Failed to process hand image. Please try a different image.")
      console.error("Hand processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [handImageSrc, nailDesignSrc])

  const renderComposition = useCallback(
    (designs: NailDesign[] = nailDesigns) => {
      const canvas = canvasRef.current
      const handImg = handImageRef.current
      const nailImg = nailImageRef.current

      if (!canvas || !handImg || !nailImg) return

      const ctx = canvas.getContext("2d")!

      // Set canvas size to match hand image
      canvas.width = handImg.naturalWidth
      canvas.height = handImg.naturalHeight

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw hand image
      ctx.drawImage(handImg, 0, 0)

      // Draw nail designs
      designs.forEach((design) => {
        ctx.save()

        // Set opacity
        ctx.globalAlpha = design.opacity

        // Move to design position
        ctx.translate(design.x, design.y)

        // Apply rotation
        ctx.rotate((design.rotation * Math.PI) / 180)

        // Draw nail design centered
        ctx.drawImage(nailImg, -design.width / 2, -design.height / 2, design.width, design.height)

        ctx.restore()
      })
    },
    [nailDesigns],
  )

  const updateSelectedDesign = useCallback(
    (updates: Partial<NailDesign>) => {
      if (!selectedDesignId) return

      const updatedDesigns = nailDesigns.map((design) =>
        design.id === selectedDesignId ? { ...design, ...updates } : design,
      )

      setNailDesigns(updatedDesigns)
      renderComposition(updatedDesigns)
    },
    [selectedDesignId, nailDesigns, renderComposition],
  )

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY

      // Find clicked design
      const clickedDesign = nailDesigns.find((design) => {
        const dx = x - design.x
        const dy = y - design.y
        return Math.abs(dx) <= design.width / 2 && Math.abs(dy) <= design.height / 2
      })

      if (clickedDesign) {
        setSelectedDesignId(clickedDesign.id)
      }
    },
    [nailDesigns],
  )

  // Re-render when nail image loads
  useEffect(() => {
    if (nailImageRef.current && nailDesigns.length > 0) {
      renderComposition()
    }
  }, [nailDesignSrc, renderComposition])

  const selectedDesign = nailDesigns.find((d) => d.id === selectedDesignId)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Simple Nail Design Try-On
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Upload Hand Image</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleHandImageUpload}
                className="cursor-pointer"
              />
              {handImageSrc && (
                <img
                  ref={handImageRef}
                  src={handImageSrc || "/placeholder.svg"}
                  alt="Hand"
                  className="w-full h-32 object-cover rounded border"
                  onLoad={() => console.log("Hand image loaded")}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Upload Nail Design</Label>
              <Input
                ref={nailInputRef}
                type="file"
                accept="image/*"
                onChange={handleNailDesignUpload}
                className="cursor-pointer"
              />
              {nailDesignSrc && (
                <img
                  ref={nailImageRef}
                  src={nailDesignSrc || "/placeholder.svg"}
                  alt="Nail Design"
                  className="w-full h-32 object-cover rounded border"
                  onLoad={() => console.log("Nail design loaded")}
                />
              )}
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={applyNailDesign}
            disabled={!handImageSrc || !nailDesignSrc || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? "Processing..." : "Apply Nail Design"}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Canvas and Controls */}
      {showControls && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="w-full border rounded cursor-pointer"
                  style={{ maxHeight: "500px", objectFit: "contain" }}
                />
                <p className="text-sm text-muted-foreground mt-2">Click on a nail design to select and edit it</p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Move className="w-5 h-5" />
                  Design Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDesign ? (
                  <>
                    <div className="text-sm font-medium">Selected: {selectedDesign.fingerName}</div>

                    <div className="space-y-2">
                      <Label>Position X</Label>
                      <Slider
                        value={[selectedDesign.x]}
                        onValueChange={([x]) => updateSelectedDesign({ x })}
                        min={0}
                        max={canvasRef.current?.width || 500}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Position Y</Label>
                      <Slider
                        value={[selectedDesign.y]}
                        onValueChange={([y]) => updateSelectedDesign({ y })}
                        min={0}
                        max={canvasRef.current?.height || 500}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Slider
                        value={[selectedDesign.width]}
                        onValueChange={([width]) =>
                          updateSelectedDesign({
                            width,
                            height: width * 1.25, // Maintain aspect ratio
                          })
                        }
                        min={10}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rotation</Label>
                      <Slider
                        value={[selectedDesign.rotation]}
                        onValueChange={([rotation]) => updateSelectedDesign({ rotation })}
                        min={-180}
                        max={180}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Opacity</Label>
                      <Slider
                        value={[selectedDesign.opacity]}
                        onValueChange={([opacity]) => updateSelectedDesign({ opacity })}
                        min={0.1}
                        max={1}
                        step={0.1}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Click on a nail design in the preview to edit it</p>
                )}
              </CardContent>
            </Card>

            {/* Nail List */}
            <Card>
              <CardHeader>
                <CardTitle>Detected Nails</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {nailDesigns.map((design) => (
                    <Button
                      key={design.id}
                      variant={selectedDesignId === design.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDesignId(design.id)}
                      className="w-full justify-start"
                    >
                      {design.fingerName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
