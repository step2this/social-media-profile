/**
 * Form hook for create profile functionality
 *
 * Manages form state, validation, and submission using functional patterns
 * and Zod validation following CLAUDE.md principles.
 */

import { useState } from 'react';
import { CreateProfileRequestSchema } from '../schemas/shared-schemas';
import { ZodError } from 'zod';

/**
 * Form state interface
 */
interface FormState {
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatar: string;
}

/**
 * Validation errors interface
 */
interface ValidationErrors {
  username?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
}

/**
 * Hook return interface
 */
interface UseCreateProfileFormReturn {
  formData: FormState;
  errors: ValidationErrors;
  updateField: (field: keyof FormState, value: string) => void;
  validateField: (field: keyof FormState) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

/**
 * Initial form state
 */
const INITIAL_STATE: FormState = {
  username: '',
  email: '',
  displayName: '',
  bio: '',
  avatar: '',
};

/**
 * Custom hook for managing create profile form state
 *
 * @returns Form state and handlers
 */
export const useCreateProfileForm = (): UseCreateProfileFormReturn => {
  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Update a single form field and clear its error
   */
  const updateField = (field: keyof FormState, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Validate a single field using Zod
   */
  const validateField = (field: keyof FormState): void => {
    try {
      CreateProfileRequestSchema.pick({ [field]: true }).parse(formData);
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.issues.find(err => err.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError.message,
          }));
        }
      }
    }
  };

  /**
   * Validate entire form and return whether it's valid
   */
  const validateForm = (): boolean => {
    try {
      CreateProfileRequestSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: ValidationErrors = {};
        error.issues.forEach(err => {
          const field = err.path[0] as keyof FormState;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = (): void => {
    setFormData(INITIAL_STATE);
    setErrors({});
  };

  return {
    formData,
    errors,
    updateField,
    validateField,
    validateForm,
    resetForm,
  };
};
