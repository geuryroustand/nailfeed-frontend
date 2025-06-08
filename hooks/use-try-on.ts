"use client";

import { useState } from "react";
import {
  initMediaPipe,
  prepareImageForMediaPipe,
  applyNailDesign,
} from "@/lib/try-on-utils";

export function useTryOn() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Apply a nail design to a hand image
   * @param handImageSrc Source of the hand image
   * @param designImageSrc Source of the nail design image
   * @returns Promise resolving to the processed image data URL
   */
  const applyDesign = async (
    handImageSrc: string,
    designImageSrc: string
  ): Promise<string> => {
    setIsLoading(true);
    console.log("Starting design application process...");

    try {
      // Initialize MediaPipe
      console.log("Initializing MediaPipe...");
      const mediaPipeInitialized = await initMediaPipe();
      if (!mediaPipeInitialized) {
        console.warn(
          "MediaPipe initialization failed, falling back to basic overlay"
        );
        return applyBasicOverlay(handImageSrc, designImageSrc);
      }

      // Apply the nail design using MediaPipe
      console.log("Applying nail design with MediaPipe...");
      const result = await applyNailDesign(handImageSrc, designImageSrc);
      console.log("Design application completed successfully");
      return result;
    } catch (error) {
      console.error("Error in applyDesign:", error);
      // Fall back to basic overlay if MediaPipe fails
      console.log("Falling back to basic overlay due to error");
      return applyBasicOverlay(handImageSrc, designImageSrc);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Basic overlay fallback when MediaPipe is not available
   */
  const applyBasicOverlay = async (
    handImageSrc: string,
    designImageSrc: string
  ): Promise<string> => {
    console.log("Using basic overlay fallback...");

    // Load the hand image
    const handImage = await loadImage(handImageSrc);

    // Load the design image - handle local paths differently
    const isLocalDesign =
      designImageSrc.startsWith("/") && !designImageSrc.startsWith("//");
    const designImage = await loadImage(designImageSrc, !isLocalDesign);

    // Create a canvas to composite the images
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Set canvas dimensions to match the hand image
    canvas.width = handImage.width;
    canvas.height = handImage.height;

    // Draw the hand image as the base
    ctx.drawImage(handImage, 0, 0, canvas.width, canvas.height);

    // Calculate a position for the design
    const designWidth = canvas.width * 0.3; // 30% of the hand image width
    const designHeight = (designWidth / designImage.width) * designImage.height;
    const designX = canvas.width * 0.35; // Position at 35% from the left
    const designY = canvas.height * 0.4; // Position at 40% from the top

    // Draw the design with some transparency to blend it
    ctx.globalAlpha = 0.85;
    ctx.drawImage(designImage, designX, designY, designWidth, designHeight);
    ctx.globalAlpha = 1.0;

    return canvas.toDataURL("image/png");
  };

  /**
   * Load an image from a source URL or data URL
   * @param src Image source
   * @param useCrossOrigin Whether to use crossOrigin for the image
   * @returns Promise resolving to the loaded image
   */
  const loadImage = (
    src: string,
    useCrossOrigin = true
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error("Error loading image:", src, e);
        reject(new Error(`Failed to load image: ${src}`));
      };

      // Only set crossOrigin for non-local images if specified
      if (useCrossOrigin) {
        img.crossOrigin = "anonymous";
      }

      img.src = src;
    });
  };

  return {
    applyDesign,
    isLoading,
  };
}
