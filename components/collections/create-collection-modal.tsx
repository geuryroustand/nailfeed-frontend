'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { useCollections } from '@/context/collections-context'
import { Plus, Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

export function CreateCollectionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'private' | 'unlisted' | 'public'
  })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)

  const { createCollection } = useCollections()
  const { toast } = useToast()

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'Error',
          description: 'Image size must be less than 5MB',
          variant: 'destructive',
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select an image file',
          variant: 'destructive',
        })
        return
      }

      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setCoverImage(null)
    setCoverImagePreview(null)
  }

  // Function to upload image to Strapi
  const uploadImage = async (file: File): Promise<number> => {
    const formData = new FormData()
    formData.append('files', file)

    // Use the auth-proxy upload endpoint for authenticated upload
    const response = await fetch('/api/auth-proxy/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Image upload error:', response.status, errorText)
      throw new Error(`Failed to upload image: ${response.status}`)
    }

    const result = await response.json()
    return result[0]?.id // Return the uploaded file ID
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Collection name is required',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      let coverImageId: number | undefined

      // Upload cover image if provided
      if (coverImage) {
        coverImageId = await uploadImage(coverImage)
      }

      // Create collection using the new format
      const collectionData = {
        name: formData.name,
        description: formData.description || undefined,
        visibility: formData.visibility,
        coverImage: coverImageId,
      }

      await createCollection(
        collectionData.name,
        collectionData.description,
        formData.visibility === 'private',
        coverImageId,
      )

      toast({
        title: 'Success',
        description: 'Collection created successfully!',
      })

      // Reset form
      setFormData({ name: '', description: '', visibility: 'private' })
      setCoverImage(null)
      setCoverImagePreview(null)
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating collection:', error)
      toast({
        title: 'Error',
        description: 'Failed to create collection. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="cover-image">Cover Image (Optional)</Label>
            {coverImagePreview ? (
              <div className="relative">
                <Image
                  src={coverImagePreview}
                  alt="Cover preview"
                  width={300}
                  height={200}
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label
                      htmlFor="cover-image"
                      className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      <Upload className="h-4 w-4" />
                      Upload cover image
                    </Label>
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Collection Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter collection name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your collection..."
              rows={3}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <RadioGroup
              value={formData.visibility}
              onValueChange={(value: 'private' | 'unlisted' | 'public') =>
                setFormData(prev => ({ ...prev, visibility: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal">
                  Private - Only you can see this collection
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unlisted" id="unlisted" />
                <Label htmlFor="unlisted" className="font-normal">
                  Unlisted - Anyone with the link can see it
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal">
                  Public - Anyone can discover and see it
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Collection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
