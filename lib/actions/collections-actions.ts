"use server";

import { CollectionsService } from "@/lib/services/collections-service";
import { revalidatePath } from "next/cache";
import type {
  Collection,
  CollectionShare,
} from "@/context/collections-context";
import type {
  CreateCollectionData,
  UpdateCollectionData,
  CreateCollectionShareData,
} from "@/lib/services/collections-service";

export async function getUserCollectionsAction(): Promise<Collection[]> {
  try {
    return await CollectionsService.getUserCollections();
  } catch (error) {
    console.error("Error fetching user collections:", error);
    throw new Error("Failed to fetch collections");
  }
}

export async function getPublicCollectionsAction(): Promise<Collection[]> {
  try {
    return await CollectionsService.getPublicCollections();
  } catch (error) {
    console.error("Error fetching public collections:", error);
    throw new Error("Failed to fetch public collections");
  }
}

export async function getCollectionAction(
  documentId: string
): Promise<Collection> {
  try {
    return await CollectionsService.getCollection(documentId);
  } catch (error) {
    console.error("Error fetching collection:", error);
    throw new Error("Failed to fetch collection");
  }
}

export async function getPublicCollectionWithPostsAction(
  documentId: string
): Promise<Collection | null> {
  try {
    return await CollectionsService.getPublicCollectionWithPosts(documentId);
  } catch (error) {
    console.error("Error fetching public collection detail:", error);
    throw new Error("Failed to fetch public collection");
  }
}

export async function createCollectionAction(
  data: CreateCollectionData
): Promise<Collection> {
  try {
    const collection = await CollectionsService.createCollection(data);

    // Revalidate relevant paths
    revalidatePath("/me");
    revalidatePath("/collections");

    return collection;
  } catch (error) {
    console.error("Error creating collection:", error);
    throw new Error("Failed to create collection");
  }
}

export async function updateCollectionAction(
  documentId: string,
  data: UpdateCollectionData
): Promise<Collection> {
  try {
    const collection = await CollectionsService.updateCollection(
      documentId,
      data
    );

    // Revalidate relevant paths
    revalidatePath("/me");
    revalidatePath("/collections");
    revalidatePath(`/collections/${documentId}`);

    return collection;
  } catch (error) {
    console.error("Error updating collection:", error);
    throw new Error("Failed to update collection");
  }
}

export async function deleteCollectionAction(
  documentId: string
): Promise<void> {
  try {
    await CollectionsService.deleteCollection(documentId);

    // Revalidate relevant paths
    revalidatePath("/me");
    revalidatePath("/collections");
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw new Error("Failed to delete collection");
  }
}

export async function addPostToCollectionAction(
  collectionId: string,
  postId: number
): Promise<Collection> {
  try {
    const collection = await CollectionsService.addPostsToCollection(
      collectionId,
      [postId]
    );

    // Revalidate relevant paths
    revalidatePath("/me");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath(`/post/${postId}`);

    return collection;
  } catch (error) {
    console.error("Error adding post to collection:", error);
    throw new Error("Failed to add post to collection");
  }
}

export async function removePostFromCollectionAction(
  collectionId: string,
  postId: number
): Promise<Collection> {
  try {
    const collection = await CollectionsService.removePostsFromCollection(
      collectionId,
      [postId]
    );

    // Revalidate relevant paths
    revalidatePath("/me");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath(`/post/${postId}`);

    return collection;
  } catch (error) {
    console.error("Error removing post from collection:", error);
    throw new Error("Failed to remove post from collection");
  }
}

export async function getPostCollectionsAction(
  postId: string | number
): Promise<Collection[]> {
  try {
    return await CollectionsService.getPostCollections(postId);
  } catch (error) {
    console.error("Error fetching post collections:", error);
    throw new Error("Failed to fetch post collections");
  }
}

export async function shareCollectionAction(
  collectionId: string,
  shareData: CreateCollectionShareData
): Promise<CollectionShare> {
  try {
    const share = await CollectionsService.shareCollection(
      collectionId,
      shareData
    );

    // Revalidate relevant paths
    revalidatePath(`/collections/${collectionId}`);

    return share;
  } catch (error) {
    console.error("Error sharing collection:", error);
    throw new Error("Failed to share collection");
  }
}

export async function removeCollectionShareAction(
  shareId: string,
  collectionId: string
): Promise<void> {
  try {
    await CollectionsService.removeCollectionShare(shareId);

    // Revalidate relevant paths
    revalidatePath(`/collections/${collectionId}`);
  } catch (error) {
    console.error("Error removing collection share:", error);
    throw new Error("Failed to remove collection share");
  }
}

export async function updateSharePermissionAction(
  shareId: string,
  collectionId: string,
  permission: "view" | "edit"
): Promise<void> {
  try {
    await CollectionsService.updateSharePermission(shareId, permission);

    // Revalidate relevant paths
    revalidatePath(`/collections/${collectionId}`);
  } catch (error) {
    console.error("Error updating share permission:", error);
    throw new Error("Failed to update share permission");
  }
}

export async function generateShareLinkAction(
  collectionId: string
): Promise<string> {
  try {
    const shareLink = await CollectionsService.generateShareLink(collectionId);

    // Revalidate relevant paths
    revalidatePath(`/collections/${collectionId}`);

    return shareLink;
  } catch (error) {
    console.error("Error generating share link:", error);
    throw new Error("Failed to generate share link");
  }
}

export async function getSharedCollectionAction(
  documentId: string,
  token: string
): Promise<Collection> {
  try {
    return await CollectionsService.getSharedCollection(documentId, token);
  } catch (error) {
    console.error("Error fetching shared collection:", error);
    throw new Error("Failed to fetch shared collection");
  }
}
