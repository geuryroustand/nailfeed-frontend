"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Grid, Plus, SearchIcon } from "lucide-react"
import { useCollectionsContext } from "./collections-layout"

export default function CollectionsHeaderClient() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, setIsCreateModalOpen } = useCollectionsContext()

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div className="relative w-full sm:w-64">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-none"\
          </Button>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>
    </div>
  )
}
