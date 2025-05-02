"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export type Story = {
  id: number
  username: string
  image: string
  title: string
}

interface FeaturedStoriesClientProps {
  stories: Story[]
}

export function FeaturedStoriesClient({ stories }: FeaturedStoriesClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)

  const handleScroll = () => {
    if (scrollRef.current) {
      const position = scrollRef.current.scrollLeft
      const max = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
      setScrollPosition(position)
      setMaxScroll(max)
    }
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold">Featured Designs</h2>
      </div>

      <div className="relative">
        {/* Navigation buttons */}
        <Button
          variant="secondary"
          size="icon"
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md ${
            scrollPosition <= 10 ? "opacity-0" : "opacity-100"
          } transition-opacity`}
          onClick={scrollLeft}
          disabled={scrollPosition <= 10}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md ${
            scrollPosition >= maxScroll - 10 ? "opacity-0" : "opacity-100"
          } transition-opacity`}
          onClick={scrollRight}
          disabled={scrollPosition >= maxScroll - 10}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Stories container */}
        <div ref={scrollRef} className="flex overflow-x-auto py-4 px-4 scrollbar-hide" onScroll={handleScroll}>
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 mr-4 first:ml-0 last:mr-0 w-60 md:w-72"
            >
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                <div className="relative h-40 md:h-48">
                  <img
                    src={story.image || "/placeholder.svg"}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-3 text-white">
                      <p className="font-medium">{story.title}</p>
                      <p className="text-sm opacity-80">by {story.username}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center py-2">
          <div className="h-1 bg-gray-200 rounded-full w-16 relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-pink-500 rounded-full"
              style={{
                width: maxScroll > 0 ? `${(scrollPosition / maxScroll) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
