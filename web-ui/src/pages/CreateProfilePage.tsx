import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateProfileForm } from '@/components/CreateProfileForm';
import { apiService } from '@/services/api';
import { CreateProfileRequest } from '@/types/profile';

export const CreateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleCreateProfile = async (data: CreateProfileRequest) => {
    setIsLoading(true);
    setError('');

    try {
      const newProfile = await apiService.createProfile(data);
      navigate(`/profile/${newProfile.userId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}
        <CreateProfileForm
          onSubmit={handleCreateProfile}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};