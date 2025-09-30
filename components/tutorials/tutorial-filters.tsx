"use client"

import { useCallback } from "react"
import { useQueryState, parseAsString } from "nuqs"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TutorialLevel, TutorialTechnique, TutorialDuration } from "@/types/tutorial"
import { getTechniqueLabel, getLevelLabel } from "@/lib/tutorial-helpers"

const LEVELS: TutorialLevel[] = ["beginner", "intermediate", "advanced"]
const TECHNIQUES: TutorialTechnique[] = [
  "acrylic",
  "gel",
  "stamping",
  "hand-painted",
  "ombre",
  "3d",
  "french",
  "marble",
  "chrome",
  "other",
]
const DURATIONS: { value: TutorialDuration; label: string }[] = [
  { value: "short", label: "Under 15 min" },
  { value: "medium", label: "15-30 min" },
  { value: "long", label: "30+ min" },
]

export default function TutorialFilters() {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""))
  const [level, setLevel] = useQueryState("level", parseAsString.withDefault("all"))
  const [technique, setTechnique] = useQueryState("technique", parseAsString.withDefault("all"))
  const [duration, setDuration] = useQueryState("duration", parseAsString.withDefault("any"))

  const hasActiveFilters = query || level !== "all" || technique !== "all" || duration !== "any"

  const clearFilters = useCallback(() => {
    setQuery("")
    setLevel("all")
    setTechnique("all")
    setDuration("any")
  }, [setQuery, setLevel, setTechnique, setDuration])

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filter Tutorials</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            Clear all
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search-tutorials">Search</Label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="search-tutorials"
            type="search"
            placeholder="Search tutorials..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Level Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-level">Level</Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger id="filter-level" aria-label="Filter by level">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {LEVELS.map((lvl) => (
              <SelectItem key={lvl} value={lvl}>
                {getLevelLabel(lvl)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Technique Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-technique">Technique</Label>
        <Select value={technique} onValueChange={setTechnique}>
          <SelectTrigger id="filter-technique" aria-label="Filter by technique">
            <SelectValue placeholder="All techniques" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All techniques</SelectItem>
            {TECHNIQUES.map((tech) => (
              <SelectItem key={tech} value={tech}>
                {getTechniqueLabel(tech)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-duration">Duration</Label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger id="filter-duration" aria-label="Filter by duration">
            <SelectValue placeholder="Any duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any duration</SelectItem>
            {DURATIONS.map((dur) => (
              <SelectItem key={dur.value} value={dur.value}>
                {dur.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
