/**
 * Create Profile Form component
 *
 * Combines form hook with FormField components to create a working profile form.
 * This is a minimal implementation to test our foundation pieces.
 */

import React from 'react';
import { useCreateProfileForm } from '../../hooks/useCreateProfileForm';
import { FormField } from '../forms/FormField';

/**
 * CreateProfileForm component
 */
export const CreateProfileForm: React.FC = () => {
  const { formData, errors, updateField, validateField, validateForm, resetForm } = useCreateProfileForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted with valid data:', formData);
    } else {
      console.log('Form validation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-profile-form">
      <h2>Create Your Profile</h2>

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
        <button type="submit" className="btn btn-primary">
          Create Profile
        </button>
        <button type="button" onClick={resetForm} className="btn btn-secondary">
          Reset
        </button>
      </div>
    </form>
  );
};