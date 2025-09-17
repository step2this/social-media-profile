import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from './UserContext';
import { adminService } from '@/services/admin';
import { Profile } from '@/types/profile';

// Mock the admin service
jest.mock('@/services/admin');
const mockAdminService = adminService as jest.Mocked<typeof adminService>;

// Test component to access the context
const TestComponent: React.FC = () => {
  const {
    currentUser,
    availableUsers,
    isLoading,
    switchUser,
    addUser,
    refreshUsers
  } = useUser();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="current-user">
        {currentUser ? currentUser.displayName : 'No User'}
      </div>
      <div data-testid="available-users">
        {availableUsers.map(user => (
          <div key={user.userId} data-testid={`user-${user.userId}`}>
            {user.displayName}
          </div>
        ))}
      </div>
      <button
        data-testid="switch-user-btn"
        onClick={() => switchUser('user-2')}
      >
        Switch User
      </button>
      <button
        data-testid="add-user-btn"
        onClick={() => addUser({
          userId: 'user-3',
          username: 'newuser',
          displayName: 'New User',
          email: 'new@example.com',
          bio: 'New user bio',
          avatar: '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isVerified: false,
          isPrivate: false,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        })}
      >
        Add User
      </button>
      <button
        data-testid="refresh-users-btn"
        onClick={() => refreshUsers()}
      >
        Refresh Users
      </button>
    </div>
  );
};

const mockUsers: Profile[] = [
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

describe('UserContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with loading state and fetches users on mount', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('current-user')).toHaveTextContent('No User');

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(mockAdminService.listUsers).toHaveBeenCalledWith(1, 50);
    expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 1');
    expect(screen.getByTestId('user-user-1')).toHaveTextContent('Test User 1');
    expect(screen.getByTestId('user-user-2')).toHaveTextContent('Test User 2');
  });

  test('sets first user as current when no current user exists', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 1');
    });
  });

  test('handles empty user list', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('No User');
    expect(screen.queryByTestId('user-user-1')).not.toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAdminService.listUsers.mockRejectedValue(new Error('API Error'));

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('No User');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh users:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  test('switchUser changes current user to existing user', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 1');
    });

    act(() => {
      screen.getByTestId('switch-user-btn').click();
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 2');
  });

  test('switchUser does nothing for non-existent user', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    const TestComponentWithNonExistentUser: React.FC = () => {
      const { currentUser, switchUser } = useUser();

      return (
        <div>
          <div data-testid="current-user">
            {currentUser ? currentUser.displayName : 'No User'}
          </div>
          <button
            data-testid="switch-nonexistent-user-btn"
            onClick={() => switchUser('non-existent-user')}
          >
            Switch to Non-Existent User
          </button>
        </div>
      );
    };

    render(
      <UserProvider>
        <TestComponentWithNonExistentUser />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 1');
    });

    // Try to switch to non-existent user
    act(() => {
      screen.getByTestId('switch-nonexistent-user-btn').click();
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 1');
  });

  test('addUser adds new user to available users', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.queryByTestId('user-user-3')).not.toBeInTheDocument();

    act(() => {
      screen.getByTestId('add-user-btn').click();
    });

    expect(screen.getByTestId('user-user-3')).toHaveTextContent('New User');
  });

  test('addUser updates existing user instead of duplicating', async () => {
    mockAdminService.listUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    const TestComponentWithUpdate: React.FC = () => {
      const { availableUsers, addUser } = useUser();

      return (
        <div>
          <div data-testid="available-users">
            {availableUsers.map(user => (
              <div key={user.userId} data-testid={`user-${user.userId}`}>
                {user.displayName}
              </div>
            ))}
          </div>
          <button
            data-testid="update-user-btn"
            onClick={() => addUser({
              userId: 'user-1', // Same ID as existing user
              username: 'testuser1',
              displayName: 'Updated Test User 1',
              email: 'test1@example.com',
              bio: 'Updated bio',
              avatar: '',
              followersCount: 10,
              followingCount: 5,
              postsCount: 20,
              isVerified: false,
              isPrivate: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-15T12:00:00Z',
            })}
          >
            Update User
          </button>
        </div>
      );
    };

    render(
      <UserProvider>
        <TestComponentWithUpdate />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-user-1')).toHaveTextContent('Test User 1');
    });

    act(() => {
      screen.getByTestId('update-user-btn').click();
    });

    expect(screen.getByTestId('user-user-1')).toHaveTextContent('Updated Test User 1');
    expect(screen.getAllByTestId(/^user-user-1$/)).toHaveLength(1); // Should still be only one instance
  });

  test('refreshUsers fetches latest user data', async () => {
    const updatedUsers = [
      ...mockUsers,
      {
        userId: 'user-3',
        username: 'testuser3',
        displayName: 'Test User 3',
        email: 'test3@example.com',
        bio: 'Test bio 3',
        avatar: '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
        isPrivate: false,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
    ];

    // Initial load
    mockAdminService.listUsers.mockResolvedValueOnce({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    // Refresh load
    mockAdminService.listUsers.mockResolvedValueOnce({
      users: updatedUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 3,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.queryByTestId('user-user-3')).not.toBeInTheDocument();

    await act(async () => {
      screen.getByTestId('refresh-users-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-user-3')).toHaveTextContent('Test User 3');
    });

    expect(mockAdminService.listUsers).toHaveBeenCalledTimes(2);
  });

  test('switches to first available user when current user is deleted', async () => {
    // Initial load with 2 users
    mockAdminService.listUsers.mockResolvedValueOnce({
      users: mockUsers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    // Refresh load with user-1 deleted
    mockAdminService.listUsers.mockResolvedValueOnce({
      users: [mockUsers[1]], // Only user-2 remains
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 1,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 1');
    });

    await act(async () => {
      screen.getByTestId('refresh-users-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('Test User 2');
    });
  });

  test('throws error when useUser is used outside UserProvider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useUser must be used within a UserProvider');

    consoleErrorSpy.mockRestore();
  });
});