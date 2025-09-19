/**
 * Profile creation and editing form component
 *
 * Functional React component using modern patterns and Zod validation.
 * Follows CLAUDE.md principles for form state management and validation.
 */

import React, { useState } from 'react';
import { type CreateProfileRequest, type UpdateProfileRequest, validateCreateRequest, validateUpdateRequest } from '../schemas/shared-schemas';
import { profileApi, handleApiError } from '../services/api-client';

interface ProfileFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateProfileRequest>;
  onSuccess?: (profile: any) => void;
  onCancel?: () => void;
  userId?: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  mode,
  initialData = {},
  onSuccess,
  onCancel,
  userId
}) => {
  const [formData, setFormData] = useState<Partial<CreateProfileRequest>>({
    username: '',
    email: '',
    displayName: '',
    bio: '',
    avatar: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateProfileRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    try {
      if (mode === 'create') {
        validateCreateRequest(formData);
      } else {
        validateUpdateRequest(formData);
      }
      setErrors({});
      return true;
    } catch (error: any) {
      if (error.errors) {
        const validationErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            validationErrors[err.path[0]] = err.message;
          }
        });
        setErrors(validationErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (mode === 'create') {
        result = await profileApi.create(formData as CreateProfileRequest);
      } else if (userId) {
        result = await profileApi.update(userId, formData as UpdateProfileRequest);
      }

      onSuccess?.(result);
    } catch (error) {
      setErrors({
        submit: handleApiError(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2>{mode === 'create' ? 'Create Profile' : 'Edit Profile'}</h2>

      {errors.submit && (
        <div className="error-banner" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username">
          Username {mode === 'create' && <span className="required">*</span>}
        </label>
        <input
          id="username"
          type="text"
          value={formData.username || ''}
          onChange={handleInputChange('username')}
          disabled={isSubmitting}
          className={errors.username ? 'error' : ''}
          placeholder="Enter username"
        />
        {errors.username && (
          <span className="error-text" role="alert">{errors.username}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">
          Email {mode === 'create' && <span className="required">*</span>}
        </label>
        <input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={handleInputChange('email')}
          disabled={isSubmitting}
          className={errors.email ? 'error' : ''}
          placeholder="Enter email address"
        />
        {errors.email && (
          <span className="error-text" role="alert">{errors.email}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="displayName">
          Display Name {mode === 'create' && <span className="required">*</span>}
        </label>
        <input
          id="displayName"
          type="text"
          value={formData.displayName || ''}
          onChange={handleInputChange('displayName')}
          disabled={isSubmitting}
          className={errors.displayName ? 'error' : ''}
          placeholder="Enter display name"
        />
        {errors.displayName && (
          <span className="error-text" role="alert">{errors.displayName}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={formData.bio || ''}
          onChange={handleInputChange('bio')}
          disabled={isSubmitting}
          className={errors.bio ? 'error' : ''}
          placeholder="Tell us about yourself (optional)"
          rows={4}
          maxLength={500}
        />
        {errors.bio && (
          <span className="error-text" role="alert">{errors.bio}</span>
        )}
        <small className="help-text">
          {(formData.bio || '').length}/500 characters
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="avatar">Avatar URL</label>
        <input
          id="avatar"
          type="url"
          value={formData.avatar || ''}
          onChange={handleInputChange('avatar')}
          disabled={isSubmitting}
          className={errors.avatar ? 'error' : ''}
          placeholder="https://example.com/avatar.jpg (optional)"
        />
        {errors.avatar && (
          <span className="error-text" role="alert">{errors.avatar}</span>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Profile' : 'Update Profile')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="cancel-button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};