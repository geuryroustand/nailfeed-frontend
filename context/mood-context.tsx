"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

export interface MoodColor {
  color: string
  percentage: number
}

export interface MoodDesign {
  id: number
  image: string
  colors: string[]
  username: string
  likes: number
}

export interface Mood {
  id: string
  name: string
  image: string
  colors: MoodColor[]
  createdAt: string
  designs: MoodDesign[]
  isPublic: boolean
  shareLink?: string
}

interface MoodContextType {
  moods: Mood[]
  currentMood: Mood | null
  setCurrentMood: (mood: Mood | null) => void
  saveMood: (name: string, isPublic: boolean) => Promise<Mood>
  deleteMood: (id: string) => Promise<void>
  getMoodById: (id: string) => Mood | undefined
  updateMood: (id: string, data: Partial<Mood>) => Promise<Mood>
  getShareLink: (id: string) => Promise<string>
  extractColorsFromImage: (imageUrl: string) => Promise<MoodColor[]>
  getRecommendedDesigns: (colors: MoodColor[]) => Promise<MoodDesign[]>
}

const MoodContext = createContext<MoodContextType | undefined>(undefined)

// Sample nail designs with color tags
const sampleDesigns: MoodDesign[] = [
  {
    id: 1,
    image: "/glitter-french-elegance.png",
    colors: ["white", "gold", "beige"],
    username: "nailartist",
    likes: 234,
  },
  {
    id: 2,
    image: "/geometric-harmony.png",
    colors: ["black", "white", "gold"],
    username: "trendynails",
    likes: 187,
  },
  {
    id: 3,
    image: "/vibrant-floral-nails.png",
    colors: ["pink", "green", "white", "yellow"],
    username: "artsynails",
    likes: 312,
  },
  {
    id: 4,
    image: "/abstract-pastel-swirls.png",
    colors: ["blue", "pink", "purple", "white"],
    username: "nailpro",
    likes: 156,
  },
  {
    id: 5,
    image: "/vibrant-abstract-nails.png",
    colors: ["red", "orange", "yellow", "blue"],
    username: "nailpro",
    likes: 278,
  },
  {
    id: 6,
    image: "/shimmering-gold-flakes.png",
    colors: ["gold", "black", "beige"],
    username: "luxurynails",
    likes: 423,
  },
  {
    id: 7,
    image: "/intricate-floral-nails.png",
    colors: ["pink", "green", "white"],
    username: "detailednails",
    likes: 198,
  },
  {
    id: 8,
    image: "/subtle-nude-nails.png",
    colors: ["beige", "nude", "white", "gold"],
    username: "minimalistnails",
    likes: 145,
  },
  {
    id: 9,
    image: "/blue-ombre-nails.png",
    colors: ["blue", "white", "teal"],
    username: "ombrenails",
    likes: 267,
  },
  {
    id: 10,
    image: "/delicate-daisies.png",
    colors: ["white", "yellow", "green"],
    username: "3dnailart",
    likes: 389,
  },
  {
    id: 11,
    image: "/gold-veined-marble-nails.png",
    colors: ["white", "gold", "gray"],
    username: "marblenails",
    likes: 211,
  },
  {
    id: 12,
    image: "/electric-angles.png",
    colors: ["neon", "pink", "green", "yellow", "blue"],
    username: "neonnails",
    likes: 176,
  },
]

// Color name mapping for common colors
const colorNameMap: Record<string, string[]> = {
  red: ["#FF0000", "#FF5252", "#FF1744", "#D50000", "#C62828", "#B71C1C"],
  pink: ["#FF4081", "#EC407A", "#E91E63", "#D81B60", "#C2185B", "#AD1457"],
  purple: ["#9C27B0", "#8E24AA", "#7B1FA2", "#6A1B9A", "#4A148C", "#7E57C2"],
  blue: ["#2196F3", "#1E88E5", "#1976D2", "#1565C0", "#0D47A1", "#42A5F5"],
  teal: ["#009688", "#00897B", "#00796B", "#00695C", "#004D40", "#26A69A"],
  green: ["#4CAF50", "#43A047", "#388E3C", "#2E7D32", "#1B5E20", "#66BB6A"],
  yellow: ["#FFEB3B", "#FDD835", "#FBC02D", "#F9A825", "#F57F17", "#FFEE58"],
  orange: ["#FF9800", "#FB8C00", "#F57C00", "#EF6C00", "#E65100", "#FFA726"],
  brown: ["#795548", "#6D4C41", "#5D4037", "#4E342E", "#3E2723", "#8D6E63"],
  gray: ["#9E9E9E", "#757575", "#616161", "#424242", "#212121", "#BDBDBD"],
  black: ["#000000", "#212121", "#424242", "#616161"],
  white: ["#FFFFFF", "#FAFAFA", "#F5F5F5", "#EEEEEE"],
  beige: ["#F5F5DC", "#E8E4C9", "#D8C9A3", "#C8B88A"],
  nude: ["#E6BEAE", "#D8AA8E", "#C69076", "#B67860"],
  gold: ["#FFD700", "#FFC107", "#FFB300", "#FFA000"],
  silver: ["#C0C0C0", "#BDBDBD", "#9E9E9E", "#757575"],
  neon: ["#39FF14", "#FF10F0", "#FE019A", "#04D9FF", "#FFFC00"],
}

export function MoodProvider({ children }: { children: ReactNode }) {
  const [moods, setMoods] = useState<Mood[]>([])
  const [currentMood, setCurrentMood] = useState<Mood | null>(null)
  const { toast } = useToast()

  // Load moods from localStorage on mount
  useEffect(() => {
    const storedMoods = localStorage.getItem("moods")
    if (storedMoods) {
      setMoods(JSON.parse(storedMoods))
    }
  }, [])

  // Save moods to localStorage whenever they change
  useEffect(() => {
    if (moods.length > 0) {
      localStorage.setItem("moods", JSON.stringify(moods))
    }
  }, [moods])

  // Extract dominant colors from an image
  const extractColorsFromImage = async (imageUrl: string): Promise<MoodColor[]> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageUrl

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve([])
          return
        }

        // Set canvas size to image size
        canvas.width = img.width
        canvas.height = img.height

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, img.width, img.height)

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Sample pixels (for performance, don't analyze every pixel)
        const sampleSize = 10 // Sample every 10th pixel
        const colorCounts: Record<string, number> = {}
        const totalPixels = Math.floor(data.length / 4 / sampleSize)

        for (let i = 0; i < data.length; i += 4 * sampleSize) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Convert to hex
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`

          if (colorCounts[hex]) {
            colorCounts[hex]++
          } else {
            colorCounts[hex] = 1
          }
        }

        // Sort colors by frequency
        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10) // Get top 10 colors

        // Calculate percentages
        const colors: MoodColor[] = sortedColors.map(([color, count]) => ({
          color,
          percentage: Math.round((count / totalPixels) * 100),
        }))

        // Merge similar colors and get top 5
        const mergedColors = mergeAndMapColors(colors)
        resolve(mergedColors.slice(0, 5))
      }

      img.onerror = () => {
        resolve([])
      }
    })
  }

  // Helper function to merge similar colors and map to color names
  const mergeAndMapColors = (colors: MoodColor[]): MoodColor[] => {
    // Group similar colors
    const colorGroups: Record<string, MoodColor[]> = {}

    colors.forEach((colorObj) => {
      // Find the closest named color
      let closestColor = "other"
      let minDistance = Number.MAX_VALUE

      Object.entries(colorNameMap).forEach(([name, hexCodes]) => {
        hexCodes.forEach((hex) => {
          const distance = getColorDistance(colorObj.color, hex)
          if (distance < minDistance) {
            minDistance = distance
            closestColor = name
          }
        })
      })

      if (!colorGroups[closestColor]) {
        colorGroups[closestColor] = []
      }
      colorGroups[closestColor].push(colorObj)
    })

    // Merge colors in each group
    const mergedColors: MoodColor[] = Object.entries(colorGroups).map(([name, colorObjs]) => {
      const totalPercentage = colorObjs.reduce((sum, obj) => sum + obj.percentage, 0)
      // Use the most frequent color's hex value as the representative
      const representativeColor = colorObjs.sort((a, b) => b.percentage - a.percentage)[0].color

      return {
        color: representativeColor,
        percentage: totalPercentage,
        name, // Add the color name
      } as MoodColor & { name: string }
    })

    // Sort by percentage
    return mergedColors.sort((a, b) => b.percentage - a.percentage)
  }

  // Calculate color distance (simple Euclidean distance in RGB space)
  const getColorDistance = (hex1: string, hex2: string): number => {
    const r1 = Number.parseInt(hex1.substring(1, 3), 16)
    const g1 = Number.parseInt(hex1.substring(3, 5), 16)
    const b1 = Number.parseInt(hex1.substring(5, 7), 16)

    const r2 = Number.parseInt(hex2.substring(1, 3), 16)
    const g2 = Number.parseInt(hex2.substring(3, 5), 16)
    const b2 = Number.parseInt(hex2.substring(5, 7), 16)

    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2))
  }

  // Get recommended designs based on extracted colors
  const getRecommendedDesigns = async (colors: MoodColor[]): Promise<MoodDesign[]> => {
    // Extract color names from the colors
    const colorNames = colors
      .filter((c) => (c as any).name) // Filter colors that have names
      .map((c) => (c as any).name as string) // Extract the name

    // If no color names, return empty array
    if (colorNames.length === 0) {
      return []
    }

    // Filter designs that match at least one of the colors
    const matchingDesigns = sampleDesigns.filter((design) => {
      return design.colors.some((color) => colorNames.includes(color))
    })

    // Sort designs by how many colors they match
    matchingDesigns.sort((a, b) => {
      const aMatches = a.colors.filter((color) => colorNames.includes(color)).length
      const bMatches = b.colors.filter((color) => colorNames.includes(color)).length
      return bMatches - aMatches
    })

    return matchingDesigns
  }

  const saveMood = async (name: string, isPublic: boolean): Promise<Mood> => {
    if (!currentMood) {
      throw new Error("No current mood to save")
    }

    const newMood: Mood = {
      ...currentMood,
      id: Date.now().toString(),
      name,
      isPublic,
      createdAt: new Date().toISOString(),
    }

    setMoods((prev) => [...prev, newMood])

    toast({
      title: "Mood saved",
      description: `"${name}" has been saved to your moods.`,
    })

    return newMood
  }

  const deleteMood = async (id: string): Promise<void> => {
    const mood = moods.find((m) => m.id === id)
    if (!mood) {
      throw new Error("Mood not found")
    }

    setMoods((prev) => prev.filter((m) => m.id !== id))

    toast({
      title: "Mood deleted",
      description: `"${mood.name}" has been deleted.`,
    })
  }

  const getMoodById = (id: string): Mood | undefined => {
    return moods.find((m) => m.id === id)
  }

  const updateMood = async (id: string, data: Partial<Mood>): Promise<Mood> => {
    const moodIndex = moods.findIndex((m) => m.id === id)
    if (moodIndex === -1) {
      throw new Error("Mood not found")
    }

    const updatedMood = {
      ...moods[moodIndex],
      ...data,
    }

    const newMoods = [...moods]
    newMoods[moodIndex] = updatedMood
    setMoods(newMoods)

    toast({
      title: "Mood updated",
      description: `"${updatedMood.name}" has been updated.`,
    })

    return updatedMood
  }

  const getShareLink = async (id: string): Promise<string> => {
    const mood = moods.find((m) => m.id === id)
    if (!mood) {
      throw new Error("Mood not found")
    }

    if (!mood.isPublic) {
      await updateMood(id, { isPublic: true })
    }

    // Generate a share link if it doesn't exist
    if (!mood.shareLink) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const shareLink = `${baseUrl}/shared/mood/${id}`

      await updateMood(id, { shareLink })

      return shareLink
    }

    return mood.shareLink
  }

  return (
    <MoodContext.Provider
      value={{
        moods,
        currentMood,
        setCurrentMood,
        saveMood,
        deleteMood,
        getMoodById,
        updateMood,
        getShareLink,
        extractColorsFromImage,
        getRecommendedDesigns,
      }}
    >
      {children}
    </MoodContext.Provider>
  )
}

export function useMood() {
  const context = useContext(MoodContext)
  if (context === undefined) {
    throw new Error("useMood must be used within a MoodProvider")
  }
  return context
}
