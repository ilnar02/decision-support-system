import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Warehouses from './pages/Warehouses';
import Stores from './pages/Stores';
import Suppliers from './pages/Suppliers';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products/*" element={<Products />} />
            <Route path="warehouses/*" element={<Warehouses />} />
            <Route path="stores/*" element={<Stores />} />
            <Route path="suppliers/*" element={<Suppliers />} />
            <Route path="transactions/*" element={<Transactions />} />
            <Route path="reports/*" element={<Reports />} />
            <Route path="employees/*" element={<Employees />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;