import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Warehouse, 
  Truck, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, hasPermission } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const menuItems = [
    {
      title: 'Главная',
      path: '/',
      icon: <LayoutDashboard size={20} />,
      permission: 'read:dashboard',
    },
    {
      title: 'Товары',  
      path: '/products',
      icon: <Package size={20} />,
      permission: 'read:products',
    },
    {
      title: 'Склады',
      path: '/warehouses',
      icon: <Warehouse size={20} />,
      permission: 'read:warehouses',
    },
    {
      title: 'Магазины',
      path: '/stores',
      icon: <Store size={20} />,
      permission: 'read:stores',
    },
    {
      title: 'Поставщики',
      path: '/suppliers',
      icon: <Truck size={20} />,
      permission: 'read:suppliers',
    },
    {
      title: 'Транзакции',
      path: '/transactions',
      icon: <ShoppingCart size={20} />,
      permission: 'read:transactions',
    },

    {
      title: 'Сотрудники',
      path: '/employees',
      icon: <Users size={20} />,
      permission: 'read:employees',
    },
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="logo">BuildMaster</h1>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              // In a real app, we would use actual permissions
              <li key={item.path} className="nav-item">
                <a 
                  href={item.path} 
                  onClick={(e) => {
                    e.preventDefault();
                    setLocation(item.path);
                  }}
                  className="nav-link"
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="nav-text">{item.title}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          )}
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </aside>
      
      <main className={`content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <header className="topbar">
          <div className="breadcrumb">
            {/* Breadcrumb could be implemented here */}
          </div>
          <div className="topbar-actions">
            {/* Actions like notifications, settings, etc */}
            <button className="icon-button">
              <Settings size={20} />
            </button>
          </div>
        </header>
        
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};