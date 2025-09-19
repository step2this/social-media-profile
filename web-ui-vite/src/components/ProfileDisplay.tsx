/**
 * Profile display and management component
 *
 * Shows profile information with edit capabilities.
 * Follows CLAUDE.md principles for data fetching and state management.
 */

import React, { useState, useEffect } from 'react';
import { type ProfileResponse } from '../schemas/shared-schemas';
import { profileApi, handleApiError } from '../services/api-client';
import { ProfileForm } from './ProfileForm';

interface ProfileDisplayProps {
  userId: string;
  allowEdit?: boolean;
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  userId,
  allowEdit = false
}) => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await profileApi.getById(userId);
      setProfile(profileData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleEditSuccess = (updatedProfile: ProfileResponse) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="profile-display loading">
        <div className="loading-spinner" aria-label="Loading profile">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-display error">
        <div className="error-message" role="alert">
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <button onClick={loadProfile} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-display not-found">
        <div className="not-found-message">
          <h3>Profile Not Found</h3>
          <p>The requested profile could not be found.</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="profile-display editing">
        <ProfileForm
          mode="edit"
          initialData={{
            username: profile.username,
            displayName: profile.displayName,
            bio: profile.bio,
            avatar: profile.avatar
          }}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          userId={userId}
        />
      </div>
    );
  }

  return (
    <div className="profile-display">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={`${profile.displayName}'s avatar`}
              className="avatar-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="avatar-placeholder">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-names">
            <h1 className="display-name">{profile.displayName}</h1>
            <p className="username">@{profile.username}</p>
            {profile.isVerified && (
              <span className="verified-badge" title="Verified account">✓</span>
            )}
          </div>

          {allowEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="edit-button"
              aria-label="Edit profile"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {profile.bio && (
        <div className="profile-bio">
          <p>{profile.bio}</p>
        </div>
      )}

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{profile.postsCount}</span>
          <span className="stat-label">Posts</span>
        </div>
        <div className="stat">
          <span className="stat-value">{profile.followersCount}</span>
          <span className="stat-label">Followers</span>
        </div>
        <div className="stat">
          <span className="stat-value">{profile.followingCount}</span>
          <span className="stat-label">Following</span>
        </div>
      </div>

      <div className="profile-metadata">
        <div className="metadata-item">
          <span className="metadata-label">Member since:</span>
          <span className="metadata-value">
            {new Date(profile.createdAt).toLocaleDateString()}
          </span>
        </div>
        {profile.isPrivate && (
          <div className="privacy-indicator">
            <span className="privacy-badge">Private Account</span>
          </div>
        )}
      </div>
    </div>
  );
};