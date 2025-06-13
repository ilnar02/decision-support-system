import React, { createContext, useContext, useState, ReactNode } from 'react';

// Mock user roles for the example
export type UserRole = 'admin' | 'manager' | 'storekeeper' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: {
    type: 'store' | 'warehouse';
    id: string;
  } | null;
}

// Переводим типы для использования в интерфейсе
export const USER_ROLE_NAMES = {
  admin: 'Администратор',
  manager: 'Менеджер',
  storekeeper: 'Кладовщик',
  cashier: 'Кассир'
};

export const LOCATION_TYPE_NAMES = {
  store: 'Магазин',
  warehouse: 'Склад'
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  hasPermission: () => false,
});

export const useAuth = () => useContext(AuthContext);

// Mock permissions by role
const rolePermissions: Record<UserRole, string[]> = {
  admin: ['all'],
  manager: ['read:all', 'write:products', 'write:orders', 'write:employees', 'read:reports'],
  storekeeper: ['read:products', 'write:inventory', 'read:orders', 'write:orders'],
  cashier: ['read:products', 'write:sales', 'read:customers'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Admins have all permissions
    if (user.role === 'admin' || rolePermissions[user.role].includes('all')) {
      return true;
    }
    
    return rolePermissions[user.role].includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}