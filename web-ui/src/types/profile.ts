export interface Profile {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProfileRequest {
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPrivate?: boolean;
}

export interface ApiError {
  error: string;
}

export interface FollowRelationship {
  PK: string; // USER#${followerId}
  SK: string; // FOLLOWS#${followedUserId}
  followerId: string;
  followedUserId: string;
  createdAt: string;
}

export interface Post {
  PK: string; // POST#${postId}
  SK: string; // METADATA
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedItem {
  PK: string; // FEED#${userId}
  SK: string; // POST#${timestamp}#${postId}
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
}