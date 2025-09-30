"use client"

import type { FormEvent, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Plus, FolderPlus, Check, Loader2, Search, X, ShieldCheck, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useCollections } from "@/context/collections-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AddToCollectionDialogProps {
  postId: string | number
  postTitle?: string
  trigger?: ReactNode
  triggerLabel?: string
  onCollectionAdded?: (collectionName: string) => void
  triggerClassName?: string
}

const EMPTY_STATE_MESSAGES = {
  heading: "You don't have any collections yet",
  body: "Create a collection to start organizing your favorite looks.",
} as const
type CollectionsContextExtras = ReturnType<typeof useCollections> & {
  refreshCollections?: () => Promise<void>
  isLoading?: boolean
}


export function AddToCollectionDialog({
  postId,
  postTitle,
  trigger,
  triggerLabel = "Add to collection",
  onCollectionAdded,
  triggerClassName,
}: AddToCollectionDialogProps) {
  const collectionsContext = useCollections() as CollectionsContextExtras
  const { collections, saveToCollection, createCollection } = collectionsContext
  const refreshCollections = collectionsContext.refreshCollections
  const { toast } = useToast()
  const normalizedPostId = useMemo(() => String(postId), [postId])

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionDescription, setNewCollectionDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const collectionsLoading = (collectionsContext.isLoading ?? false) || isRefreshing

  const dialogDescription = postTitle
    ? `Save "${postTitle}" to a collection or create a new one.`
    : "Choose where to save this inspiration. You can create a new collection on the fly."

  useEffect(() => {
    if (!open) {
      resetFormState()
      return
    }

    if (typeof refreshCollections === "function") {
      setIsRefreshing(true)
      refreshCollections()
        .catch((error) => {
          console.error("Failed to refresh collections:", error)
          toast({
            title: "Couldn't fetch collections",
            description: "Please try again in a moment.",
            variant: "destructive",
          })
        })
        .finally(() => setIsRefreshing(false))
    } else {
      setIsRefreshing(false)
    }
  }, [open, refreshCollections, toast])

  useEffect(() => {
    if (!collections || collections.length === 0) {
      setSelectedCollectionId(null)
      return
    }

    if (!selectedCollectionId) {
      setSelectedCollectionId(collections[0].id)
    }
  }, [collections, selectedCollectionId])

  const filteredCollections = useMemo(() => {
    if (!searchTerm.trim()) {
      return collections
    }

    const query = searchTerm.toLowerCase()
    return collections.filter((collection) =>
      collection.name.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query),
    )
  }, [collections, searchTerm])

  useEffect(() => {
    if (isCreateMode) return
    if (filteredCollections.length === 0) return

    const stillVisible = filteredCollections.some((collection) => collection.id === selectedCollectionId)
    if (!stillVisible) {
      setSelectedCollectionId(filteredCollections[0].id)
    }
  }, [filteredCollections, isCreateMode, selectedCollectionId])

  const selectedCollection = useMemo(() => {
    if (!selectedCollectionId) return null
    return collections.find((collection) => collection.id === selectedCollectionId) ?? null
  }, [collections, selectedCollectionId])

  const handleSubmit = async () => {
    if (!selectedCollectionId) {
      setFormError("Choose a collection first")
      return
    }

    if (!selectedCollection) {
      setFormError("We couldn't find that collection")
      return
    }

    if (selectedCollection.postIds.includes(normalizedPostId)) {
      setFormError("This post is already part of that collection")
      return
    }

    try {
      setIsSubmitting(true)
      setFormError(null)
      await saveToCollection(normalizedPostId, selectedCollectionId)
      onCollectionAdded?.(selectedCollection.name)
      setOpen(false)
      resetFormState()
    } catch (error) {
      console.error("Failed to add post to collection:", error)
      setFormError("We couldn't add this post. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newCollectionName.trim()) {
      setFormError("Give your collection a name")
      return
    }

    try {
      setIsSubmitting(true)
      setFormError(null)

      const newCollection = await createCollection(
        newCollectionName.trim(),
        newCollectionDescription.trim() || undefined,
        isPrivate,
      )

      if (newCollection) {
        setSelectedCollectionId(newCollection.id)
        setIsCreateMode(false)
        setNewCollectionName("")
        setNewCollectionDescription("")
      }
    } catch (error) {
      console.error("Failed to create collection:", error)
      setFormError("We couldn't create that collection. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetFormState = () => {
    setSearchTerm("")
    setSelectedCollectionId(collections[0]?.id ?? null)
    setIsCreateMode(false)
    setNewCollectionName("")
    setNewCollectionDescription("")
    setIsPrivate(true)
    setIsRefreshing(false)
    setFormError(null)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="ghost"
            className={cn("flex items-center gap-2", triggerClassName)}
          >
            <FolderPlus className="h-5 w-5" aria-hidden="true" />
            <span>{triggerLabel}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" aria-describedby="add-to-collection-description">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add to Collection</DialogTitle>
          <DialogDescription id="add-to-collection-description">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {formError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {formError}
            </div>
          )}

          {!isCreateMode && (
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search your collections"
                  className="pl-9"
                  aria-label="Search collections"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateMode(true)
                  setFormError(null)
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New collection
              </Button>
            </div>
          )}

          {isCreateMode ? (
            <form onSubmit={handleCreateCollection} className="space-y-4" aria-label="Create collection">
              <div className="space-y-2">
                <Label htmlFor="new-collection-name">Collection name</Label>
                <Input
                  id="new-collection-name"
                  value={newCollectionName}
                  onChange={(event) => setNewCollectionName(event.target.value)}
                  placeholder="Summer nail inspo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-collection-description">Description (optional)</Label>
                <Textarea
                  id="new-collection-description"
                  value={newCollectionDescription}
                  onChange={(event) => setNewCollectionDescription(event.target.value)}
                  placeholder="Short summary to remember this curation"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div className="flex items-start gap-3">
                  {isPrivate ? (
                    <Lock className="mt-0.5 h-5 w-5 text-gray-500" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-gray-500" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{isPrivate ? "Private collection" : "Visible to community"}</p>
                    <p className="text-sm text-gray-500">
                      {isPrivate
                        ? "Only you can see this collection."
                        : "People you share the link with can view it."}
                    </p>
                  </div>
                </div>
                <Switch
                  id="collection-privacy-toggle"
                  checked={!isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(!checked)}
                  aria-label={isPrivate ? "Make collection public" : "Make collection private"}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsCreateMode(false)
                    setFormError(null)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Create collection
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {collectionsLoading ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  Loading your collections...
                </div>
              ) : filteredCollections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                  <p className="font-medium text-gray-700">{EMPTY_STATE_MESSAGES.heading}</p>
                  <p className="mt-1 text-sm text-gray-500">{EMPTY_STATE_MESSAGES.body}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setIsCreateMode(true)
                      setFormError(null)
                    }}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create your first collection
                  </Button>
                </div>
              ) : (
                <RadioGroup
                  value={selectedCollectionId ?? undefined}
                  onValueChange={(value) => {
                    setSelectedCollectionId(value)
                    setFormError(null)
                  }}
                  className="space-y-3"
                >
                  <ScrollArea className="max-h-[260px] pr-2">
                    <div className="space-y-2">
                      {filteredCollections.map((collection) => {
                        const collectionContainsPost = collection.postIds.includes(normalizedPostId)
                        return (
                          <label
                            key={collection.id}
                            htmlFor={`collection-${collection.id}`}
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition",
                              selectedCollectionId === collection.id
                                ? "border-pink-400 bg-pink-50/70"
                                : "border-gray-200 hover:border-pink-200 hover:bg-pink-50/40",
                            )}
                          >
                            <div className="flex flex-1 items-start gap-3">
                              <RadioGroupItem id={`collection-${collection.id}`} value={collection.id} className="mt-1" />
                              <div>
                                <p className="font-medium text-gray-900">{collection.name}</p>
                                {collection.description && (
                                  <p className="text-sm text-gray-500">{collection.description}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                  {collection.postIds.length} item{collection.postIds.length === 1 ? "" : "s"}
                                </p>
                                {collectionContainsPost && (
                                  <p className="mt-1 flex items-center text-xs font-medium text-green-600">
                                    <Check className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                                    Already saved here
                                  </p>
                                )}
                              </div>
                            </div>
                            {selectedCollectionId === collection.id && (
                              <Check className="h-5 w-5 text-pink-500" aria-hidden="true" />
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </RadioGroup>
              )}
            </div>
          )}

          {!isCreateMode && filteredCollections.length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedCollectionId || collectionsLoading}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Save to collection
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddToCollectionDialog
