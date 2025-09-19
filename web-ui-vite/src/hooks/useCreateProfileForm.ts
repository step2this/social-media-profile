/**
 * Form hook for create profile functionality
 *
 * Manages form state, validation, and submission using functional patterns
 * and Zod validation following CLAUDE.md principles.
 */

import { useState } from 'react';

/**
 * Form state interface
 */
interface FormState {
  username: string;
  email: string;
  displayName: string;
}

/**
 * Hook return interface
 */
interface UseCreateProfileFormReturn {
  formData: FormState;
  updateField: (field: keyof FormState, value: string) => void;
  resetForm: () => void;
}

/**
 * Initial form state
 */
const INITIAL_STATE: FormState = {
  username: '',
  email: '',
  displayName: '',
};

/**
 * Custom hook for managing create profile form state
 *
 * @returns Form state and handlers
 */
export const useCreateProfileForm = (): UseCreateProfileFormReturn => {
  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);

  /**
   * Update a single form field
   */
  const updateField = (field: keyof FormState, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Reset form to initial state
   */
  const resetForm = (): void => {
    setFormData(INITIAL_STATE);
  };

  return {
    formData,
    updateField,
    resetForm,
  };
};