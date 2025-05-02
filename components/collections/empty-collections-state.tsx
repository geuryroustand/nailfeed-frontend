"use client"

import { Button } from "@/components/ui/button"
import { FolderPlus } from "lucide-react"

interface EmptyCollectionsStateProps {
  onCreateClick: () => void
}

export default function EmptyCollectionsState({ onCreateClick }: EmptyCollectionsStateProps) {
  return (
    <div className="text-center py-16 border-2 border-dashed rounded-lg">
      <FolderPlus className="h-12 w-12 mx-auto text-gray-400" />
      <h3 className="mt-4 text-lg font-medium">No collections yet</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
        Create your first collection to organize and save your favorite nail designs.
      </p>
      <Button onClick={onCreateClick} className="mt-4">
        <FolderPlus className="h-4 w-4 mr-2" />
        Create Collection
      </Button>
    </div>
  )
}
