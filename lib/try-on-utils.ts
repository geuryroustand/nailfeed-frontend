// This file contains utility functions for the try-on feature
import '@mediapipe/hands';

// Interface for nail position
interface NailPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // Added angle for better placement
}

// Initialize MediaPipe
let handsModule: any = null;

export async function initMediaPipe() {
  try {
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      const Hands = (await import('@mediapipe/hands')).Hands;
      
      handsModule = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      await handsModule.initialize();
      
      handsModule.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      console.log("MediaPipe Hands initialized successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error initializing MediaPipe Hands:", error);
    return false;
  }
}

// Detect hands and nail positions in an image
export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  try {
    // Make sure MediaPipe is initialized
    if (!handsModule) {
      const initialized = await initMediaPipe();
      if (!initialized) {
        throw new Error("Failed to initialize MediaPipe Hands");
      }
    }

    // Load the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Create a temporary canvas to process the image
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    // Draw the image to the canvas
    ctx.drawImage(img, 0, 0);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Process the image with MediaPipe Hands
    const results = await processWithMediaPipe(imageData, canvas.width, canvas.height);
    
    if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      console.log("No hands detected, using fallback detection");
      return fallbackNailDetection(imageUrl);
    }
    
    // Extract nail positions from the MediaPipe results
    const nailPositions: NailPosition[] = [];
    
    for (const landmarks of results.multiHandLandmarks) {
      // MediaPipe hand landmarks: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
      // Fingertip indices: thumb (4), index (8), middle (12), ring (16), pinky (20)
      // Middle joints: thumb (3), index (7), middle (11), ring (15), pinky (19)
      // Base joints: thumb (2), index (6), middle (10), ring (14), pinky (18)
      
      const fingertips = [4, 8, 12, 16, 20]; // Fingertip indices
      const middleJoints = [3, 7, 11, 15, 19]; // Middle joint indices
      const baseJoints = [2, 6, 10, 14, 18]; // Base joint indices
      
      for (let i = 0; i < fingertips.length; i++) {
        const tipIndex = fingertips[i];
        const midIndex = middleJoints[i];
        const baseIndex = baseJoints[i];
        
        const tip = landmarks[tipIndex];
        const mid = landmarks[midIndex];
        const base = landmarks[baseIndex];
        
        // Skip thumb for better results (thumbs are harder to detect accurately)
        if (i === 0 && results.multiHandLandmarks.length > 1) continue;
        
        // Calculate nail width based on the distance between points
        // Convert normalized coordinates to pixel coordinates
        const tipX = tip.x * canvas.width;
        const tipY = tip.y * canvas.height;
        const midX = mid.x * canvas.width;
        const midY = mid.y * canvas.height;
        const baseX = base.x * canvas.width;
        const baseY = base.y * canvas.height;
        
        // Calculate width based on the distance between mid and base joints
        const fingerWidth = Math.sqrt(
          Math.pow(midX - baseX, 2) + Math.pow(midY - baseY, 2)
        );
        
        // Calculate nail width (typically about 70-80% of finger width)
        const nailWidth = fingerWidth * 0.75;
        
        // Calculate angle for better placement
        const angle = Math.atan2(tipY - midY, tipX - midX) * (180 / Math.PI);
        
        // Estimate nail position (slightly above fingertip)
        // The nail should be placed on the top surface of the finger
        const offsetX = Math.sin(angle * (Math.PI / 180)) * (nailWidth * 0.3);
        const offsetY = -Math.cos(angle * (Math.PI / 180)) * (nailWidth * 0.3);
        
        nailPositions.push({
          x: tipX - nailWidth / 2 + offsetX,
          y: tipY - nailWidth / 2 + offsetY,
          width: nailWidth,
          height: nailWidth * 1.5, // Make nails slightly longer than wide
          angle: angle
        });
      }
    }

    console.log(`Detected ${nailPositions.length} nail positions`);
    return nailPositions;
  } catch (error) {
    console.error("Hand detection error:", error);
    return fallbackNailDetection(imageUrl);
  }
}

// Process image with MediaPipe Hands
async function processWithMediaPipe(imageData: ImageData, width: number, height: number) {
  return new Promise((resolve, reject) => {
    if (!handsModule) {
      reject(new Error("MediaPipe Hands not initialized"));
      return;
    }
    
    handsModule.onResults((results: any) => {
      resolve(results);
    });
    
    try {
      handsModule.send({ image: imageData });
    } catch (error) {
      console.error("Error processing with MediaPipe:", error);
      reject(error);
    }
  });
}

// Extract the design from the original image
export function extractNailDesign(designImageUrl: string): Promise<HTMLCanvasElement> {
  return new Promise(async (resolve, reject) => {
    try {
      // Load the design image
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolveImg, rejectImg) => {
        img.onload = resolveImg;
        img.onerror = rejectImg;
        img.src = designImageUrl;
      });
      
      // Create a canvas for the extracted design
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      
      // Draw the image to the canvas
      ctx.drawImage(img, 0, 0);
      
      // For a social media post image, we'll try to extract the most colorful
      // or central part as the nail design
      
      // Simple approach: take the center of the image
      // For a more sophisticated approach, you would use image processing to
      // detect the actual nail design within the image
      
      const designSize = Math.min(img.width, img.height) / 2;
      const centerX = img.width / 2;
      const centerY = img.height / 2;
      
      const designCanvas = document.createElement("canvas");
      designCanvas.width = designSize;
      designCanvas.height = designSize;
      const designCtx = designCanvas.getContext("2d");
      
      if (!designCtx) {
        reject(new Error("Could not create design canvas context"));
        return;
      }
      
      // Extract the center portion of the image
      designCtx.drawImage(
        img,
        centerX - designSize / 2,
        centerY - designSize / 2,
        designSize,
        designSize,
        0,
        0,
        designSize,
        designSize
      );
      
      resolve(designCanvas);
    } catch (error) {
      console.error("Error extracting nail design:", error);
      reject(error);
    }
  });
}

// Apply nail design to image with detected hands
export async function applyNailDesign(
  sourceImageUrl: string,
  designImageUrl: string
): Promise<string> {
  try {
    // First detect hands and nail positions
    const nailPositions = await detectHands(sourceImageUrl);
    
    // Extract the nail design from the original image
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

    // Draw the source image
    context.drawImage(sourceImage, 0, 0);

    // Apply the design to each detected nail
    if (nailPositions && nailPositions.length > 0) {
      for (const nail of nailPositions) {
        // Save the current context state
        context.save();
        
        // Translate to the center of the nail position
        context.translate(nail.x + nail.width / 2, nail.y + nail.height / 2);
        
        // Rotate to match the nail angle
        context.rotate(nail.angle * Math.PI / 180);
        
        // Draw the design centered on the nail position
        context.drawImage(
          designCanvas,
          -nail.width / 2,
          -nail.height / 2,
          nail.width,
          nail.height
        );
        
        // Restore the context state
        context.restore();
      }
    } else {
      // If no nails detected, use a fallback method
      console.log("No nail positions detected, using fallback placement");
      const centerX = canvas.width / 2 - 100;
      const centerY = canvas.height / 2 - 50;
      context.drawImage(designCanvas, centerX, centerY, 200, 100);
    }

    // Return the resulting image as data URL
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error applying nail design:", err);
    throw err;
  }
}

// Fallback nail detection using simple image processing
export async function fallbackNailDetection(imageUrl: string): Promise<NailPosition[]> {
  // This is a simplified fallback that estimates nail positions
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const width = img.width;
      const height = img.height;

      // Create estimated positions for 5 nails in a row at the bottom third of the image
      const nailPositions: NailPosition[] = [];
      const nailWidth = width / 12;
      const nailHeight = nailWidth * 1.5;
      const startX = width / 4;
      const y = (height * 2) / 3;

      for (let i = 0; i < 5; i++) {
        nailPositions.push({
          x: startX + i * nailWidth * 1.5,
          y: y,
          width: nailWidth,
          height: nailHeight,
          angle: 0 // Default angle (straight)
        });
      }

      resolve(nailPositions);
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

// Apply color filter to blend the design with the nail
function applyColorFilter(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  // Get the image data for the area
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;
  
  // Apply a slight color adjustment to make the design look more integrated
  for (let i = 0; i < data.length; i += 4) {
    // Skip transparent pixels
    if (data[i + 3] < 50) continue;
    
    // Add a slight shine/reflection effect
    data[i] = Math.min(255, data[i] * 1.05);     // R
    data[i + 1] = Math.min(255, data[i + 1] * 1.05); // G
    data[i + 2] = Math.min(255, data[i + 2] * 1.05); // B
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, x, y);
}

// Save an image to the device
export function saveImage(dataUrl: string, filename = "nail-design-try-on.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Share an image
export async function shareImage(dataUrl: string, title = "My Virtual Nail Design") {
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
