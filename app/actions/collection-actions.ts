'use client';

import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  addPostToCollectionAction,
  removePostFromCollectionAction,
  shareCollectionAction,
  removeCollectionShareAction,
  updateSharePermissionAction,
  generateShareLinkAction,
} from '@/lib/actions/collections-actions';
import type { Collection, CollectionShare } from '@/context/collections-context';
import type {
  CreateCollectionData,
  UpdateCollectionData,
  CreateCollectionShareData
} from '@/lib/services/collections-service';

export async function createCollection(data: CreateCollectionData): Promise<Collection> {
  return await createCollectionAction(data);
}

export async function updateCollection(
  documentId: string,
  data: UpdateCollectionData
): Promise<Collection> {
  return await updateCollectionAction(documentId, data);
}

export async function deleteCollection(documentId: string): Promise<void> {
  return await deleteCollectionAction(documentId);
}

export async function addPostToCollection(
  collectionId: string,
  postId: number
): Promise<Collection> {
  return await addPostToCollectionAction(collectionId, postId);
}

export async function removePostFromCollection(
  collectionId: string,
  postId: number
): Promise<Collection> {
  return await removePostFromCollectionAction(collectionId, postId);
}

export async function shareCollection(
  collectionId: string,
  shareData: CreateCollectionShareData
): Promise<CollectionShare> {
  return await shareCollectionAction(collectionId, shareData);
}

export async function removeCollectionShare(shareId: string, collectionId: string): Promise<void> {
  return await removeCollectionShareAction(shareId, collectionId);
}

export async function updateSharePermission(
  shareId: string,
  collectionId: string,
  permission: 'view' | 'edit'
): Promise<void> {
  return await updateSharePermissionAction(shareId, collectionId, permission);
}

export async function generateShareLink(collectionId: string): Promise<string> {
  return await generateShareLinkAction(collectionId);
}