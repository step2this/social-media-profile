import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';

// Mock useNavigate hook
const mockNavigate = jest.fn();

// Custom render function that includes router context
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-router">{children}</div>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

// Mock API service for tests
export const mockApiService = {
  createProfile: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  searchProfiles: jest.fn(),
};

// Export mock navigate function
export const getMockNavigate = () => mockNavigate;

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };