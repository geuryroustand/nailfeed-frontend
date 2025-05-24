"use client"

import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PostFeedHeaderProps {
  viewMode: "cards" | "compact"
  onViewModeChange: (mode: "cards" | "compact") => void
}

export default function PostFeedHeader({ viewMode, onViewModeChange }: PostFeedHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
      <h2 className="text-lg font-semibold">Your Feed</h2>

      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Most Recent</DropdownMenuItem>
            <DropdownMenuItem>Most Popular</DropdownMenuItem>
            <DropdownMenuItem>Following Only</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tabs defaultValue={viewMode} className="hidden sm:block">
          <TabsList className="h-8">
            <TabsTrigger value="cards" onClick={() => onViewModeChange("cards")} className="h-7 px-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </TabsTrigger>
            <TabsTrigger value="compact" onClick={() => onViewModeChange("compact")} className="h-7 px-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
