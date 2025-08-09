"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Share2, RotateCcw } from "lucide-react";
import { CameraCapture } from "./camera-capture";

interface TryOnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designImageUrl: string;
  designTitle?: string;
}

export function TryOnModal({
  open,
  onOpenChange,
  designImageUrl,
  designTitle = "Nail Design",
}: TryOnModalProps) {
  // Create refs for video and canvas elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTab, setActiveTab] = useState("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCapturedImage(null);
      setActiveTab("camera");
    }
  }, [open]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref is not available");
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        console.error("Could not get canvas context");
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0);

      // Get the captured image as data URL
      const imageDataUrl = canvas.toDataURL("image/png");

      // Stop the camera stream
      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Set the captured image and move to preview tab
      setCapturedImage(imageDataUrl);
      setActiveTab("preview");
    } catch (error) {
      console.error("Error capturing photo:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setCapturedImage(imageDataUrl);
      setActiveTab("preview");
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    // Stop any active camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Go back to the first tab
    setActiveTab("camera");
    setCapturedImage(null);
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setActiveTab("camera");
  };

  const handleDownload = () => {
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `nail-photo-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!capturedImage) return;

    try {
      // Convert the data URL to a blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: `${designTitle} - My Nail Photo`,
          text: "Check out my nail photo!",
          files: [new File([blob], "nail-photo.png", { type: "image/png" })],
        });
      } else {
        // Fallback if Web Share API is not available
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "nail-photo.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error sharing image:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Try This Design</DialogTitle>
          <DialogDescription>
            Take a photo of your hand to reference this nail design.
          </DialogDescription>
        </DialogHeader>

        {/* Show design reference */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Design Reference:</div>
          <img
            src={designImageUrl || "/placeholder.svg"}
            alt={designTitle}
            className="w-full h-32 object-cover rounded-lg border"
          />
          <p className="text-center text-sm text-gray-600 mt-1">
            {designTitle}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera">Take Photo</TabsTrigger>
            <TabsTrigger value="preview" disabled={!capturedImage}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-4">
            <CameraCapture
              videoRef={videoRef}
              canvasRef={canvasRef}
              onCapture={handleCapture}
              onFileUpload={handleFileUpload}
              onCancel={handleCancel}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            {capturedImage && (
              <div className="flex flex-col items-center">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured hand photo"
                  className="max-w-full h-auto rounded-md mb-4 border"
                />

                <div className="flex gap-2 w-full">
                  <Button
                    onClick={handleRetakePhoto}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleShare} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p className="font-medium mb-1">💡 Tip:</p>
                  <p>
                    Show this photo and the design reference to your nail
                    technician for the best results!
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
