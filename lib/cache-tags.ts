export const CACHE_TAGS = {
  posts: "posts",
  post: (id: string | number) => `post-${id}`,
  userPosts: (userId: string | number) => `user-posts-${userId}`,
};
