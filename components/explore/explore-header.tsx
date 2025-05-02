"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ExploreHeader() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  return (
    <div className="sticky top-0 z-40 bg-gray-50 pt-4 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="mr-2 md:hidden"
              >
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSearchFocused(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="md:max-w-md w-full relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search nail art designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="pl-9 pr-4 h-9 bg-gray-100 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        <AnimatePresence>
          {!isSearchFocused && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:block">
              <h1 className="text-xl font-bold hidden md:block">Explore</h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
        {categories.map((category) => (
          <CategoryButton key={category.id} category={category} />
        ))}
      </div>
    </div>
  )
}

interface CategoryProps {
  category: {
    id: string
    name: string
    active?: boolean
  }
}

function CategoryButton({ category }: CategoryProps) {
  const [isActive, setIsActive] = useState(category.active || false)

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={`rounded-full text-xs whitespace-nowrap ${
        isActive
          ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          : "bg-white text-gray-700"
      }`}
      onClick={() => setIsActive(!isActive)}
    >
      {category.name}
    </Button>
  )
}

const categories = [
  { id: "all", name: "All", active: true },
  { id: "trending", name: "Trending" },
  { id: "french", name: "French Manicure" },
  { id: "gel", name: "Gel Nails" },
  { id: "acrylic", name: "Acrylic" },
  { id: "abstract", name: "Abstract" },
  { id: "minimalist", name: "Minimalist" },
  { id: "floral", name: "Floral" },
  { id: "geometric", name: "Geometric" },
  { id: "glitter", name: "Glitter" },
  { id: "ombre", name: "Ombre" },
  { id: "seasonal", name: "Seasonal" },
]
