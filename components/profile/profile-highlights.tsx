"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const highlights = [
  { id: 1, title: "Florals", image: "/vibrant-floral-nails.png" },
  { id: 2, title: "Geometric", image: "/geometric-harmony.png" },
  { id: 3, title: "French", image: "/glitter-french-elegance.png" },
  { id: 4, title: "Abstract", image: "/abstract-pastel-swirls.png" },
]

export default function ProfileHighlights() {
  const [selectedHighlight, setSelectedHighlight] = useState<number | null>(null)

  return (
    <>
      <div className="py-4 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-2">
          <motion.div whileHover={{ y: -2 }} className="flex flex-col items-center flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-xs mt-1">New</span>
          </motion.div>

          {highlights.map((highlight) => (
            <motion.div
              key={highlight.id}
              whileHover={{ y: -2 }}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer"
              onClick={() => setSelectedHighlight(highlight.id)}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gray-200 overflow-hidden">
                <img
                  src={highlight.image || "/placeholder.svg"}
                  alt={highlight.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs mt-1">{highlight.title}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Highlight Viewer Modal */}
      {selectedHighlight && (
        <Dialog open={true} onOpenChange={() => setSelectedHighlight(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{highlights.find((h) => h.id === selectedHighlight)?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <img
                src={highlights.find((h) => h.id === selectedHighlight)?.image || "/placeholder.svg"}
                alt={highlights.find((h) => h.id === selectedHighlight)?.title}
                className="max-h-[60vh] object-contain rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
