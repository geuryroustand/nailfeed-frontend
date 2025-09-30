'use client';

import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { savePostAction, checkIfPostIsSaved } from '@/lib/actions/saved-post-actions';
import { useState, useTransition, useOptimistic, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface SavePostButtonProps {
  postId: number;
  postDocumentId?: string;
  userSaved?: boolean; // New prop from backend
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  ariaLabel?: string;
  onSaveStateChange?: (postId: number, isSaved: boolean) => void; // Callback to update parent
}

export default function SavePostButton({
  postId,
  postDocumentId,
  userSaved = false,
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  ariaLabel,
  onSaveStateChange
}: SavePostButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [optimisticIsSaved, setOptimisticIsSaved] = useOptimistic(
    userSaved,
    (currentIsSaved, newIsSaved: boolean) => newIsSaved
  );

  // Sync optimistic state when userSaved prop changes (from server updates)
  useEffect(() => {
    if (userSaved !== optimisticIsSaved) {
      setOptimisticIsSaved(userSaved);
    }
  }, [userSaved, postId]);

  const handleSavePost = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save posts');
      return;
    }

    startTransition(async () => {
      // Optimistically update UI
      setOptimisticIsSaved(!optimisticIsSaved);

      try {
        const result = await savePostAction(postId, postDocumentId);

        if (result.success) {
          // Call the callback to update parent component
          if (onSaveStateChange) {
            onSaveStateChange(postId, result.isSaved || false);
          }

          toast.success(
            result.isSaved ? 'Post saved successfully' : 'Post unsaved successfully'
          );
        } else {
          // Revert optimistic update on error
          setOptimisticIsSaved(optimisticIsSaved);
          toast.error(result.error || 'Failed to save post');
        }
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticIsSaved(optimisticIsSaved);
        toast.error('Something went wrong');
      }
    });
  };

  const buttonLabel = optimisticIsSaved ? 'Unsave post' : 'Save post';
  const finalAriaLabel = ariaLabel || buttonLabel;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSavePost}
      disabled={isPending}
      className={cn(
        'transition-all duration-200',
        optimisticIsSaved && variant === 'ghost' && 'text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100',
        !optimisticIsSaved && variant === 'ghost' && 'text-gray-500 hover:text-gray-700',
        isPending && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={finalAriaLabel}
      title={buttonLabel}
      aria-pressed={optimisticIsSaved}
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-all duration-200',
          optimisticIsSaved ? 'fill-current text-pink-600' : 'fill-none text-current',
          size === 'sm' && 'h-3 w-3',
          size === 'lg' && 'h-5 w-5'
        )}
        aria-hidden="true"
      />

      {showLabel && (
        <span className={cn(
          'ml-2 transition-colors duration-200',
          optimisticIsSaved ? 'text-pink-600' : 'text-current'
        )}>
          {optimisticIsSaved ? 'Saved' : 'Save'}
        </span>
      )}

      {/* Screen reader only text for status */}
      <span className="sr-only">
        {optimisticIsSaved ? 'This post is saved. Click to unsave.' : 'This post is not saved. Click to save.'}
      </span>
    </Button>
  );
}

// Hook for checking save status on mount
export function useSaveStatus(postId: number, postDocumentId?: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await checkIfPostIsSaved(postId, postDocumentId);
        setIsSaved(result.isSaved);
      } catch (error) {
        console.error('Error checking save status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [postId, postDocumentId]);

  return { isSaved, isLoading };
}
