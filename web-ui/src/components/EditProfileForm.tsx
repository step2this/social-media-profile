import React, { useState } from 'react';
import { Profile, UpdateProfileRequest } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X } from 'lucide-react';

interface EditProfileFormProps {
  profile: Profile;
  onSubmit: (data: UpdateProfileRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    displayName: profile.displayName,
    bio: profile.bio,
    avatar: profile.avatar,
    isPrivate: profile.isPrivate,
  });

  const [errors, setErrors] = useState<Partial<UpdateProfileRequest>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateProfileRequest> = {};

    if (formData.displayName && !formData.displayName.trim()) {
      newErrors.displayName = 'Display name cannot be empty';
    }

    if (formData.avatar && !isValidUrl(formData.avatar)) {
      newErrors.avatar = 'Please enter a valid URL for the avatar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    // Only send fields that have changed
    const updates: UpdateProfileRequest = {};

    if (formData.displayName !== profile.displayName) {
      updates.displayName = formData.displayName;
    }
    if (formData.bio !== profile.bio) {
      updates.bio = formData.bio;
    }
    if (formData.avatar !== profile.avatar) {
      updates.avatar = formData.avatar;
    }
    if (formData.isPrivate !== profile.isPrivate) {
      updates.isPrivate = formData.isPrivate;
    }

    // If no changes, just cancel
    if (Object.keys(updates).length === 0) {
      onCancel();
      return;
    }

    try {
      await onSubmit(updates);
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleInputChange = (
    field: keyof UpdateProfileRequest,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="w-6 h-6" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              value={formData.displayName || ''}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className={errors.displayName ? 'border-destructive' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              rows={3}
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={formData.avatar || ''}
              onChange={(e) => handleInputChange('avatar', e.target.value)}
              className={errors.avatar ? 'border-destructive' : ''}
            />
            {errors.avatar && (
              <p className="text-sm text-destructive">{errors.avatar}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isPrivate"
              type="checkbox"
              checked={formData.isPrivate || false}
              onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isPrivate" className="text-sm font-normal cursor-pointer">
              Private account (only followers can see your posts)
            </Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};