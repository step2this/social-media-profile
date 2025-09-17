import React, { useState, useEffect } from 'react';
import { Post, FeedItem } from '@/types/profile';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Heart, MessageCircle, Share, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/api';

interface PostCardProps {
  post: Post | FeedItem;
  onClick?: () => void;
  onLike?: (postId: string) => Promise<void>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  currentUserId?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onClick,
  onLike,
  onComment,
  onShare,
  currentUserId
}) => {
  // Handle both Post and FeedItem types
  const authorId = 'userId' in post ? post.userId : post.authorId;
  const authorUsername = 'username' in post ? post.username : post.authorUsername;
  const authorDisplayName = 'displayName' in post ? post.displayName : post.authorDisplayName;
  const authorAvatar = 'avatar' in post ? post.avatar : post.authorAvatar;
  const postId = post.postId;

  // Local state for interactions
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [likeStatusLoaded, setLikeStatusLoaded] = useState(false);

  // Check like status on component mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUserId || !postId || likeStatusLoaded) return;

      try {
        const status = await apiService.checkLikeStatus(currentUserId, postId);
        setIsLiked(status.isLiked);
        setLikesCount(status.likesCount);
        setLikeStatusLoaded(true);
      } catch (error) {
        console.error('Failed to check like status:', error);
        // Use the post's like count as fallback
        setLikesCount(post.likesCount);
        setLikeStatusLoaded(true);
      }
    };

    checkLikeStatus();
  }, [currentUserId, postId, post.likesCount, likeStatusLoaded]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Interactive handlers
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    try {
      let result;
      if (isLiked) {
        result = await apiService.unlikePost(currentUserId, postId);
        setIsLiked(false);
      } else {
        result = await apiService.likePost(currentUserId, postId);
        setIsLiked(true);
      }

      setLikesCount(result.likesCount);

      // Call the optional onLike callback for backward compatibility
      if (onLike) {
        await onLike(postId);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert optimistic update on error
      setIsLiked(!isLiked);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(postId);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(postId);
  };

  return (
    <Card className="w-full cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {authorAvatar ? (
              <>
                {avatarLoading && (
                  <div className="absolute inset-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <img
                  src={authorAvatar}
                  alt={`${authorDisplayName}'s avatar`}
                  className={cn(
                    "w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-primary/20 transition-colors",
                    avatarLoading && "opacity-0"
                  )}
                  onLoad={() => setAvatarLoading(false)}
                  onError={() => setAvatarLoading(false)}
                />
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <User className="w-5 h-5 text-primary/70" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground hover:underline cursor-pointer truncate">
                {authorDisplayName}
              </span>
              <span className="text-muted-foreground text-sm truncate">
                @{authorUsername}
              </span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-muted-foreground text-sm hover:text-foreground transition-colors cursor-pointer">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </div>

          {post.imageUrl && (
            <div className="relative rounded-xl overflow-hidden bg-muted">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                src={post.imageUrl}
                alt="Post image"
                className={cn(
                  "w-full max-h-96 object-cover transition-opacity duration-300 hover:scale-105 transition-transform cursor-pointer",
                  imageLoading && "opacity-0"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open image in modal
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-red-50 hover:text-red-600",
                  isLiked && "text-red-600 bg-red-50"
                )}
                onClick={handleLike}
                disabled={isLiking}
                aria-label={isLiked ? `Unlike post` : `Like post`}
              >
                {isLiking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={cn(
                    "w-4 h-4 transition-all duration-200 group-hover:scale-110",
                    isLiked && "fill-current"
                  )} />
                )}
                <span className="text-sm font-medium min-w-[1rem]">
                  {likesCount}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                onClick={handleComment}
                aria-label={`Comment on post (${post.commentsCount} comments)`}
              >
                <MessageCircle className="w-4 h-4 transition-all duration-200 group-hover:scale-110" />
                <span className="text-sm font-medium min-w-[1rem]">
                  {post.commentsCount}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-green-50 hover:text-green-600"
                onClick={handleShare}
                aria-label="Share post"
              >
                <Share className="w-4 h-4 transition-all duration-200 group-hover:scale-110" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};