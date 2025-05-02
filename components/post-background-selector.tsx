"use client"

import { useState } from "react"
import { Check } from "lucide-react"

export type BackgroundType = {
  id: string
  type: "color" | "gradient" | "pattern"
  value: string
  thumbnail?: string
  animation?: string
}

interface PostBackgroundSelectorProps {
  onSelect: (background: BackgroundType | null) => void
  selectedBackground: BackgroundType | null
}

export default function PostBackgroundSelector({ onSelect, selectedBackground }: PostBackgroundSelectorProps) {
  const [showAll, setShowAll] = useState(false)
  const [showAnimations, setShowAnimations] = useState(false)

  const backgrounds: BackgroundType[] = [
    { id: "none", type: "color", value: "transparent" },
    { id: "pink", type: "color", value: "bg-pink-500" },
    { id: "purple", type: "color", value: "bg-purple-500" },
    { id: "blue", type: "color", value: "bg-blue-500" },
    { id: "green", type: "color", value: "bg-green-500" },
    { id: "yellow", type: "color", value: "bg-yellow-500" },
    { id: "red", type: "color", value: "bg-red-500" },
    {
      id: "pink-purple",
      type: "gradient",
      value: "bg-gradient-to-r from-pink-500 to-purple-500",
      animation: "animate-gradient-shift",
    },
    {
      id: "blue-purple",
      type: "gradient",
      value: "bg-gradient-to-r from-blue-500 to-purple-500",
      animation: "animate-gradient-shift",
    },
    {
      id: "green-blue",
      type: "gradient",
      value: "bg-gradient-to-r from-green-500 to-blue-500",
      animation: "animate-gradient-shift",
    },
    {
      id: "yellow-orange",
      type: "gradient",
      value: "bg-gradient-to-r from-yellow-400 to-orange-500",
      animation: "animate-gradient-shift",
    },
    {
      id: "red-pink",
      type: "gradient",
      value: "bg-gradient-to-r from-red-500 to-pink-500",
      animation: "animate-gradient-shift",
    },
    {
      id: "nail-pattern",
      type: "pattern",
      value: "bg-nail-pattern pattern-overlay",
      thumbnail: "/nail-pattern-bg.png",
      animation: "animate-float",
    },
    {
      id: "abstract-swirls",
      type: "pattern",
      value: "bg-abstract-swirls pattern-overlay",
      thumbnail: "/abstract-pastel-swirls.png",
      animation: "animate-subtle-rotate",
    },
    {
      id: "gold-flakes",
      type: "pattern",
      value: "bg-gold-flakes animate-sparkle",
      thumbnail: "/shimmering-gold-flakes.png",
    },
  ]

  const displayBackgrounds = showAll ? backgrounds : backgrounds.slice(0, 8)

  const toggleAnimation = (bg: BackgroundType) => {
    if (!bg.animation) return bg

    // If the background already has this animation, remove it
    if (selectedBackground?.id === bg.id && selectedBackground?.animation === bg.animation) {
      return { ...bg, animation: undefined }
    }

    // Otherwise, add the animation
    return bg
  }

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Background</h3>
        {selectedBackground && selectedBackground.animation && (
          <button
            onClick={() => onSelect({ ...selectedBackground, animation: undefined })}
            className="text-xs text-blue-500"
          >
            Turn off animation
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {displayBackgrounds.map((bg) => (
          <button
            key={bg.id}
            onClick={() => onSelect(bg.id === "none" ? null : toggleAnimation(bg))}
            className={`relative w-8 h-8 rounded-full overflow-hidden border-2 ${
              selectedBackground?.id === bg.id || (bg.id === "none" && !selectedBackground)
                ? "border-blue-500"
                : "border-transparent"
            }`}
          >
            {bg.id === "none" ? (
              <div className="w-full h-full bg-white flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-gray-500"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
              </div>
            ) : bg.type === "pattern" && bg.thumbnail ? (
              <div className={`w-full h-full ${bg.animation || ""}`}>
                <img src={bg.thumbnail || "/placeholder.svg"} alt={bg.id} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-full h-full ${bg.value} ${bg.animation || ""}`}></div>
            )}

            {(selectedBackground?.id === bg.id || (bg.id === "none" && !selectedBackground)) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}

            {bg.animation && bg.id !== "none" && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        {backgrounds.length > 8 && (
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-blue-500 font-medium">
            {showAll ? "Show less" : "See more backgrounds"}
          </button>
        )}

        {selectedBackground && (
          <button
            onClick={() => {
              // Toggle animation for the selected background
              if (selectedBackground.animation) {
                onSelect({ ...selectedBackground, animation: undefined })
              } else {
                // Add default animation based on type
                let animation = "animate-pulse-bg"
                if (selectedBackground.type === "gradient") {
                  animation = "animate-gradient-shift"
                } else if (selectedBackground.type === "pattern") {
                  animation = "animate-float"
                }
                onSelect({ ...selectedBackground, animation })
              }
            }}
            className="text-xs text-blue-500 font-medium"
          >
            {selectedBackground.animation ? "Static background" : "Animate background"}
          </button>
        )}
      </div>
    </div>
  )
}
