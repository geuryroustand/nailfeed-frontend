"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-media-query"

// Filter categories and options
const colorOptions = [
  { id: "red", label: "Red", color: "#e11d48" },
  { id: "pink", label: "Pink", color: "#ec4899" },
  { id: "purple", label: "Purple", color: "#a855f7" },
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "green", label: "Green", color: "#22c55e" },
  { id: "yellow", label: "Yellow", color: "#eab308" },
  { id: "orange", label: "Orange", color: "#f97316" },
  { id: "brown", label: "Brown", color: "#92400e" },
  { id: "black", label: "Black", color: "#171717" },
  { id: "white", label: "White", color: "#f8fafc" },
  { id: "gold", label: "Gold", color: "#fbbf24" },
  { id: "silver", label: "Silver", color: "#94a3b8" },
]

const styleOptions = [
  { id: "acrylic", label: "Acrylic" },
  { id: "gel", label: "Gel" },
  { id: "natural", label: "Natural" },
  { id: "dip-powder", label: "Dip Powder" },
  { id: "press-on", label: "Press-On" },
  { id: "polygel", label: "Polygel" },
  { id: "shellac", label: "Shellac" },
]

const eventOptions = [
  { id: "wedding", label: "Wedding" },
  { id: "party", label: "Party" },
  { id: "casual", label: "Casual" },
  { id: "formal", label: "Formal" },
  { id: "holiday", label: "Holiday" },
  { id: "seasonal", label: "Seasonal" },
  { id: "graduation", label: "Graduation" },
]

const shapeOptions = [
  { id: "square", label: "Square" },
  { id: "round", label: "Round" },
  { id: "almond", label: "Almond" },
  { id: "stiletto", label: "Stiletto" },
  { id: "coffin", label: "Coffin" },
  { id: "oval", label: "Oval" },
  { id: "ballerina", label: "Ballerina" },
]

export interface SearchFilters {
  query: string
  colors: string[]
  styles: string[]
  events: string[]
  shapes: string[]
  location?: {
    enabled: boolean
    distance: number
    coordinates?: {
      latitude: number
      longitude: number
    }
    address?: string
  }
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
  className?: string
}

export default function AdvancedSearch({ onSearch, initialFilters, className = "" }: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(
    initialFilters || {
      query: "",
      colors: [],
      styles: [],
      events: [],
      shapes: [],
      location: {
        enabled: false,
        distance: 25,
      },
    },
  )
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Calculate active filter count
  useEffect(() => {
    const count =
      filters.colors.length +
      filters.styles.length +
      filters.events.length +
      filters.shapes.length +
      (filters.location?.enabled ? 1 : 0)
    setActiveFilterCount(count)
  }, [filters])

  const handleSearch = () => {
    onSearch(filters)
  }

  const toggleFilter = (category: keyof SearchFilters, value: string) => {
    setFilters((prev) => {
      const array = prev[category] as string[]
      return {
        ...prev,
        [category]: array.includes(value) ? array.filter((item) => item !== value) : [...array, value],
      }
    })
  }

  const clearFilters = () => {
    setFilters({
      query: filters.query,
      colors: [],
      styles: [],
      events: [],
      shapes: [],
      location: {
        enabled: false,
        distance: 25,
      },
    })
  }

  const handleLocationToggle = (enabled: boolean) => {
    if (enabled && !filters.location?.coordinates) {
      // Get user's location
      setLocationStatus("loading")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters((prev) => ({
            ...prev,
            location: {
              ...prev.location!,
              enabled: true,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            },
          }))
          setLocationStatus("success")
          // Reverse geocode to get address (simplified for demo)
          setTimeout(() => {
            setFilters((prev) => ({
              ...prev,
              location: {
                ...prev.location!,
                address: "Current location",
              },
            }))
          }, 500)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationStatus("error")
          setFilters((prev) => ({
            ...prev,
            location: {
              ...prev.location!,
              enabled: false,
            },
          }))
        },
      )
    } else {
      setFilters((prev) => ({
        ...prev,
        location: {
          ...prev.location!,
          enabled,
        },
      }))
    }
  }

  const renderFilterBadges = () => {
    const allBadges = [
      ...filters.colors.map((id) => ({
        id,
        label: colorOptions.find((c) => c.id === id)?.label || id,
        category: "colors" as keyof SearchFilters,
      })),
      ...filters.styles.map((id) => ({
        id,
        label: styleOptions.find((s) => s.id === id)?.label || id,
        category: "styles" as keyof SearchFilters,
      })),
      ...filters.events.map((id) => ({
        id,
        label: eventOptions.find((e) => e.id === id)?.label || id,
        category: "events" as keyof SearchFilters,
      })),
      ...filters.shapes.map((id) => ({
        id,
        label: shapeOptions.find((s) => s.id === id)?.label || id,
        category: "shapes" as keyof SearchFilters,
      })),
    ]

    if (filters.location?.enabled) {
      allBadges.push({
        id: "location",
        label: filters.location.address || "Near me",
        category: "location" as keyof SearchFilters,
      })
    }

    return allBadges.map((badge) => (
      <Badge key={`${badge.category}-${badge.id}`} variant="secondary" className="m-1 flex items-center gap-1">
        {badge.label}
        <button
          onClick={() => {
            if (badge.category === "location") {
              handleLocationToggle(false)
            } else {
              toggleFilter(badge.category, badge.id)
            }
          }}
          className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    ))
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search nail art..."
              className="pl-9 pr-4 h-10 bg-gray-100 border-gray-200"
              value={filters.query}
              onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={activeFilterCount > 0 ? "relative bg-gray-100" : ""}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-pink-500 text-[10px] text-white flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap items-center mb-3">
                    <div className="flex flex-wrap">{renderFilterBadges()}</div>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                      Clear all
                    </Button>
                  </div>
                )}

                {isMobile ? (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="colors">
                      <AccordionTrigger className="py-2">Colors</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 py-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => toggleFilter("colors", color.id)}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                filters.colors.includes(color.id) ? "border-pink-500" : "border-transparent"
                              }`}
                              title={color.label}
                            >
                              <span className="w-6 h-6 rounded-full" style={{ backgroundColor: color.color }}></span>
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="styles">
                      <AccordionTrigger className="py-2">Styles</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 py-2">
                          {styleOptions.map((style) => (
                            <div
                              key={style.id}
                              className="flex items-center"
                              onClick={() => toggleFilter("styles", style.id)}
                            >
                              <div
                                className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                  filters.styles.includes(style.id) ? "bg-pink-500 border-pink-500" : "border-gray-300"
                                }`}
                              >
                                {filters.styles.includes(style.id) && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3 h-3 text-white"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm">{style.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="events">
                      <AccordionTrigger className="py-2">Events</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 py-2">
                          {eventOptions.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center"
                              onClick={() => toggleFilter("events", event.id)}
                            >
                              <div
                                className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                  filters.events.includes(event.id) ? "bg-pink-500 border-pink-500" : "border-gray-300"
                                }`}
                              >
                                {filters.events.includes(event.id) && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3 h-3 text-white"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm">{event.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="shapes">
                      <AccordionTrigger className="py-2">Nail Shapes</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 py-2">
                          {shapeOptions.map((shape) => (
                            <div
                              key={shape.id}
                              className="flex items-center"
                              onClick={() => toggleFilter("shapes", shape.id)}
                            >
                              <div
                                className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                  filters.shapes.includes(shape.id) ? "bg-pink-500 border-pink-500" : "border-gray-300"
                                }`}
                              >
                                {filters.shapes.includes(shape.id) && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3 h-3 text-white"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm">{shape.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="location">
                      <AccordionTrigger className="py-2">Location</AccordionTrigger>
                      <AccordionContent>
                        <div className="py-2 space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="location-toggle" className="cursor-pointer">
                              Enable location-based search
                            </Label>
                            <Switch
                              id="location-toggle"
                              checked={filters.location?.enabled || false}
                              onCheckedChange={handleLocationToggle}
                            />
                          </div>

                          {locationStatus === "loading" && (
                            <div className="text-sm text-gray-500">Detecting your location...</div>
                          )}

                          {locationStatus === "error" && (
                            <div className="text-sm text-red-500">
                              Unable to detect location. Please check your browser permissions.
                            </div>
                          )}

                          {filters.location?.enabled && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Distance</Label>
                                <span className="text-sm font-medium">{filters.location.distance} miles</span>
                              </div>
                              <Slider
                                value={[filters.location.distance]}
                                min={1}
                                max={100}
                                step={1}
                                onValueChange={(value) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    location: {
                                      ...prev.location!,
                                      distance: value[0],
                                    },
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="grid grid-cols-5 gap-6">
                    <div className="space-y-2">
                      <h3 className="font-medium">Colors</h3>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => toggleFilter("colors", color.id)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              filters.colors.includes(color.id) ? "border-pink-500" : "border-transparent"
                            }`}
                            title={color.label}
                          >
                            <span className="w-6 h-6 rounded-full" style={{ backgroundColor: color.color }}></span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Styles</h3>
                      <div className="space-y-2">
                        {styleOptions.map((style) => (
                          <div
                            key={style.id}
                            className="flex items-center cursor-pointer"
                            onClick={() => toggleFilter("styles", style.id)}
                          >
                            <div
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                filters.styles.includes(style.id) ? "bg-pink-500 border-pink-500" : "border-gray-300"
                              }`}
                            >
                              {filters.styles.includes(style.id) && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-3 h-3 text-white"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{style.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Events</h3>
                      <div className="space-y-2">
                        {eventOptions.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center cursor-pointer"
                            onClick={() => toggleFilter("events", event.id)}
                          >
                            <div
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                filters.events.includes(event.id) ? "bg-pink-500 border-pink-500" : "border-gray-300"
                              }`}
                            >
                              {filters.events.includes(event.id) && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-3 h-3 text-white"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{event.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Nail Shapes</h3>
                      <div className="space-y-2">
                        {shapeOptions.map((shape) => (
                          <div
                            key={shape.id}
                            className="flex items-center cursor-pointer"
                            onClick={() => toggleFilter("shapes", shape.id)}
                          >
                            <div
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                filters.shapes.includes(shape.id) ? "bg-pink-500 border-pink-500" : "border-gray-300"
                              }`}
                            >
                              {filters.shapes.includes(shape.id) && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-3 h-3 text-white"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{shape.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Location</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="location-toggle-desktop" className="cursor-pointer">
                            Enable location-based search
                          </Label>
                          <Switch
                            id="location-toggle-desktop"
                            checked={filters.location?.enabled || false}
                            onCheckedChange={handleLocationToggle}
                          />
                        </div>

                        {locationStatus === "loading" && (
                          <div className="text-sm text-gray-500">Detecting your location...</div>
                        )}

                        {locationStatus === "error" && (
                          <div className="text-sm text-red-500">
                            Unable to detect location. Please check your browser permissions.
                          </div>
                        )}

                        {filters.location?.enabled && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Distance</Label>
                              <span className="text-sm font-medium">{filters.location.distance} miles</span>
                            </div>
                            <Slider
                              value={[filters.location.distance]}
                              min={1}
                              max={100}
                              step={1}
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  location: {
                                    ...prev.location!,
                                    distance: value[0],
                                  },
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
