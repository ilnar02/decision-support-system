import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Warehouse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Неверный email или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login accounts
  const demoAccounts = [
    { role: 'Администратор', email: 'admin@example.com', password: 'password' },
    { role: 'Менеджер', email: 'manager@example.com', password: 'password' },
    { role: 'Кладовщик', email: 'storekeeper@example.com', password: 'password' },
    { role: 'Кассир', email: 'cashier@example.com', password: 'password' },
  ];

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-header">
          <div className="login-logo">
            <Warehouse size={32} />
            <h1>СтройМастер</h1>
          </div>
          <p className="login-subtitle">Система управления строительными материалами</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Введите ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Демо-аккаунты</h3>
          <div className="demo-accounts-list">
            {demoAccounts.map((account) => (
              <div 
                key={account.email} 
                className="demo-account-item"
                onClick={() => handleDemoLogin(account.email, account.password)}
              >
                <span className="demo-account-role">{account.role}</span>
                <span className="demo-account-email">{account.email}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-image">
        <div className="login-overlay">
          <h2>Оптимизируйте ваш строительный бизнес</h2>
          <ul>
            <li>Управление запасами во всех локациях</li>
            <li>Отслеживание запасов и оповещения в реальном времени</li>
            <li>Управление поставщиками и заказами</li>
            <li>Отслеживание продаж и отчетность</li>
            <li>Управление сотрудниками с ролевым доступом</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;