import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  onFollowChange?: () => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  currentUserId,
  targetUserId,
  onFollowChange
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [currentUserId, targetUserId]);

  const checkFollowStatus = async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setIsLoading(false);
      return;
    }

    try {
      // For demo purposes, simulate follow status with local storage
      const followKey = `follow_${currentUserId}_${targetUserId}`;
      const isFollowingStored = localStorage.getItem(followKey) === 'true';
      setIsFollowing(isFollowingStored);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      return;
    }

    setIsActionLoading(true);

    try {
      // For demo purposes, simulate follow/unfollow with local storage
      const followKey = `follow_${currentUserId}_${targetUserId}`;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isFollowing) {
        localStorage.removeItem(followKey);
        setIsFollowing(false);
      } else {
        localStorage.setItem(followKey, 'true');
        setIsFollowing(true);
      }

      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Don't show button if same user or loading initially
  if (isLoading || currentUserId === targetUserId || !currentUserId || !targetUserId) {
    return null;
  }

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={isActionLoading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="px-4"
    >
      {isActionLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isActionLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
};