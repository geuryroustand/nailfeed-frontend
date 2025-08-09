"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, X } from "lucide-react"
import type { MediaItem } from "@/types/media"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface MediaReorderProps {
  items: MediaItem[]
  onReorder: (newOrder: MediaItem[]) => void
  onRemove: (id: string) => void
}

interface SortableItemProps {
  id: string
  item: MediaItem
  index: number
  onRemove: (id: string) => void
}

const SortableItem = ({ id, item, index, onRemove }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center bg-gray-50 rounded-md p-2">
      <div {...attributes} {...listeners} className="mr-2 cursor-grab">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-12 w-12 rounded overflow-hidden mr-3">
        {item.type === "image" ? (
          <img src={item.url || "/placeholder.svg"} alt="Media thumbnail" className="h-full w-full object-cover" />
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
  )
}

export default function MediaReorder({ items, onReorder, onRemove }: MediaReorderProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(items)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = mediaItems.findIndex((item) => item.id === active.id)
    const newIndex = mediaItems.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(mediaItems, oldIndex, newIndex)
    setMediaItems(newItems)
    onReorder(newItems)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={mediaItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {mediaItems.map((item, index) => (
            <SortableItem key={item.id} id={item.id} item={item} index={index} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
