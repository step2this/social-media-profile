/**
 * Create Profile Form component
 *
 * Combines form hook with FormField components to create a working profile form.
 * This is a minimal implementation to test our foundation pieces.
 */

import React, { useState } from 'react';
import { useCreateProfileForm } from '../../hooks/useCreateProfileForm';
import { FormField } from '../forms/FormField';
import { profileApi } from '../../services/api-client';

/**
 * CreateProfileForm component
 */
export const CreateProfileForm: React.FC = () => {
  const { formData, errors, updateField, validateField, validateForm, resetForm } = useCreateProfileForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setIsSuccess(false);
    try {
      // Create clean request data - only include optional fields if they have values
      const requestData: any = {
        username: formData.username,
        email: formData.email,
        displayName: formData.displayName,
      };

      // Only include optional fields if they have non-empty values
      if (formData.bio && formData.bio.trim()) {
        requestData.bio = formData.bio;
      }
      if (formData.avatar && formData.avatar.trim()) {
        requestData.avatar = formData.avatar;
      }

      const profile = await profileApi.create(requestData);
      console.log('Profile created successfully:', profile);
      setIsSuccess(true);
      resetForm();
    } catch (error) {
      console.error('Failed to create profile:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to create profile. Please try again.';

      if (error instanceof Error) {
        // For now, use the raw error message from Zod or API
        errorMessage = error.message || errorMessage;
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-profile-form">
      <h2>Create Your Profile</h2>

      {submitError && (
        <div className="form-error" role="alert">
          {submitError}
        </div>
      )}

      {isSuccess && (
        <div className="form-success" role="alert">
          Profile created successfully! Welcome to the platform.
        </div>
      )}

      <FormField
        id="username"
        label="Username"
        value={formData.username}
        onChange={(value) => updateField('username', value)}
        error={errors.username}
        required
        placeholder="Choose a unique username"
      />

      <FormField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => updateField('email', value)}
        error={errors.email}
        required
        placeholder="your.email@example.com"
      />

      <FormField
        id="displayName"
        label="Display Name"
        value={formData.displayName}
        onChange={(value) => updateField('displayName', value)}
        error={errors.displayName}
        required
        placeholder="How others will see your name"
      />

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
        </button>
        <button type="button" onClick={resetForm} className="btn btn-secondary" disabled={isSubmitting}>
          Reset
        </button>
      </div>
    </form>
  );
};