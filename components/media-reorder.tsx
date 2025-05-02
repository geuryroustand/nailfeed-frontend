"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { GripVertical, X } from "lucide-react"
import type { MediaItem } from "@/types/media"

interface MediaReorderProps {
  items: MediaItem[]
  onReorder: (newOrder: MediaItem[]) => void
  onRemove: (id: string) => void
}

export default function MediaReorder({ items, onReorder, onRemove }: MediaReorderProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(items)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const newItems = Array.from(mediaItems)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    setMediaItems(newItems)
    onReorder(newItems)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="media-items">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
            {mediaItems.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex items-center bg-gray-50 rounded-md p-2"
                  >
                    <div {...provided.dragHandleProps} className="mr-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="h-12 w-12 rounded overflow-hidden mr-3">
                      {item.type === "image" ? (
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt="Media thumbnail"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-sm truncate">
                      {item.type === "image" ? "Image" : "Video"} {index + 1}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      onClick={() => onRemove(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
