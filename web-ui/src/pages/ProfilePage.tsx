import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileCard } from '@/components/ProfileCard';
import { EditProfileForm } from '@/components/EditProfileForm';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { Profile, UpdateProfileRequest } from '@/types/profile';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>('');

  // Mock current user ID - in a real app, this would come from authentication context
  const currentUserId = 'demo-user-123';

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]); // fetchProfile is not memoized, but this is fine for this simple use case

  const fetchProfile = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError('');

    try {
      const profileData = await apiService.getProfile(userId);
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: UpdateProfileRequest) => {
    if (!userId || !profile) return;

    setIsUpdating(true);
    setError('');

    try {
      const updatedProfile = await apiService.updateProfile(userId, updates);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          {isEditing ? (
            <EditProfileForm
              profile={profile}
              onSubmit={handleUpdateProfile}
              onCancel={() => setIsEditing(false)}
              isLoading={isUpdating}
            />
          ) : (
            <ProfileCard
              profile={profile}
              isOwner={currentUserId === userId} // Check if current user owns this profile
              currentUserId={currentUserId}
              onEdit={() => setIsEditing(true)}
              onFollowChange={fetchProfile} // Refresh profile to update follower counts
            />
          )}
        </div>
      </div>
    </div>
  );
};