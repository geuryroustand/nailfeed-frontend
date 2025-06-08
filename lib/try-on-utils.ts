// Utility functions for the try-on feature with improved nail detection and detailed logging

interface NailPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

let handsModule: any = null;

export async function initMediaPipe(): Promise<boolean> {
  if (typeof window === "undefined") {
    console.warn(
      "MediaPipe initialization skipped: Not in browser environment"
    );
    return false;
  }

  if (handsModule) {
    console.log("MediaPipe Hands already initialized");
    return true;
  }

  try {
    console.log("Starting MediaPipe Hands initialization...");

    // Check if script is already loaded
    if (!(window as any).Hands) {
      console.log("Loading MediaPipe Hands script from CDN...");
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js";
      script.async = true;
      script.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          console.log("MediaPipe Hands script loaded successfully");
          resolve();
        };
        script.onerror = (e) => {
          console.error("Failed to load MediaPipe Hands script:", e);
          reject(new Error("Failed to load MediaPipe Hands script"));
        };
        document.head.appendChild(script);
      });

      // Give a small delay to ensure script is fully initialized
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Verify script was loaded
    if (!(window as any).Hands) {
      throw new Error("MediaPipe Hands not available after script load");
    }

    console.log("Initializing MediaPipe Hands module...");
    const Hands = (window as any).Hands;
    handsModule = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    });

    // Configure with optimal settings for nail detection
    handsModule.setOptions({
      maxNumHands: 2, // Support up to 2 hands for better nail detection
      modelComplexity: 1, // Use full model for better accuracy
      minDetectionConfidence: 0.7, // Higher confidence threshold for better accuracy
      minTrackingConfidence: 0.5, // Standard tracking confidence
    });

    // Verify module initialization
    if (!handsModule) {
      throw new Error("Failed to initialize MediaPipe Hands module");
    }

    console.log("MediaPipe Hands module initialized successfully");
    return true;
  } catch (err) {
    console.error("Error initializing MediaPipe Hands:", err);
    handsModule = null; // Reset module on failure
    return false;
  }
}

async function processWithMediaPipe(canvas: HTMLCanvasElement): Promise<any> {
  console.log("Processing image with MediaPipe...");
  if (!handsModule) {
    throw new Error("MediaPipe Hands not initialized");
  }

  return new Promise((resolve, reject) => {
    // Set up the results callback
    handsModule.onResults((results: any) => {
      console.log("MediaPipe results received:", {
        multiHandLandmarks: results.multiHandLandmarks?.length || 0,
        multiHandedness: results.multiHandedness?.length || 0,
      });

      if (!results.multiHandLandmarks?.length) {
        console.warn("No hands detected in the image");
      } else {
        // Log detailed information about detected hands
        results.multiHandLandmarks.forEach(
          (landmarks: any[], index: number) => {
            console.log(
              `Hand ${index + 1} detected with ${landmarks.length} landmarks`
            );
          }
        );
      }

      resolve(results);
    });

    try {
      // Send the canvas image to MediaPipe
      console.log("Sending image to MediaPipe for processing...");
      handsModule.send({ image: canvas });
    } catch (err) {
      console.error("Error sending image to MediaPipe:", err);
      reject(err);
    }
  });
}

export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  console.log("Starting hand detection for image:", imageUrl);

  // Initialize MediaPipe if needed
  if (!handsModule) {
    console.log("MediaPipe not initialized, initializing now...");
    const ok = await initMediaPipe();
    if (!ok) {
      console.warn("MediaPipe initialization failed, using fallback detection");
      return fallbackNailDetection(imageUrl);
    }
  }

  try {
    // Load and prepare the image
    console.log("Loading and preparing image...");
    const canvas = await prepareImageForMediaPipe(imageUrl);

    // Process with MediaPipe
    console.log("Processing image with MediaPipe...");
    const results = await processWithMediaPipe(canvas);

    // Validate hand detection results
    if (
      !results.multiHandLandmarks ||
      !Array.isArray(results.multiHandLandmarks)
    ) {
      console.warn("Invalid hand landmarks data received from MediaPipe");
      return fallbackNailDetection(imageUrl);
    }

    const numHands = results.multiHandLandmarks.length;
    console.log(`MediaPipe detected ${numHands} hand(s)`);

    if (numHands === 0) {
      console.warn("No hands detected in the image");
      return fallbackNailDetection(imageUrl);
    }

    // Validate landmarks for each detected hand
    const validHands = results.multiHandLandmarks.filter(
      (landmarks: any[], index: number) => {
        if (!Array.isArray(landmarks) || landmarks.length < 21) {
          console.warn(`Hand ${index + 1} has invalid landmarks data`);
          return false;
        }

        // Check if all required landmarks are present and valid
        const hasValidLandmarks = landmarks.every(
          (landmark: any) =>
            landmark &&
            typeof landmark.x === "number" &&
            typeof landmark.y === "number" &&
            typeof landmark.z === "number"
        );

        if (!hasValidLandmarks) {
          console.warn(`Hand ${index + 1} has invalid landmark coordinates`);
          return false;
        }

        console.log(`Hand ${index + 1} has valid landmarks`);
        return true;
      }
    );

    if (validHands.length === 0) {
      console.warn("No valid hands found after landmark validation");
      return fallbackNailDetection(imageUrl);
    }

    console.log(
      `Processing ${validHands.length} valid hand(s) for nail positions...`
    );
    const nailPositions: NailPosition[] = [];

    // MediaPipe Hands landmark indices for each finger
    const FINGER_LANDMARKS = {
      thumb: {
        tip: 4, // Thumb tip
        mid: 3, // Thumb IP joint
        base: 2, // Thumb MCP joint
      },
      index: {
        tip: 8, // Index finger tip
        mid: 7, // Index finger PIP joint
        base: 6, // Index finger MCP joint
      },
      middle: {
        tip: 12, // Middle finger tip
        mid: 11, // Middle finger PIP joint
        base: 10, // Middle finger MCP joint
      },
      ring: {
        tip: 16, // Ring finger tip
        mid: 15, // Ring finger PIP joint
        base: 14, // Ring finger MCP joint
      },
      pinky: {
        tip: 20, // Pinky tip
        mid: 19, // Pinky PIP joint
        base: 18, // Pinky MCP joint
      },
    };

    for (const landmarks of validHands) {
      // Process each finger
      for (const [fingerName, indices] of Object.entries(FINGER_LANDMARKS)) {
        // Get landmark coordinates
        const tip = landmarks[indices.tip];
        const mid = landmarks[indices.mid];
        const base = landmarks[indices.base];

        // Convert normalized coordinates to pixel coordinates
        const tipX = tip.x * canvas.width;
        const tipY = tip.y * canvas.height;
        const midX = mid.x * canvas.width;
        const midY = mid.y * canvas.height;
        const baseX = base.x * canvas.width;
        const baseY = base.y * canvas.height;

        // Calculate finger segment lengths
        const proximalLength = Math.hypot(midX - baseX, midY - baseY); // Base to middle joint
        const distalLength = Math.hypot(tipX - midX, tipY - midY); // Middle joint to tip

        // Calculate nail dimensions
        // Width is 75% of the proximal segment length (base to middle joint)
        const nailWidth = proximalLength * 0.75;
        // Height is 1.5x the width to simulate natural nail shape
        const nailHeight = nailWidth * 1.5;

        // Calculate nail angle using atan2 between tip and middle joint
        // This gives us the angle of the distal phalanx (last finger segment)
        const angle = Math.atan2(tipY - midY, tipX - midX) * (180 / Math.PI);

        // Calculate offset to position nail slightly above the fingertip
        // The offset is proportional to the nail height to maintain consistency
        const offsetDistance = nailHeight * 0.2; // 20% of nail height
        const offsetX = Math.sin((angle * Math.PI) / 180) * offsetDistance;
        const offsetY = -Math.cos((angle * Math.PI) / 180) * offsetDistance;

        // Calculate final nail position
        // Center the nail on the fingertip and apply the offset
        const pos: NailPosition = {
          x: tipX - nailWidth / 2 + offsetX,
          y: tipY - nailHeight / 2 + offsetY,
          width: nailWidth,
          height: nailHeight,
          angle: angle,
        };

        // Log detailed information about the calculations
        console.log(`${fingerName} finger calculations:`, {
          finger: fingerName,
          segments: {
            proximal: {
              length: Math.round(proximalLength),
              start: { x: Math.round(baseX), y: Math.round(baseY) },
              end: { x: Math.round(midX), y: Math.round(midY) },
            },
            distal: {
              length: Math.round(distalLength),
              start: { x: Math.round(midX), y: Math.round(midY) },
              end: { x: Math.round(tipX), y: Math.round(tipY) },
            },
          },
          nail: {
            dimensions: {
              width: Math.round(nailWidth),
              height: Math.round(nailHeight),
            },
            position: {
              x: Math.round(pos.x),
              y: Math.round(pos.y),
            },
            angle: Math.round(angle),
            offset: {
              distance: Math.round(offsetDistance),
              x: Math.round(offsetX),
              y: Math.round(offsetY),
            },
          },
        });

        nailPositions.push(pos);
      }
    }

    if (nailPositions.length === 0) {
      console.warn("No valid nail positions could be calculated");
      return fallbackNailDetection(imageUrl);
    }

    // Group nail positions by hand for better organization
    const handGroups = validHands.map((_: any, handIndex: number) => {
      const startIndex = handIndex * 5;
      return nailPositions.slice(startIndex, startIndex + 5);
    });

    // Log detailed summary of detected nail positions
    console.log("=== Nail Position Detection Summary ===");
    console.log(`Total hands detected: ${handGroups.length}`);
    console.log(`Total nail positions: ${nailPositions.length}`);

    handGroups.forEach((handNails: NailPosition[], handIndex: number) => {
      console.log(`\nHand ${handIndex + 1} Nail Positions:`);
      handNails.forEach((pos: NailPosition, nailIndex: number) => {
        const fingerName = Object.keys(FINGER_LANDMARKS)[nailIndex];
        console.log(`  ${fingerName} finger:`, {
          position: {
            x: Math.round(pos.x),
            y: Math.round(pos.y),
          },
          dimensions: {
            width: Math.round(pos.width),
            height: Math.round(pos.height),
          },
          angle: Math.round(pos.angle),
          // Calculate center point for reference
          center: {
            x: Math.round(pos.x + pos.width / 2),
            y: Math.round(pos.y + pos.height / 2),
          },
        });
      });
    });

    // Log validation summary
    console.log("\n=== Validation Summary ===");
    console.log("All nail positions have valid:", {
      x: nailPositions.every((p) => typeof p.x === "number" && !isNaN(p.x)),
      y: nailPositions.every((p) => typeof p.y === "number" && !isNaN(p.y)),
      width: nailPositions.every(
        (p) => typeof p.width === "number" && p.width > 0
      ),
      height: nailPositions.every(
        (p) => typeof p.height === "number" && p.height > 0
      ),
      angle: nailPositions.every(
        (p) => typeof p.angle === "number" && !isNaN(p.angle)
      ),
    });

    // Log position statistics
    const stats = {
      x: {
        min: Math.min(...nailPositions.map((p) => p.x)),
        max: Math.max(...nailPositions.map((p) => p.x)),
        avg:
          nailPositions.reduce((sum, p) => sum + p.x, 0) / nailPositions.length,
      },
      y: {
        min: Math.min(...nailPositions.map((p) => p.y)),
        max: Math.max(...nailPositions.map((p) => p.y)),
        avg:
          nailPositions.reduce((sum, p) => sum + p.y, 0) / nailPositions.length,
      },
      width: {
        min: Math.min(...nailPositions.map((p) => p.width)),
        max: Math.max(...nailPositions.map((p) => p.width)),
        avg:
          nailPositions.reduce((sum, p) => sum + p.width, 0) /
          nailPositions.length,
      },
      height: {
        min: Math.min(...nailPositions.map((p) => p.height)),
        max: Math.max(...nailPositions.map((p) => p.height)),
        avg:
          nailPositions.reduce((sum, p) => sum + p.height, 0) /
          nailPositions.length,
      },
    };

    console.log("\n=== Position Statistics ===");
    console.log("Coordinate ranges:", {
      x: {
        min: Math.round(stats.x.min),
        max: Math.round(stats.x.max),
        avg: Math.round(stats.x.avg),
      },
      y: {
        min: Math.round(stats.y.min),
        max: Math.round(stats.y.max),
        avg: Math.round(stats.y.avg),
      },
    });
    console.log("Dimension ranges:", {
      width: {
        min: Math.round(stats.width.min),
        max: Math.round(stats.width.max),
        avg: Math.round(stats.width.avg),
      },
      height: {
        min: Math.round(stats.height.min),
        max: Math.round(stats.height.max),
        avg: Math.round(stats.height.avg),
      },
    });

    console.log("\nReturning nail positions for design application");
    return nailPositions;
  } catch (error) {
    console.error("Error in hand detection:", error);
    console.log("Falling back to basic nail detection");
    return fallbackNailDetection(imageUrl);
  }
}

export async function extractNailDesign(
  designImageUrl: string
): Promise<HTMLCanvasElement> {
  try {
    // Load the design image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = designImageUrl;
    });

    // Create a canvas for the extracted design
    const size = 200; // Default nail size
    const designCanvas = document.createElement("canvas");
    designCanvas.width = size;
    designCanvas.height = size * 1.5; // Oval shape for nail
    const ctx = designCanvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    // Clear the canvas
    ctx.clearRect(0, 0, designCanvas.width, designCanvas.height);

    // Create an oval clipping path for the nail shape
    ctx.beginPath();
    ctx.ellipse(
      size / 2,
      size * 0.75,
      size / 2,
      size * 0.75,
      0,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();

    // Calculate the best crop area from the source image
    const sourceAspect = img.width / img.height;
    const targetAspect = designCanvas.width / designCanvas.height;

    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;

    if (sourceAspect > targetAspect) {
      // Source is wider, crop horizontally
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      // Source is taller, crop vertically
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }

    // Draw the design image scaled to fit the nail shape
    ctx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      designCanvas.width,
      designCanvas.height
    );

    return designCanvas;
  } catch (error) {
    console.error("Error extracting nail design:", error);
    return createFallbackDesign(designImageUrl);
  }
}

async function createFallbackDesign(
  designImageUrl: string
): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = designImageUrl;
  });

  const size = 200; // Default nail size
  const designCanvas = document.createElement("canvas");
  designCanvas.width = size;
  designCanvas.height = size * 1.5; // Oval shape
  const ctx = designCanvas.getContext("2d");

  if (!ctx) throw new Error("Could not create canvas context");

  // Clear canvas
  ctx.clearRect(0, 0, designCanvas.width, designCanvas.height);

  // Create an oval clipping path
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 0.75, size / 2, size * 0.75, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Draw the center portion of the image
  const sourceSize = Math.min(img.width, img.height);
  const sx = (img.width - sourceSize) / 2;
  const sy = (img.height - sourceSize) / 2;

  ctx.drawImage(
    img,
    sx,
    sy,
    sourceSize,
    sourceSize,
    0,
    0,
    designCanvas.width,
    designCanvas.height
  );

  return designCanvas;
}

export async function applyNailDesign(
  sourceImageUrl: string,
  designImageUrl: string
): Promise<string> {
  try {
    console.log("Starting nail design application process");

    // First detect hands and nail positions
    console.log("Detecting nail positions...");
    const nailPositions = await detectHands(sourceImageUrl);
    console.log(`Detected ${nailPositions.length} nail positions`);

    // Extract the nail design
    console.log("Extracting nail design...");
    const designCanvas = await extractNailDesign(designImageUrl);

    // Create a new canvas for the result
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create canvas context");

    // Load the source image
    const sourceImage = new Image();
    sourceImage.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      sourceImage.onload = resolve;
      sourceImage.onerror = reject;
      sourceImage.src = sourceImageUrl;
    });

    // Set canvas dimensions to match source image
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;

    console.log("Drawing source image", sourceImage.width, sourceImage.height);
    context.drawImage(sourceImage, 0, 0);

    console.log("Applying nail designs to detected positions...");

    // Apply the design to each detected nail
    if (nailPositions && nailPositions.length > 0) {
      for (const nail of nailPositions) {
        // Save the current context state
        context.save();

        // Translate to the center of the nail position
        context.translate(nail.x + nail.width / 2, nail.y + nail.height / 2);

        // Rotate to match the nail angle
        context.rotate((nail.angle * Math.PI) / 180);

        // Calculate scale to fit the nail size
        const scaleX = nail.width / designCanvas.width;
        const scaleY = nail.height / designCanvas.height;

        // Apply scaling
        context.scale(scaleX, scaleY);

        console.log(
          "Drawing nail design at",
          nail.x,
          nail.y,
          nail.width,
          nail.height
        );
        context.drawImage(
          designCanvas,
          -designCanvas.width / 2,
          -designCanvas.height / 2,
          designCanvas.width,
          designCanvas.height
        );

        // Restore the context state
        context.restore();

        // Apply shine effect to make it look more realistic
        applyShineEffect(
          context,
          nail.x,
          nail.y,
          nail.width,
          nail.height,
          nail.angle
        );
      }

      console.log("Nail designs applied successfully");
    } else {
      // If no nails detected, use a fallback method
      console.log("No nail positions detected, using fallback placement");

      // Apply fallback nails
      const fallbackNails = await fallbackNailDetection(sourceImageUrl);
      for (const nail of fallbackNails) {
        context.save();
        context.translate(nail.x + nail.width / 2, nail.y + nail.height / 2);
        context.rotate((nail.angle * Math.PI) / 180);

        const scaleX = nail.width / designCanvas.width;
        const scaleY = nail.height / designCanvas.height;
        context.scale(scaleX, scaleY);

        console.log(
          "Drawing nail design at",
          nail.x,
          nail.y,
          nail.width,
          nail.height
        );
        context.drawImage(
          designCanvas,
          -designCanvas.width / 2,
          -designCanvas.height / 2,
          designCanvas.width,
          designCanvas.height
        );

        context.restore();
        applyShineEffect(
          context,
          nail.x,
          nail.y,
          nail.width,
          nail.height,
          nail.angle
        );
      }
    }

    // Return the resulting image as data URL
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error applying nail design:", err);
    throw err;
  }
}

function applyShineEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number
) {
  ctx.save();

  // Translate and rotate to match nail position
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((angle * Math.PI) / 180);

  // Create a subtle gradient for shine effect
  const gradient = ctx.createLinearGradient(
    -width / 2,
    -height / 2,
    width / 2,
    height / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  // Apply the shine as an overlay
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add a highlight spot for extra realism
  const highlightGradient = ctx.createRadialGradient(
    -width / 4,
    -height / 4,
    0,
    -width / 4,
    -height / 4,
    width / 3
  );
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.ellipse(
    -width / 4,
    -height / 4,
    width / 3,
    height / 3,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

export async function fallbackNailDetection(
  imageUrl: string
): Promise<NailPosition[]> {
  console.log("Starting fallback nail detection for", imageUrl);
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((resolve) => {
    img.onload = () => resolve(null);
    img.src = imageUrl;
  });

  const width = img.width;
  const height = img.height;
  const nailPositions: NailPosition[] = [];
  const nailWidth = width / 12;
  const nailHeight = nailWidth * 1.5;
  const startX = width / 4;
  const y = (height * 2) / 3;

  for (let i = 0; i < 5; i++) {
    const pos = {
      x: startX + i * nailWidth * 1.5,
      y,
      width: nailWidth,
      height: nailHeight,
      angle: 0,
    };
    console.log("Fallback nail position:", pos);
    nailPositions.push(pos);
  }

  return nailPositions;
}

export function saveImage(
  dataUrl: string,
  filename = "nail-design-try-on.png"
) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function shareImage(
  dataUrl: string,
  title = "My Virtual Nail Design"
) {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: "Check out my virtual nail design try-on!",
        files: [new File([blob], "nail-design.png", { type: "image/png" })],
      });
      return true;
    } else {
      // Fallback for browsers that don't support Web Share API
      saveImage(dataUrl);
      return false;
    }
  } catch (error) {
    console.error("Error sharing image:", error);
    return false;
  }
}

/**
 * Loads an image and prepares it on a canvas for MediaPipe Hands processing
 * @param imageSource - URL or File object of the image to process
 * @returns Promise resolving to the prepared canvas element
 */
export async function prepareImageForMediaPipe(
  imageSource: string | File
): Promise<HTMLCanvasElement> {
  try {
    console.log("Preparing image for MediaPipe processing...");

    // Create canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Load the image
    const img = new Image();
    img.crossOrigin = "anonymous";

    // Handle both URL strings and File objects
    if (typeof imageSource === "string") {
      console.log("Loading image from URL:", imageSource);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) =>
          reject(new Error(`Failed to load image from URL: ${e}`));
        img.src = imageSource;
      });
    } else {
      console.log("Loading image from File object");
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) =>
          reject(new Error(`Failed to load image from File: ${e}`));
        img.src = URL.createObjectURL(imageSource);
      });
    }

    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Clean up object URL if created from File
    if (typeof imageSource !== "string") {
      URL.revokeObjectURL(img.src);
    }

    console.log("Image prepared successfully on canvas:", {
      width: canvas.width,
      height: canvas.height,
    });

    return canvas;
  } catch (error) {
    console.error("Error preparing image for MediaPipe:", error);
    throw error;
  }
}
