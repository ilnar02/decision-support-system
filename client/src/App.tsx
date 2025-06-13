import React from 'react';
import { Router, Route, Switch, useLocation } from 'wouter';
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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  if (!user) {
    setLocation('/login');
    return null;
  }
  return <>{children}</>;
};

const AppContent = () => {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/products">
        <ProtectedRoute>
          <Layout>
            <Products />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/warehouses">
        <ProtectedRoute>
          <Layout>
            <Warehouses />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/stores">
        <ProtectedRoute>
          <Layout>
            <Stores />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/suppliers">
        <ProtectedRoute>
          <Layout>
            <Suppliers />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute>
          <Layout>
            <Transactions />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/employees">
        <ProtectedRoute>
          <Layout>
            <Employees />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;