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
  const { formData, updateField, resetForm } = useCreateProfileForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="create-profile-form">
      <h2>Create Your Profile</h2>

      <FormField
        id="username"
        label="Username"
        value={formData.username}
        onChange={(value) => updateField('username', value)}
        required
        placeholder="Choose a unique username"
      />

      <FormField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => updateField('email', value)}
        required
        placeholder="your.email@example.com"
      />

      <FormField
        id="displayName"
        label="Display Name"
        value={formData.displayName}
        onChange={(value) => updateField('displayName', value)}
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