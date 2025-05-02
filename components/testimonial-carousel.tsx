"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "Sophia Chen",
    role: "Professional Nail Artist",
    avatar: "/testimonials/sophia-chen.png",
    content:
      "NailFeed has completely transformed my business. I've gained over 5,000 followers and receive booking requests daily. The community is so supportive!",
  },
  {
    id: 2,
    name: "Marcus Johnson",
    role: "Nail Art Enthusiast",
    avatar: "/testimonials/marcus-johnson.png",
    content:
      "I used to struggle finding inspiration for my nail designs. Now, I just open NailFeed and instantly find amazing ideas. It's become my daily go-to app!",
  },
  {
    id: 3,
    name: "Aisha Patel",
    role: "Salon Owner",
    avatar: "/testimonials/aisha-patel.png",
    content:
      "Our salon's social media presence has grown 300% since joining NailFeed. We showcase our work and clients love seeing their designs featured!",
  },
]

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
    }, 5000)

    return () => clearInterval(interval)
  }, [autoplay])

  const next = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
  }

  const prev = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
  }

  return (
    <div className="relative bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="absolute top-4 left-4 text-pink-500 opacity-20">
        <Quote className="h-12 w-12" />
      </div>

      <div className="p-6 md:p-8 min-h-[220px] flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-4">What Our Community Says</h3>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <p className="text-gray-600 italic relative z-10">{testimonials[current].content}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3 border-2 border-pink-100">
              <AvatarImage
                src={testimonials[current].avatar || `/placeholder.svg?height=40&width=40&query=person+portrait`}
                alt={testimonials[current].name}
              />
              <AvatarFallback>{testimonials[current].name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{testimonials[current].name}</p>
              <p className="text-xs text-gray-500">{testimonials[current].role}</p>
            </div>
          </div>

          <div className="flex space-x-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
