import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/FollowButton';
import { PostCard } from '@/components/PostCard';
import { UserSwitcher } from '@/components/UserSwitcher';
import { Home, RefreshCw, User, Users, MessageSquare, Loader2 } from 'lucide-react';
import { Post } from '@/types/profile';
import { apiService } from '@/services/api';

export const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, availableUsers } = useUser();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDiscoveryContent();
  }, [availableUsers]);

  const loadDiscoveryContent = async () => {
    setIsLoading(true);
    try {
      // Load posts from all available users
      const allUserPosts: Post[] = [];

      for (const user of availableUsers) {
        try {
          const userPosts = await apiService.getUserPosts(user.userId);
          if (userPosts.posts) {
            allUserPosts.push(...userPosts.posts);
          }
        } catch (error) {
          console.error(`Failed to load posts for user ${user.userId}:`, error);
          // Continue loading other users' posts even if one fails
        }
      }

      // Sort posts by creation date (newest first)
      const sortedPosts = allUserPosts.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAllPosts(sortedPosts);
    } catch (error) {
      console.error('Failed to load discovery content:', error);
      setAllPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    // This is now handled by PostCard internally using the real API
    console.log('Like handled by PostCard for post:', postId);
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
    // Could open a comment modal or navigate to post detail
  };

  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
    // Could open share options
  };

  const handlePostClick = (post: Post) => {
    // Navigate to the author's profile
    navigate(`/profile/${post.userId}`);
  };

  const handleFollowChange = () => {
    // Refresh discovery content when follow status changes
    loadDiscoveryContent();
  };

  if (!currentUser) {
    return <div>Please select a user</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Discover
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadDiscoveryContent}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <UserSwitcher />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">People you might know</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableUsers
                .filter(user => user.userId !== currentUser.userId)
                .map((user) => (
                  <div key={user.userId} className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                      <User className="w-6 h-6 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground hover:underline cursor-pointer"
                              onClick={() => navigate(`/profile/${user.userId}`)}>
                          {user.displayName}
                        </span>
                        <span className="text-muted-foreground text-sm">@{user.username}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{user.bio}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{user.followersCount} followers</span>
                        <span>{user.postsCount} posts</span>
                      </div>
                    </div>
                    <FollowButton
                      currentUserId={currentUser.userId}
                      targetUserId={user.userId}
                      onFollowChange={handleFollowChange}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading posts...
                </div>
              </div>
            ) : allPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No posts found. Generate some test data to see posts here!</p>
              </div>
            ) : (
              allPosts.map((post) => (
                <PostCard
                  key={post.postId}
                  post={post}
                  onClick={() => handlePostClick(post)}
                  onComment={handleComment}
                  onShare={handleShare}
                  currentUserId={currentUser.userId}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};