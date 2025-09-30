'use server';

import { revalidateTag } from 'next/cache';
import { createStrapiClient, getCurrentUserDocumentId } from '@/lib/auth/strapi-client';
import qs from 'qs';

export interface SavePostActionResult {
  success: boolean;
  error?: string;
  isSaved?: boolean;
}

export async function savePostAction(postId: number, postDocumentId?: string): Promise<SavePostActionResult> {
  try {
    const strapiClient = await createStrapiClient();
    const currentUserDocumentId = await getCurrentUserDocumentId();

    if (!currentUserDocumentId) {
      throw new Error('User not authenticated');
    }

    // Build query to check if post is already saved by current user
    const postFilter = postDocumentId
      ? { documentId: { $eq: postDocumentId } }
      : { id: { $eq: postId } };

    const queryParams = qs.stringify({
      filters: {
        post: postFilter,
        user: {
          documentId: {
            $eq: currentUserDocumentId
          }
        }
      },
      populate: ['user', 'post']
    }, { encodeValuesOnly: true });

    // Check if post is already saved by current user
    const existingSave = await strapiClient.get(`/api/saved-posts?${queryParams}`);

    if (existingSave.data && existingSave.data.length > 0) {
      // Post is already saved, so unsave it
      const savedPostDocumentId = existingSave.data[0].documentId;
      await strapiClient.delete(`/api/saved-posts/${savedPostDocumentId}`);

      // Revalidate relevant caches
      revalidateTag('posts');
      revalidateTag(`post-${postId}`);
      revalidateTag('saved-posts');

      return {
        success: true,
        isSaved: false
      };
    } else {
      // Post is not saved, so save it using Strapi v5 connect method
      const postIdentifier = postDocumentId || postId.toString();

      const saveData = {
        data: {
          user: {
            connect: [currentUserDocumentId]
          },
          post: {
            connect: [postIdentifier]
          }
        }
      };

      await strapiClient.post('/api/saved-posts', saveData);

      // Revalidate relevant caches
      revalidateTag('posts');
      revalidateTag(`post-${postId}`);
      revalidateTag('saved-posts');

      return {
        success: true,
        isSaved: true
      };
    }
  } catch (error: any) {
    console.error('Error saving/unsaving post:', error);
    return {
      success: false,
      error: error.message || 'Failed to save/unsave post'
    };
  }
}

export async function checkIfPostIsSaved(postId: number, postDocumentId?: string): Promise<{ isSaved: boolean; error?: string }> {
  try {
    const strapiClient = await createStrapiClient();
    const currentUserDocumentId = await getCurrentUserDocumentId();

    if (!currentUserDocumentId) {
      return { isSaved: false };
    }

    // Build query to check if post is saved by current user
    const postFilter = postDocumentId
      ? { documentId: { $eq: postDocumentId } }
      : { id: { $eq: postId } };

    const queryParams = qs.stringify({
      filters: {
        post: postFilter,
        user: {
          documentId: {
            $eq: currentUserDocumentId
          }
        }
      }
    }, { encodeValuesOnly: true });

    const response = await strapiClient.get(`/api/saved-posts?${queryParams}`);

    return {
      isSaved: response.data && response.data.length > 0
    };
  } catch (error: any) {
    console.error('Error checking if post is saved:', error);
    return {
      isSaved: false,
      error: error.message || 'Failed to check save status'
    };
  }
}
