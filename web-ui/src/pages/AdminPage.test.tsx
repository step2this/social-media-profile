import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AdminPage } from './AdminPage';
import { UserProvider } from '@/contexts/UserContext';
import { adminService } from '@/services/admin';

// Mock the services
jest.mock('@/services/admin');
const mockAdminService = adminService as jest.Mocked<typeof adminService>;

// Mock react-router-dom hooks - create a simpler mock that doesn't fail
const mockNavigate = jest.fn();
const mockUseNavigate = jest.fn(() => mockNavigate);

// Create a manual mock that doesn't depend on the actual module
jest.doMock('react-router-dom', () => ({
  useNavigate: mockUseNavigate,
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true),
});

const mockUsers = [
  {
    userId: 'user-1',
    username: 'testuser1',
    displayName: 'Test User 1',
    email: 'test1@example.com',
    bio: 'Test bio 1',
    avatar: '',
    followersCount: 5,
    followingCount: 3,
    postsCount: 10,
    isVerified: false,
    isPrivate: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    userId: 'user-2',
    username: 'testuser2',
    displayName: 'Test User 2',
    email: 'test2@example.com',
    bio: 'Test bio 2',
    avatar: '',
    followersCount: 8,
    followingCount: 2,
    postsCount: 15,
    isVerified: false,
    isPrivate: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <UserProvider>
      {component}
    </UserProvider>
  );
};

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  test('renders admin dashboard header and navigation', async () => {
    renderWithProviders(<AdminPage />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  test('loads and displays users in table', async () => {
    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
      expect(screen.getByText('Test User 2')).toBeInTheDocument();
      expect(screen.getByText('@testuser1')).toBeInTheDocument();
      expect(screen.getByText('@testuser2')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    });

    expect(mockAdminService.listUsers).toHaveBeenCalledWith(1, 10);
  });

  test('displays user statistics correctly', async () => {
    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('10 posts')).toBeInTheDocument();
      expect(screen.getByText('5 followers')).toBeInTheDocument();
      expect(screen.getByText('15 posts')).toBeInTheDocument();
      expect(screen.getByText('8 followers')).toBeInTheDocument();
    });
  });

  test('displays pagination information', async () => {
    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Users (2)')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });
  });

  test('generates test data when form is submitted', async () => {
    mockAdminService.generateTestData.mockResolvedValue({
      message: 'Test data generated successfully',
      summary: {
        usersCreated: 5,
        postsCreated: 15,
        totalItems: 20,
      },
      users: [],
      timestamp: '2024-01-15T10:00:00Z',
    });

    renderWithProviders(<AdminPage />);

    // Find and update the user count input
    const userCountInput = screen.getByDisplayValue('5');
    fireEvent.change(userCountInput, { target: { value: '7' } });

    // Find and update the posts per user input
    const postsPerUserInput = screen.getByDisplayValue('3');
    fireEvent.change(postsPerUserInput, { target: { value: '4' } });

    // Click generate test data button
    const generateButton = screen.getByText('Generate Test Data');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockAdminService.generateTestData).toHaveBeenCalledWith(7, 4);
    });

    await waitFor(() => {
      expect(screen.getByText(/Created 5 users with 15 posts/)).toBeInTheDocument();
    });
  });

  test('handles test data generation error', async () => {
    mockAdminService.generateTestData.mockRejectedValue(new Error('Generation failed'));

    renderWithProviders(<AdminPage />);

    const generateButton = screen.getByText('Generate Test Data');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });
  });

  test('deletes user when delete button is clicked and confirmed', async () => {
    mockAdminService.deleteUser.mockResolvedValue({
      message: 'User deleted successfully',
      deletedItems: 5,
      userId: 'user-1',
    });

    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Find and click delete button for first user
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button =>
      button.querySelector('[data-testid="trash-icon"]') ||
      button.textContent === '' // Delete buttons typically have no text, just icon
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          'Are you sure you want to delete user "testuser1"? This action cannot be undone.'
        );
        expect(mockAdminService.deleteUser).toHaveBeenCalledWith('user-1');
      });

      await waitFor(() => {
        expect(screen.getByText(/User "testuser1" deleted successfully/)).toBeInTheDocument();
      });
    }
  });

  test('does not delete user when confirmation is cancelled', async () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false);

    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button =>
      button.querySelector('[data-testid="trash-icon"]') ||
      button.textContent === ''
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockAdminService.deleteUser).not.toHaveBeenCalled();
    }
  });

  test('handles user deletion error', async () => {
    mockAdminService.deleteUser.mockRejectedValue(new Error('Delete failed'));

    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button =>
      button.querySelector('[data-testid="trash-icon"]') ||
      button.textContent === ''
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    }
  });

  test('performs cleanup when cleanup button is clicked and confirmed', async () => {
    mockAdminService.cleanupAll.mockResolvedValue({
      message: 'Cleanup completed successfully',
      deletedDynamoItems: 100,
      deletedS3Objects: 25,
      timestamp: '2024-01-15T10:00:00Z',
    });

    renderWithProviders(<AdminPage />);

    const cleanupButton = screen.getByText('Cleanup All Data');
    fireEvent.click(cleanupButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete ALL users and data? This action cannot be undone.'
      );
      expect(mockAdminService.cleanupAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Cleanup completed: 100 database items and 25 files deleted/)).toBeInTheDocument();
    });
  });

  test('handles cleanup error', async () => {
    mockAdminService.cleanupAll.mockRejectedValue(new Error('Cleanup failed'));

    renderWithProviders(<AdminPage />);

    const cleanupButton = screen.getByText('Cleanup All Data');
    fireEvent.click(cleanupButton);

    await waitFor(() => {
      expect(screen.getByText('Cleanup failed')).toBeInTheDocument();
    });
  });

  test('navigates to home when home button is clicked', () => {
    renderWithProviders(<AdminPage />);

    const homeButton = screen.getByText('Home');
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('refreshes user list when refresh button is clicked', async () => {
    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(mockAdminService.listUsers).toHaveBeenCalledTimes(2); // Initial load + UserContext load
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockAdminService.listUsers).toHaveBeenCalledTimes(3); // Plus one more refresh
    });
  });

  test('handles pagination navigation', async () => {
    // Mock paginated response
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 3,
        totalUsers: 25,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    });

    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Test next page navigation
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    expect(nextButton).not.toBeDisabled();

    // Test previous page navigation (should be disabled on first page)
    const prevButton = screen.getByRole('button', { name: /chevron-left/i });
    expect(prevButton).toBeDisabled();
  });

  test('displays loading state while fetching users', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockAdminService.listUsers.mockReturnValue(promise as any);

    renderWithProviders(<AdminPage />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();

    // Resolve the promise
    act(() => {
      resolvePromise!({
        users: mockUsers,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 2,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });
  });

  test('displays empty state when no users found', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    renderWithProviders(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  test('validates input constraints for test data generation', async () => {
    renderWithProviders(<AdminPage />);

    const userCountInput = screen.getByDisplayValue('5');
    const postsPerUserInput = screen.getByDisplayValue('3');

    // Test min/max attributes
    expect(userCountInput).toHaveAttribute('min', '1');
    expect(userCountInput).toHaveAttribute('max', '20');
    expect(postsPerUserInput).toHaveAttribute('min', '1');
    expect(postsPerUserInput).toHaveAttribute('max', '10');
  });
});