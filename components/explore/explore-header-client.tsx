"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useDebouncedCallback } from "use-debounce"

interface Category {
  id: string
  name: string
  count?: number
}

interface ExploreHeaderClientProps {
  initialQuery: string
  initialCategory: string
  categories: Category[]
}

export default function ExploreHeaderClient({ initialQuery, initialCategory, categories }: ExploreHeaderClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Debounced search to avoid too many requests
  const debouncedSearch = useDebouncedCallback((query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }
    params.delete("page") // Reset to first page on search

    startTransition(() => {
      router.push(`/explore?${params.toString()}`)
    })
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId !== "all") {
      params.set("category", categoryId)
    } else {
      params.delete("category")
    }
    params.delete("page") // Reset to first page on category change

    startTransition(() => {
      router.push(`/explore?${params.toString()}`)
    })
  }

  return (
    <>
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
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="pl-9 pr-4 h-9 bg-gray-100 border-gray-200 focus:bg-white"
              disabled={isPending}
            />
            {isPending && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
              </div>
            )}
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
          <CategoryButton
            key={category.id}
            category={category}
            isActive={activeCategory === category.id}
            onClick={() => handleCategoryChange(category.id)}
            disabled={isPending}
          />
        ))}
      </div>
    </>
  )
}

interface CategoryButtonProps {
  category: Category
  isActive: boolean
  onClick: () => void
  disabled: boolean
}

function CategoryButton({ category, isActive, onClick, disabled }: CategoryButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={`rounded-full text-xs whitespace-nowrap ${
        isActive
          ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          : "bg-white text-gray-700"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {category.name}
      {category.count && (
        <span className="ml-1 text-xs opacity-75">
          {category.count > 999 ? `${Math.floor(category.count / 1000)}k` : category.count}
        </span>
      )}
    </Button>
  )
}
