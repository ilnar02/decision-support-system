import React from 'react';
import { BarChart3, PackageOpen, AlertTriangle, TrendingUp, ArrowDown, ArrowUp, Package, Truck, ShoppingCart } from 'lucide-react';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';

// Mock data for the dashboard
const inventoryStats = {
  totalProducts: 1458,
  lowStock: 32,
  outOfStock: 8,
  pendingOrders: 17,
};

const salesData = [
  { month: 'Янв', amount: 120000 },
  { month: 'Фев', amount: 140000 },
  { month: 'Мар', amount: 160000 },
  { month: 'Апр', amount: 180000 },
  { month: 'Май', amount: 200000 },
  { month: 'Июн', amount: 220000 },
];

const popularProducts = [
  { id: 1, name: 'Цемент Портланд 50кг', sales: 1250, change: 12 },
  { id: 2, name: 'Арматура 12мм', sales: 980, change: -5 },
  { id: 3, name: 'Блоки бетонные 6"', sales: 850, change: 8 },
  { id: 4, name: 'Брус 50x100 3м', sales: 750, change: 15 },
  { id: 5, name: 'Трубы ПВХ 110мм', sales: 680, change: 3 },
];

const recentTransactions = [
  { id: 'T-1234', type: 'Продажа', location: 'Магазин №3', amount: 4850, date: '2025-05-20' },
  { id: 'T-1233', type: 'Перемещение', location: 'Склад №1 → Магазин №2', amount: 0, date: '2025-05-19' },
  { id: 'T-1232', type: 'Закупка', location: 'Склад №1', amount: 12500, date: '2025-05-18' },
  { id: 'T-1231', type: 'Продажа', location: 'Магазин №1', amount: 7320, date: '2025-05-17' },
];

const lowStockAlerts = [
  { id: 1, name: 'Цемент Портланд 50кг', location: 'Магазин №2', stock: 5, threshold: 10 },
  { id: 2, name: 'Арматура 10мм', location: 'Склад №1', stock: 12, threshold: 20 },
  { id: 3, name: 'Краска белая 10л', location: 'Магазин №3', stock: 3, threshold: 8 },
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>Панель управления</h1>
        <p>Обзор вашего бизнеса</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>Всего товаров</h3>
            <p className="stat-value">{inventoryStats.totalProducts}</p>
            <p className="stat-description">По всем локациям</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Заканчивается</h3>
            <p className="stat-value">{inventoryStats.lowStock}</p>
            <p className="stat-description">Требуют внимания</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <PackageOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Нет в наличии</h3>
            <p className="stat-value">{inventoryStats.outOfStock}</p>
            <p className="stat-description">Срочное пополнение</p>
          </div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">
            <Truck size={24} />
          </div>
          <div className="stat-content">
            <h3>Ожидают поставки</h3>
            <p className="stat-value">{inventoryStats.pendingOrders}</p>
            <p className="stat-description">От поставщиков</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card sales-chart">
          <div className="card-header">
            <h2 className="card-title">Динамика продаж</h2>
            <div className="card-actions">
              <select className="form-select">
                <option>Последние 6 месяцев</option>
                <option>Этот год</option>
                <option>Прошлый год</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            <div className="mock-chart">
              <div className="chart-label">Продажи (₽)</div>
              <div className="chart-bars">
                {salesData.map((data, index) => (
                  <div className="chart-bar-container" key={index}>
                    <div 
                      className="chart-bar" 
                      style={{ height: `${(data.amount / 220000) * 100}%` }}
                    ></div>
                    <div className="chart-bar-label">{data.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card popular-products">
          <div className="card-header">
            <h2 className="card-title">Популярные товары</h2>
            <a href="/reports/sales" className="btn btn-sm btn-secondary">Показать все</a>
          </div>
          <div className="product-list">
            {popularProducts.map((product) => (
              <div className="product-item" key={product.id}>
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p>{product.sales} шт. продано</p>
                </div>
                <div className={`product-change ${product.change >= 0 ? 'positive' : 'negative'}`}>
                  {product.change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(product.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card recent-transactions">
          <div className="card-header">
            <h2 className="card-title">Недавние транзакции</h2>
            <a href="/transactions" className="btn btn-sm btn-secondary">Показать все</a>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Тип</th>
                  <th>Локация</th>
                  <th>Сумма</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>
                    <td>
                      <span className={`badge badge-${transaction.type === 'Продажа' ? 'success' : transaction.type === 'Закупка' ? 'primary' : 'warning'}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td>{transaction.location}</td>
                    <td>
                      {transaction.type === 'Перемещение' ? (
                        '—'
                      ) : (
                        `₽${transaction.amount.toLocaleString()}`
                      )}
                    </td>
                    <td>{transaction.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card alerts">
          <div className="card-header">
            <h2 className="card-title">Оповещения о запасах</h2>
            <a href="/reports/inventory" className="btn btn-sm btn-secondary">Показать все</a>
          </div>
          <div className="alerts-list">
            {lowStockAlerts.map((alert) => (
              <div className="alert-item" key={alert.id}>
                <div className="alert-icon">
                  <AlertTriangle size={20} />
                </div>
                <div className="alert-details">
                  <h3>{alert.name}</h3>
                  <p>
                    <span className="alert-location">{alert.location}</span>
                    <span className="alert-stock">
                      Остаток: <strong>{alert.stock}</strong> / {alert.threshold}
                    </span>
                  </p>
                </div>
                <a href={`/products/restock/${alert.id}`} className="btn btn-sm btn-warning">
                  Пополнить
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;