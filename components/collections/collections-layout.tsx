"use client"

import type React from "react"

import { useState, createContext, useContext } from "react"
import type { Collection } from "@/types/collection"

interface CollectionsContextType {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
  isEditModalOpen: boolean
  setIsEditModalOpen: (open: boolean) => void
  selectedCollection: Collection | null
  setSelectedCollection: (collection: Collection | null) => void
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined)

export const useCollectionsContext = () => {
  const context = useContext(CollectionsContext)
  if (!context) {
    throw new Error("useCollectionsContext must be used within CollectionsLayout")
  }
  return context
}

interface CollectionsLayoutProps {
  children: React.ReactNode
}

export default function CollectionsLayout({ children }: CollectionsLayoutProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)

  // Load view mode preference from localStorage
  useState(() => {
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("collectionsViewMode")
      if (savedViewMode === "grid" || savedViewMode === "list") {
        setViewMode(savedViewMode)
      }
    }
  })

  // Save view mode preference to localStorage
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode)
    if (typeof window !== "undefined") {
      localStorage.setItem("collectionsViewMode", mode)
    }
  }

  const contextValue: CollectionsContextType = {
    viewMode,
    setViewMode: handleViewModeChange,
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedCollection,
    setSelectedCollection,
  }

  return <CollectionsContext.Provider value={contextValue}>{children}</CollectionsContext.Provider>
}
