import PostFeed from "@/components/post-feed";
import { Suspense } from "react";
import SampleDataNotice from "@/components/sample-data-notice";
import { Post } from "@/lib/post-data";

// Static data for testing
const staticPosts: Post[] = [
  {
    id: 1,
    documentId: "post1",
    username: "nailartist1",
    userImage: "/diverse-avatars.png",
    image: "/sample-nails-1.jpg",
    mediaItems: [
      {
        id: 1,
        type: "image",
        url: "/sample-nails-1.jpg",
      },
    ],
    contentType: "image",
    description: "Beautiful spring nails with floral design",
    likes: 120,
    comments: [
      {
        id: 1,
        username: "user1",
        text: "Love these!",
        likes: 5,
        reactions: {},
      },
    ],
    timestamp: "2024-03-15T10:00:00Z",
    tags: ["spring", "floral", "pink"],
  },
  {
    id: 2,
    documentId: "post2",
    username: "nailartist2",
    userImage: "/diverse-avatars.png",
    image: "/sample-nails-2.jpg",
    mediaItems: [
      {
        id: 2,
        type: "image",
        url: "/sample-nails-2.jpg",
      },
    ],
    contentType: "image",
    description: "Elegant French manicure with gold accents",
    likes: 95,
    comments: [
      {
        id: 2,
        username: "user2",
        text: "So classy!",
        likes: 3,
        reactions: {},
      },
    ],
    timestamp: "2024-03-14T15:30:00Z",
    tags: ["french", "gold", "elegant"],
  },
];

export default function PostFeedServer() {
  // Comment out data fetching for now
  // try {
  //   console.log("PostFeedServer: Fetching posts")
  //   const { posts, nextCursor, hasMore } = await getPosts(2, 0)
  //   console.log(`PostFeedServer: Fetched ${posts.length} posts`)
  //   const usingSampleData = process.env.USE_SAMPLE_DATA === "true"

  return (
    <Suspense fallback={<PostFeedSkeleton />}>
      <SampleDataNotice />
      <PostFeed
        initialPosts={staticPosts}
        initialNextCursor={null}
        initialHasMore={false}
      />
    </Suspense>
  );
  // } catch (error) {
  //   console.error("Error in PostFeedServer:", error)
  //   // ... error handling code ...
  // }
}

function PostFeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}
