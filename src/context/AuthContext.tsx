import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'MasterAdmin' | 'OrganizationAdmin' | 'DepartmentAdmin' | 'Staff' | 'Student';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  requiresPasswordChange?: boolean;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean; // Add loading state
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map frontend role to backend endpoint
const roleToEndpoint: Record<UserRole, string | null> = {
  MasterAdmin: null, // not implemented on backend yet
  OrganizationAdmin: '/auth/org/login',
  DepartmentAdmin: '/auth/department/login',
  Staff: '/auth/staff/login',
  Student: null, // not implemented on backend yet
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Initialize loading to true

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const endpoint = roleToEndpoint[role];
    if (!endpoint) {
      throw new Error('Selected role is not supported for login yet');
    }

    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const url = `${base}${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    const token: string | undefined = data?.token;
    const apiUser = data?.user as { id: number | string; email: string; name?: string; role?: string };
    const requirePasswordChange: boolean = !!data?.requirePasswordChange;

    if (!token || !apiUser) return false;

    // Map backend role to frontend role if needed
    const mappedRole: UserRole =
      role === 'OrganizationAdmin' ? 'OrganizationAdmin' :
      role === 'DepartmentAdmin' ? 'DepartmentAdmin' :
      role === 'Staff' ? 'Staff' : role;

    const normalizedUser: User = {
      id: String(apiUser.id),
      name: apiUser.name || '',
      email: apiUser.email,
      role: mappedRole,
      requiresPasswordChange: requirePasswordChange,
    };

    setUser(normalizedUser);
    localStorage.setItem('elog_user', JSON.stringify(normalizedUser));
    localStorage.setItem('elog_token', token);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('elog_user');
    localStorage.removeItem('elog_token');
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates } as User;
      try {
        localStorage.setItem('elog_user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Check for existing user on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('elog_user');
    const token = localStorage.getItem('elog_token');
    try {
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
      } else {
        localStorage.removeItem('elog_user');
        localStorage.removeItem('elog_token');
      }
    } catch (error) {
      localStorage.removeItem('elog_user');
      localStorage.removeItem('elog_token');
    } finally {
      setLoading(false); // Set loading to false after checking
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
    updateUser,
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
