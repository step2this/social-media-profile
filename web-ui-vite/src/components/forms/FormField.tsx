/**
 * Reusable form field component with consistent styling and accessibility
 *
 * Provides label, input, and error display in a standardized layout.
 * Following CLAUDE.md principles for functional components.
 */

import React from 'react';

/**
 * Props for the FormField component
 */
interface FormFieldProps {
  /** Unique identifier for the input */
  id: string;
  /** Display label for the field */
  label: string;
  /** Input type (text, email, etc.) */
  type?: string;
  /** Current input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * FormField component for consistent form input styling
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
}) => {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field__label">
        {label}
        {required && <span className="form-field__required" aria-label="required">*</span>}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`form-field__input ${error ? 'form-field__input--error' : ''}`}
        placeholder={placeholder}
        required={required}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
      />

      {error && (
        <div id={`${id}-error`} className="form-field__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};