'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Grid, Columns, Bookmark, Heart, MessageCircle, Share2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useCollections, type Collection } from '@/context/collections-context'
import { useToast } from '@/hooks/use-toast'

interface SharedCollectionClientProps {
  collection: Collection
}

export default function SharedCollectionClient({ collection }: SharedCollectionClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')
  const { user, isAuthenticated } = useAuth()
  const { createCollection } = useCollections()
  const { toast } = useToast()

  const handleSaveCollection = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save collections',
        variant: 'destructive',
      })
      return
    }

    try {
      await createCollection(
        `${collection.name} (Copy)`,
        collection.description,
        true // Make it private by default
      )

      toast({
        title: 'Collection saved',
        description: 'The collection has been saved to your account',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save collection. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      {/* Shared collection banner */}
      <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Shared Collection</h2>
            <p className="text-sm text-gray-600">
              This collection was shared publicly
            </p>
          </div>
          {isAuthenticated && (
            <Button onClick={handleSaveCollection} variant="outline" className="flex items-center">
              <Bookmark className="h-4 w-4 mr-2" />
              Save to my collections
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {collection.postIds.length} {collection.postIds.length === 1 ? 'item' : 'items'}
        </p>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${
              viewMode === 'grid' ? 'bg-white text-pink-500 shadow-sm' : ''
            }`}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${
              viewMode === 'masonry' ? 'bg-white text-pink-500 shadow-sm' : ''
            }`}
            onClick={() => setViewMode('masonry')}
          >
            <Columns className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {collection.postIds.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Bookmark className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No items in this collection</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">This collection is empty</p>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Grid className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Collection content</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Post content display would be implemented here with the actual post data fetching
          </p>
        </div>
      )}
    </>
  )
}
