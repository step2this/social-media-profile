import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService, AdminUser, UserListResponse } from '@/services/admin';
import {
  Settings,
  Users,
  Trash2,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Home
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUsers } = useUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test data generation state
  const [testUserCount, setTestUserCount] = useState(5);
  const [testPostsPerUser, setTestPostsPerUser] = useState(3);

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response: UserListResponse = await adminService.listUsers(page, pagination.pageSize);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(`delete-${userId}`);
      await adminService.deleteUser(userId);
      setMessage({ type: 'success', text: `User "${username}" deleted successfully` });
      loadUsers(pagination.currentPage);
      refreshUsers(); // Refresh user switcher
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete user' });
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
      loadUsers(1);
      refreshUsers(); // Refresh user switcher
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to cleanup data' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateTestData = async () => {
    try {
      setActionLoading('generate');
      const result = await adminService.generateTestData(testUserCount, testPostsPerUser);
      setMessage({
        type: 'success',
        text: `Created ${result.summary.usersCreated} users with ${result.summary.postsCreated} posts`
      });
      loadUsers(1);
      refreshUsers(); // Refresh user switcher
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to generate test data' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button onClick={() => loadUsers(pagination.currentPage)} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Test Data Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Generate Test Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userCount">Users</Label>
                  <Input
                    id="userCount"
                    type="number"
                    min="1"
                    max="20"
                    value={testUserCount}
                    onChange={(e) => setTestUserCount(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="postsPerUser">Posts per User</Label>
                  <Input
                    id="postsPerUser"
                    type="number"
                    min="1"
                    max="10"
                    value={testPostsPerUser}
                    onChange={(e) => setTestPostsPerUser(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateTestData}
                disabled={actionLoading === 'generate'}
                className="w-full"
              >
                {actionLoading === 'generate' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Generate Test Data
              </Button>
            </CardContent>
          </Card>

          {/* Cleanup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remove all users, posts, likes, and uploaded images from the system.
              </p>
              <Button
                onClick={handleCleanupAll}
                disabled={actionLoading === 'cleanup'}
                variant="destructive"
                className="w-full"
              >
                {actionLoading === 'cleanup' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Cleanup All Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({pagination.totalUsers})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => loadUsers(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  onClick={() => loadUsers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Stats</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userId} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">{user.email}</div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{user.postsCount} posts</div>
                            <div>{user.followersCount} followers</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">{formatDate(user.createdAt)}</div>
                        </td>
                        <td className="p-2">
                          <Button
                            onClick={() => handleDeleteUser(user.userId, user.username)}
                            disabled={actionLoading === `delete-${user.userId}`}
                            variant="destructive"
                            size="sm"
                          >
                            {actionLoading === `delete-${user.userId}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};