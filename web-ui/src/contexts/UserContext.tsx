import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '@/types/profile';
import { adminService } from '@/services/admin';

interface UserContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  switchUser: (userId: string) => void;
  availableUsers: Profile[];
  addUser: (user: Profile) => void;
  refreshUsers: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.listUsers(1, 50); // Get up to 50 users for switching
      setAvailableUsers(response.users);

      // Set first user as current if no user is selected
      if (!currentUser && response.users.length > 0) {
        setCurrentUser(response.users[0]);
      }
      // If current user was deleted, switch to first available user
      else if (currentUser && !response.users.some(u => u.userId === currentUser.userId)) {
        setCurrentUser(response.users.length > 0 ? response.users[0] : null);
      }
    } catch (error) {
      console.error('Failed to refresh users:', error);
      setAvailableUsers([]);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = (userId: string) => {
    const user = availableUsers.find(u => u.userId === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const addUser = (user: Profile) => {
    setAvailableUsers(prev => {
      const exists = prev.some(u => u.userId === user.userId);
      if (!exists) {
        return [...prev, user];
      }
      return prev.map(u => u.userId === user.userId ? user : u);
    });
  };

  // Load users on mount
  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser,
      switchUser,
      availableUsers,
      addUser,
      refreshUsers,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};