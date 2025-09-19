import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PostCard } from '@/components/PostCard';
import { UserSwitcher } from '@/components/UserSwitcher';
import {
  Settings,
  Users,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Home,
  MessageSquare,
  User
} from 'lucide-react';
import { adminService } from '@/services/admin';
import { apiService } from '@/services/api';
import { FeedItem, CreateProfileRequest } from '@/types/profile';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUsers } = useUser();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testUserCount, setTestUserCount] = useState(5);
  const [testPostsPerUser, setTestPostsPerUser] = useState(3);
  const [profileForm, setProfileForm] = useState<CreateProfileRequest>({
    username: '',
    email: '',
    displayName: '',
    bio: '',
  });

  const loadFeed = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const result = await apiService.getUserFeed(currentUser.userId);
      setFeedItems(result.feedItems);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadFeed();
    }
  }, [currentUser]);

  const handleGenerateTestData = async () => {
    try {
      setActionLoading('generate');
      const result = await adminService.generateTestData(testUserCount, testPostsPerUser);

      // Handle both proper API response and fallback response
      if (result.summary && typeof result.summary.usersCreated === 'number') {
        if (result.summary.usersCreated > 0) {
          setMessage({
            type: 'success',
            text: `Created ${result.summary.usersCreated} users with ${result.summary.postsCreated} posts`
          });
        } else {
          setMessage({
            type: 'success',
            text: `Test data generation request completed successfully`
          });
        }
      } else {
        setMessage({
          type: 'success',
          text: `Test data generation completed successfully`
        });
      }

      await refreshUsers();
      if (currentUser) loadFeed();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to generate test data' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateProfile = async () => {
    if (!profileForm.username || !profileForm.email || !profileForm.displayName) {
      setMessage({ type: 'error', text: 'Username, email, and display name are required' });
      return;
    }

    try {
      setActionLoading('create');
      const newProfile = await apiService.createProfile(profileForm);
      setMessage({
        type: 'success',
        text: `Profile created: ${newProfile.displayName} (@${newProfile.username})`
      });

      setProfileForm({
        username: '',
        email: '',
        displayName: '',
        bio: '',
      });

      await refreshUsers();
      if (currentUser) loadFeed();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create profile' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanupAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL users and data? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading('cleanup');
      const result = await adminService.cleanupAll();
      setMessage({
        type: 'success',
        text: `Cleanup completed: ${result.deletedDynamoItems} database items and ${result.deletedS3Objects} files deleted`
      });
      await refreshUsers();
      setFeedItems([]);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to cleanup data' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostClick = (post: FeedItem) => {
    navigate(`/profile/${post.authorId}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <div className="w-80 bg-muted/20 border-r p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-md border text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}

          {/* User Switcher */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <UserSwitcher />
            </CardContent>
          </Card>

          {/* Test Data Generation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Generate Test Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="userCount" className="text-xs">Users</Label>
                  <Input
                    id="userCount"
                    type="number"
                    min="1"
                    max="20"
                    value={testUserCount}
                    onChange={(e) => setTestUserCount(parseInt(e.target.value) || 1)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="postsPerUser" className="text-xs">Posts/User</Label>
                  <Input
                    id="postsPerUser"
                    type="number"
                    min="1"
                    max="10"
                    value={testPostsPerUser}
                    onChange={(e) => setTestPostsPerUser(parseInt(e.target.value) || 1)}
                    className="h-8"
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateTestData}
                disabled={actionLoading === 'generate'}
                className="w-full h-8 text-xs"
                size="sm"
              >
                {actionLoading === 'generate' ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3 mr-2" />
                )}
                Generate Data
              </Button>
            </CardContent>
          </Card>

          {/* Create User Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Create User Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="username" className="text-xs">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="john_doe"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="displayName" className="text-xs">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="bio" className="text-xs">Bio (optional)</Label>
                <Input
                  id="bio"
                  type="text"
                  placeholder="A short bio..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="h-8"
                />
              </div>
              <Button
                onClick={handleCreateProfile}
                disabled={actionLoading === 'create'}
                className="w-full h-8 text-xs"
                size="sm"
              >
                {actionLoading === 'create' ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <User className="w-3 h-3 mr-2" />
                )}
                Create Profile
              </Button>
            </CardContent>
          </Card>

          {/* Cleanup */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Data Cleanup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCleanupAll}
                disabled={actionLoading === 'cleanup'}
                variant="destructive"
                className="w-full h-8 text-xs"
                size="sm"
              >
                {actionLoading === 'cleanup' ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-2" />
                )}
                Cleanup All
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-8 text-xs justify-start"
                size="sm"
                onClick={() => navigate('/discover')}
              >
                <Users className="w-3 h-3 mr-2" />
                Discover
              </Button>
              <Button
                variant="outline"
                className="w-full h-8 text-xs justify-start"
                size="sm"
                onClick={() => navigate('/feed')}
              >
                <Home className="w-3 h-3 mr-2" />
                Feed
              </Button>
              <Button
                variant="outline"
                className="w-full h-8 text-xs justify-start"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <Settings className="w-3 h-3 mr-2" />
                Full Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - Social Feed */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Social Feed</h1>
            </div>
            <Button
              onClick={loadFeed}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {!currentUser ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No User Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate test users or switch to an existing user to see their feed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                Loading your feed...
              </div>
            </div>
          ) : feedItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Your feed is empty</h3>
                    <p className="text-muted-foreground mb-4">
                      Follow some users to see their posts here, or generate test data to populate the feed!
                    </p>
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
                  currentUserId={currentUser?.userId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};