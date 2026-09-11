import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchDemoRole: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string | string[]) => boolean;
  demoAccounts: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    // Load demo accounts list
    api.getDemoAccounts()
      .then(res => setDemoAccounts(res.demoUsers || []))
      .catch(console.error);

    // Check existing token
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then(res => {
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            clearAuthToken();
          }
        })
        .catch(() => clearAuthToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string = 'SuperAdmin123!') => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = async (email: string, password?: string) => {
    const defaultPwMap: Record<string, string> = {
      'superadmin@nexora.com': 'SuperAdmin123!',
      'admin@nexora.com': 'Admin123!',
      'manager@nexora.com': 'Manager123!',
      'leader@nexora.com': 'Leader123!',
      'sales@nexora.com': 'Sales123!',
      'inventory@nexora.com': 'Inventory123!',
      'finance@nexora.com': 'Finance123!',
      'support@nexora.com': 'Support123!',
    };
    const pw = password || defaultPwMap[email] || 'Sales123!';
    await login(email, pw);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const hasPermission = (permissionCode: string | string[]): boolean => {
    if (!user) return false;
    if (user.role_code === 'SUPER_ADMIN' || user.role_code === 'super_admin') return true;
    if (Array.isArray(permissionCode)) {
      return permissionCode.some(p => user.permissions?.includes(p));
    }
    return Boolean(user.permissions?.includes(permissionCode));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchDemoRole, logout, hasPermission, demoAccounts }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
