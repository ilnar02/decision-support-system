import React, { useState } from 'react';
import { BarChart3, PackageOpen, AlertTriangle, TrendingUp, ArrowDown, ArrowUp, Package, Truck, ShoppingCart, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<'revenue' | 'quantity'>('revenue');

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
    queryFn: () => apiRequest('/api/analytics/dashboard')
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => apiRequest('/api/transactions')
  });

  if (analyticsLoading) {
    return (
      <div className="dashboard fade-in">
        <div className="dashboard-header">
          <h1>Главная панель</h1>
          <p>Загрузка аналитики...</p>
        </div>
        <div className="stats-cards">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card animate-pulse">
              <div className="stat-icon bg-gray-200"></div>
              <div className="stat-content">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentTransactions = transactions
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((transaction: any) => ({
      id: `T-${transaction.id}`,
      type: transaction.type === 'sale' ? 'Продажа' : 
            transaction.type === 'incoming' ? 'Поступление' : 
            transaction.type === 'delivery' ? 'Доставка' : 'Перемещение',
      location: transaction.notes || 'Транзакция',
      amount: 0, // Will be calculated from transaction items
      date: new Date(transaction.createdAt).toLocaleDateString('ru-RU')
    }));

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>Главная панель</h1>
        <p>Обзор системы управления складом</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>Всего товаров</h3>
            <p className="stat-value">{analytics?.totalProducts || 0}</p>
            <p className="stat-description">Наименований в каталоге</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Недостаточно запасов</h3>
            <p className="stat-value">{analytics?.lowStockCount || 0}</p>
            <p className="stat-description">Ниже минимального уровня</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <PackageOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Нет в наличии</h3>
            <p className="stat-value">{analytics?.outOfStockCount || 0}</p>
            <p className="stat-description">Товары закончились</p>
          </div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Товаров в норме</h3>
            <p className="stat-value">
              {(analytics?.totalProducts || 0) - (analytics?.lowStockCount || 0) - (analytics?.outOfStockCount || 0)}
            </p>
            <p className="stat-description">Достаточные запасы</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card sales-chart">
          <div className="card-header">
            <h2 className="card-title">Динамика продаж за 6 месяцев</h2>
            <div className="card-actions">
              <select 
                className="form-select"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'revenue' | 'quantity')}
              >
                <option value="revenue">По выручке (₽)</option>
                <option value="quantity">По количеству (шт)</option>
              </select>
            </div>
          </div>
          <div className="chart-container" style={{ height: '350px', padding: '20px' }}>
            {analytics?.salesData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [
                      chartType === 'revenue' 
                        ? `₽${value.toLocaleString()}` 
                        : `${value.toLocaleString()} шт`,
                      chartType === 'revenue' ? 'Выручка' : 'Количество'
                    ]}
                  />
                  <Bar 
                    dataKey={chartType} 
                    fill={chartType === 'revenue' ? '#3b82f6' : '#10b981'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Нет данных о продажах
              </div>
            )}
          </div>
        </div>

        <div className="card sales-summary">
          <div className="card-header">
            <h2 className="card-title">Сводка за последний месяц</h2>
          </div>
          <div className="summary-stats">
            {analytics?.salesData && analytics.salesData.length > 0 ? (
              <>
                <div className="summary-item">
                  <div className="summary-icon">
                    <TrendingUp size={20} />
                  </div>
                  <div className="summary-content">
                    <h3>Выручка</h3>
                    <p className="summary-value">
                      ₽{analytics.salesData[analytics.salesData.length - 1]?.revenue?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-icon">
                    <Package size={20} />
                  </div>
                  <div className="summary-content">
                    <h3>Продано товаров</h3>
                    <p className="summary-value">
                      {analytics.salesData[analytics.salesData.length - 1]?.quantity?.toLocaleString() || '0'} шт
                    </p>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-icon">
                    <BarChart3 size={20} />
                  </div>
                  <div className="summary-content">
                    <h3>Общая выручка за 6 мес</h3>
                    <p className="summary-value">
                      ₽{analytics.salesData.reduce((sum: number, month: any) => sum + (month.revenue || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Нет данных о продажах
              </div>
            )}
          </div>
        </div>

        <div className="card recent-transactions">
          <div className="card-header">
            <h2 className="card-title">Недавние транзакции</h2>
          </div>
          <div className="table-container">
            {transactionsLoading ? (
              <div className="animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Тип</th>
                    <th>Описание</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction: any) => (
                    <tr key={transaction.id}>
                      <td>{transaction.id}</td>
                      <td>
                        <span className={`badge badge-${
                          transaction.type === 'Продажа' ? 'success' : 
                          transaction.type === 'Поступление' ? 'primary' : 'warning'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td>{transaction.location}</td>
                      <td>{transaction.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Нет транзакций
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default Dashboard;