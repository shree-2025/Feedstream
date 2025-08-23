import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'MasterAdmin' | 'OrganizationAdmin' | 'DepartmentAdmin' | 'Staff' | 'Student' | 'EndUser';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy users for different roles
const dummyUsers: Record<UserRole, User> = {
  MasterAdmin: {
    id: '1',
    name: 'Master Administrator',
    email: 'master@elog.com',
    role: 'MasterAdmin',
  },
  OrganizationAdmin: {
    id: '2',
    name: 'Organization Admin',
    email: 'org-admin@elog.com',
    role: 'OrganizationAdmin',
  },
  DepartmentAdmin: {
    id: '3',
    name: 'Department Admin',
    email: 'dept-admin@elog.com',
    role: 'DepartmentAdmin',
  },
  Staff: {
    id: '4',
    name: 'Staff Member',
    email: 'staff@elog.com',
    role: 'Staff',
  },
  Student: {
    id: '5',
    name: 'Student User',
    email: 'student@elog.com',
    role: 'Student',
  },
  EndUser: {
    id: '6',
    name: 'End User',
    email: 'enduser@elog.com',
    role: 'EndUser',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple dummy authentication - any password works
    if (email && password) {
      const selectedUser = dummyUsers[role];
      setUser(selectedUser);
      localStorage.setItem('elog_user', JSON.stringify(selectedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('elog_user');
  };

  // Check for existing user on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('elog_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('elog_user');
      }
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
