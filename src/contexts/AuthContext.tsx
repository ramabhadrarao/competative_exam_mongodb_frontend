import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { User, LoginData, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('eduplatform_token');
      if (token) {
        try {
          const { user } = await api.getProfile();
          setUser(user);
          localStorage.setItem('eduplatform_user', JSON.stringify(user));
        } catch (error) {
          console.error('Failed to load user profile:', error);
          localStorage.removeItem('eduplatform_token');
          localStorage.removeItem('eduplatform_user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (data: LoginData) => {
    const response = await api.login(data);
    setUser(response.user);
    localStorage.setItem('eduplatform_user', JSON.stringify(response.user));
  };

  const register = async (data: RegisterData) => {
    const response = await api.register(data);
    setUser(response.user);
    localStorage.setItem('eduplatform_user', JSON.stringify(response.user));
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('eduplatform_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};