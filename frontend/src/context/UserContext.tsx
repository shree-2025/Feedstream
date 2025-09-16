import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserContextType {
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (userId: string) => void;
  updateUser: (userId: string, updatedData: Partial<Omit<User, 'id'>>) => void;
  getUserById: (userId: string) => User | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User' },
  { id: '3', name: 'Sam Wilson', email: 'sam.wilson@example.com', role: 'User' },
];

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const localData = localStorage.getItem('users');
      if (localData) {
        return JSON.parse(localData);
      } else {
        localStorage.setItem('users', JSON.stringify(initialUsers));
        return initialUsers;
      }
    } catch (error) {
      console.error("Could not load users from localStorage", error);
      return initialUsers;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error("Could not save users to localStorage", error);
    }
  }, [users]);

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Date.now().toString() };
    setUsers(prevUsers => [newUser, ...prevUsers]);
  };

  const deleteUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  const updateUser = (userId: string, updatedData: Partial<Omit<User, 'id'>>) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, ...updatedData } : user
      )
    );
  };

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  return (
    <UserContext.Provider value={{ users, addUser, deleteUser, updateUser, getUserById }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};
