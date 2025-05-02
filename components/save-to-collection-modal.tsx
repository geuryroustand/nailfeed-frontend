"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Collection, useCollections } from "@/context/collections-context"
import { Plus, Lock, Check, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SaveToCollectionModalProps {
  postId: number
  onClose: () => void
  postImage: string
}

export default function SaveToCollectionModal({ postId, onClose, postImage }: SaveToCollectionModalProps) {
  const { collections, saveToCollection, createCollection, isSaved } = useCollections()
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing")
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // New collection form state
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionDescription, setNewCollectionDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)

  const handleSaveToCollection = async () => {
    if (!selectedCollectionId) return

    setIsLoading(true)
    try {
      await saveToCollection(postId, selectedCollectionId)
      onClose()
    } catch (error) {
      console.error("Error saving to collection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAndSave = async () => {
    if (!newCollectionName.trim()) return

    setIsLoading(true)
    try {
      const newCollection = await createCollection(
        newCollectionName.trim(),
        newCollectionDescription.trim() || undefined,
        isPrivate,
      )
      await saveToCollection(postId, newCollection.id)
      onClose()
    } catch (error) {
      console.error("Error creating collection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to collection</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" value={activeTab} onValueChange={(v) => setActiveTab(v as "existing" | "new")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="existing">Existing</TabsTrigger>
            <TabsTrigger value="new">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
              {collections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">You don't have any collections yet</p>
                  <Button variant="outline" onClick={() => setActiveTab("new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first collection
                  </Button>
                </div>
              ) : (
                collections.map((collection) => (
                  <CollectionItem
                    key={collection.id}
                    collection={collection}
                    isSelected={selectedCollectionId === collection.id}
                    onSelect={() => setSelectedCollectionId(collection.id)}
                    containsPost={collection.postIds.includes(postId)}
                  />
                ))
              )}
            </div>

            <Button
              onClick={handleSaveToCollection}
              disabled={!selectedCollectionId || isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={postImage || "/placeholder.svg"}
                  alt="Post thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Inspiration"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this collection about?"
                    rows={2}
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
                <Label htmlFor="private" className="flex items-center cursor-pointer">
                  <Lock className="h-4 w-4 mr-1" />
                  Private collection
                </Label>
              </div>
            </div>

            <Button
              onClick={handleCreateAndSave}
              disabled={!newCollectionName.trim() || isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create & Save"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

interface CollectionItemProps {
  collection: Collection
  isSelected: boolean
  onSelect: () => void
  containsPost: boolean
}

function CollectionItem({ collection, isSelected, onSelect, containsPost }: CollectionItemProps) {
  return (
    <motion.div
      whileHover={{ scale: 0.98 }}
      className={`flex items-center p-2 rounded-lg cursor-pointer border ${
        isSelected ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:bg-gray-50"
      }`}
      onClick={onSelect}
    >
      <div className="w-12 h-12 rounded-md overflow-hidden mr-3 flex-shrink-0">
        {collection.coverImage ? (
          <img
            src={collection.coverImage || "/placeholder.svg"}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <p className="font-medium text-sm truncate">{collection.name}</p>
          {collection.isPrivate && <Lock className="h-3 w-3 ml-1 text-gray-400" />}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {collection.postIds.length} {collection.postIds.length === 1 ? "item" : "items"}
        </p>
      </div>

      <AnimatePresence>
        {containsPost && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center"
          >
            <Check className="h-4 w-4 text-white" />
          </motion.div>
        )}
        {!containsPost && isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full border-2 border-pink-500"
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
