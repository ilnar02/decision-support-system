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

  // Mock login function - in a real app, this would make an API call
  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@example.com' && password === 'password') {
      setUser({
        id: '1',
        name: 'Администратор',
        email: 'admin@example.com',
        role: 'admin',
        location: null,
      });
    } else if (email === 'manager@example.com' && password === 'password') {
      setUser({
        id: '2',
        name: 'Менеджер магазина',
        email: 'manager@example.com',
        role: 'manager',
        location: { type: 'store', id: '1' },
      });
    } else if (email === 'storekeeper@example.com' && password === 'password') {
      setUser({
        id: '3',
        name: 'Заведующий складом',
        email: 'storekeeper@example.com',
        role: 'storekeeper',
        location: { type: 'warehouse', id: '1' },
      });
    } else if (email === 'cashier@example.com' && password === 'password') {
      setUser({
        id: '4',
        name: 'Кассир',
        email: 'cashier@example.com',
        role: 'cashier',
        location: { type: 'store', id: '1' },
      });
    } else {
      throw new Error('Неверные учетные данные');
    }
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