import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { PostCard } from '@/components/PostCard';
import { UserSwitcher } from '@/components/UserSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FeedItem, CreatePostRequest } from '@/types/profile';
import { apiService } from '@/services/api';
import { Loader2, Home, PenSquare, RefreshCw, ImagePlus, X } from 'lucide-react';

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const fetchFeed = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await apiService.getUserFeed(currentUser.userId);
      setFeedItems(result.feedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFeed();
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div>Please select a user</div>;
  }

  const currentUserId = currentUser.userId;

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    setIsCreatingPost(true);
    setError('');

    try {
      let imageUrl: string | undefined;

      // Upload image if one is selected
      if (selectedImage) {
        try {
          imageUrl = await apiService.uploadImage(selectedImage, currentUser.userId);
        } catch (err) {
          setError('Failed to upload image. Please try again.');
          setIsCreatingPost(false);
          return;
        }
      }

      // Create post data
      const postData: CreatePostRequest = {
        content: newPostContent.trim(),
        imageUrl,
      };

      // Create post via API
      await apiService.createPost(currentUser.userId, postData);

      setNewPostContent('');
      removeImage(); // Clear image after posting

      // Refresh feed after creating post
      await fetchFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handlePostClick = (post: FeedItem) => {
    // Navigate to the author's profile
    navigate(`/profile/${post.authorId}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="w-6 h-6" />
            Feed
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={fetchFeed} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              Home
            </Button>
            <Button onClick={() => navigate('/discover')} variant="outline" size="sm">
              Discover
            </Button>
            <UserSwitcher />
          </div>
        </div>

        {/* Create Post */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PenSquare className="w-5 h-5" />
              What's on your mind?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={280}
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Post preview"
                  className="max-w-full h-48 object-cover rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {newPostContent.length}/280 characters
                </span>

                {/* Image Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="image-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    type="button"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Add Image
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || isCreatingPost}
              >
                {isCreatingPost ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PenSquare className="w-4 h-4 mr-2" />
                )}
                {isCreatingPost ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        {/* Feed Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading your feed...
            </div>
          </div>
        ) : feedItems.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <div className="space-y-4">
                <Home className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your feed is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Follow some users to see their posts here, or create your first post!
                  </p>
                  <Button onClick={() => navigate('/')} variant="outline">
                    Discover Profiles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => (
              <PostCard
                key={`${item.postId}-${item.createdAt}`}
                post={item}
                onClick={() => handlePostClick(item)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};