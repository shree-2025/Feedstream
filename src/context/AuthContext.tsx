import React, { createContext, useContext, useState, ReactNode } from 'react';
import api from '../lib/axios';

export type UserRole = 'MasterAdmin' | 'OrganizationAdmin' | 'DepartmentAdmin' | 'Staff' | 'Student' | 'EndUser';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  department?: string | null;
  phone?: string | null;
  collegeName?: string | null;
  collegeLogoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Normalize any user-shaped object to ensure _id is present and stringified
  const normalizeUser = (raw: any): User | null => {
    if (!raw || typeof raw !== 'object') return null;
    const _id = raw._id ?? raw.id ?? raw.userId;
    if (!_id) return null;
    return {
      _id: String(_id),
      name: raw.name ?? '',
      email: raw.email ?? '',
      role: raw.role as UserRole,
      avatar_url: raw.avatar_url ?? raw.avatarUrl ?? null,
      department: raw.department ?? null,
      phone: raw.phone ?? null,
      collegeName: raw.collegeName ?? raw.college_name ?? null,
      collegeLogoUrl: raw.collegeLogoUrl ?? raw.college_logo_url ?? null,
    } as User;
  };

  const [user, setUser] = useState<User | null>(() => {
    try {
      const newKey = 'feedstream_user';
      const oldKey = 'elog_user';
      const saved = localStorage.getItem(newKey);
      if (saved) {
        return normalizeUser(JSON.parse(saved));
      }
      const legacy = localStorage.getItem(oldKey);
      if (legacy) {
        const normalized = normalizeUser(JSON.parse(legacy));
        if (normalized) {
          localStorage.setItem(newKey, JSON.stringify(normalized));
        } else {
          localStorage.setItem(newKey, legacy);
        }
        localStorage.removeItem(oldKey);
        return normalized ?? JSON.parse(legacy);
      }
    } catch {}
    return null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data } = await api.post(
        '/api/users/login',
        { email, password },
        config
      );

      setUser(data);
      localStorage.setItem('feedstream_user', JSON.stringify(data));
      // cleanup old key if present
      localStorage.removeItem('elog_user');
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('feedstream_user');
    localStorage.removeItem('elog_user');
  };

  // Migration safety net (kept but state already hydrated above)
  React.useEffect(() => {
    try {
      const newKey = 'feedstream_user';
      const oldKey = 'elog_user';
      if (!localStorage.getItem(newKey)) {
        const legacy = localStorage.getItem(oldKey);
        if (legacy) {
          const normalized = normalizeUser(JSON.parse(legacy));
          if (normalized) {
            localStorage.setItem(newKey, JSON.stringify(normalized));
            setUser(normalized);
          } else {
            localStorage.setItem(newKey, legacy);
            setUser(JSON.parse(legacy));
          }
          localStorage.removeItem(oldKey);
        }
      }
    } catch {}
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    updateUser: (updates: Partial<User>) => {
      setUser((prev) => {
        const next = { ...(prev as User), ...updates } as User;
        try {
          localStorage.setItem('feedstream_user', JSON.stringify(next));
        } catch {}
        return next;
      });
    },
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
