import React from 'react';
import { Profile } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/FollowButton';
import { User, Edit, Users, MessageSquare, Shield } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
  isOwner?: boolean;
  currentUserId?: string;
  onEdit?: () => void;
  onFollowChange?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isOwner = false,
  currentUserId,
  onEdit,
  onFollowChange
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={`${profile.displayName}'s avatar`}
              className="w-24 h-24 rounded-full object-cover border-4 border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {profile.isVerified && (
            <Shield className="w-6 h-6 text-blue-500 ml-2 mt-16" fill="currentColor" />
          )}
        </div>
        <CardTitle className="text-2xl">{profile.displayName}</CardTitle>
        <p className="text-muted-foreground">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-foreground mt-2">{profile.bio}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex justify-around text-center border-t pt-4">
          <div>
            <div className="font-semibold text-lg">{profile.postsCount}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Posts
            </div>
          </div>
          <div>
            <div className="font-semibold text-lg">{profile.followersCount}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              Followers
            </div>
          </div>
          <div>
            <div className="font-semibold text-lg">{profile.followingCount}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              Following
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Joined {formatDate(profile.createdAt)}
          </p>
          {profile.isPrivate && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Private Account
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {isOwner && onEdit && (
            <Button
              onClick={onEdit}
              variant="outline"
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}

          {!isOwner && currentUserId && (
            <FollowButton
              currentUserId={currentUserId}
              targetUserId={profile.userId}
              onFollowChange={onFollowChange}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};