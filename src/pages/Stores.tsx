import React, { useState } from 'react';
import { Store, MapPin, Search, Filter, ExternalLink, BarChart3, Users } from 'lucide-react';
import './Stores.css';

// Mock data for stores
const storesData = [
  {
    id: 1,
    name: 'Центральный магазин',
    region: 'Москва',
    address: 'ул. Ленина, д. 15',
    type: 'Флагман',
    stats: {
      monthlyRevenue: 285000,
      activeCustomers: 1250,
    },
    manager: {
      name: 'Иванов Иван',
      title: 'Управляющий магазином',
      avatar: 'ИИ',
    },
    warehouse: 'Центральный склад', 
  },
  {
    id: 2,
    name: 'Западный магазин',
    region: 'Москва',
    address: 'Невский проспект, д. 28',
    type: 'Стандарт',
    stats: {
      monthlyRevenue: 195000,
      activeCustomers: 850,
    },
    manager: {
      name: 'Андреев Андрей',
      title: 'Управляющий магазином',
      avatar: 'АА',
    },
    warehouse: 'Западный склад',
  },
  {
    id: 3,
    name: 'Восточный магазин',
    region: 'Казань',
    address: 'ул. Малышева, д. 56',
    type: 'Премиум',
    stats: {
      monthlyRevenue: 425000,
      activeCustomers: 980,
    },
    manager: {
      name: 'Литвинов Андрей',
      title: 'Управляющий магазином',
      avatar: 'ЛА',
    },
    warehouse: 'Восточный склад',
  },
  {
    id: 4,
    name: 'Восточный магазин',
    region: 'Казань',
    address: 'ул. Баумана, д. 33',
    type: 'Стандарт',
    stats: {
      monthlyRevenue: 175000,
      activeCustomers: 720,
    },
    manager: {
      name: 'Власов Андрей',
      title: 'Управляющий магазином',
      avatar: 'ВА',
    },
    warehouse: 'Восточный склад',
  },
  {
    id: 5,
    name: 'Восточный магазин',
    region: 'Москва',
    address: 'Красный проспект, д. 72',
    type: 'Стандарт',
    stats: {
      monthlyRevenue: 165000,
      activeCustomers: 690,
    },
    manager: {
      name: 'Данилов Дмитрий',
      title: 'Управляющий магазином',
      avatar: 'ДД',
    },
    warehouse: 'Восточный склад',
  },
  {
    id: 6,
    name: 'Восточный магазин',
    region: 'Казань',
    address: 'ул. Красная, д. 120',
    type: 'Премиум',
    stats: {
      monthlyRevenue: 315000,
      activeCustomers: 890,
    },
    manager: {
      name: 'Лазарев Александр',
      title: 'Управляющий магазином',
      avatar: 'ЛА',
    },
    warehouse: 'Центральный склад',
  },
];

const Stores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Все регионы');

  const regions = ['Все регионы', 'Москва', 'Казань'];

  const filteredStores = storesData.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'Все регионы' || store.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="stores-page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Магазины</h1>
          <p>Управление розничными точками и операциями магазинов</p>
        </div>
        <button className="btn btn-primary">
          <Store size={16} />
          <span>Добавить магазин</span>
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Поиск магазинов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="region-filter">
          <select
            className="form-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stores-grid">
        {filteredStores.map(store => (
          <div key={store.id} className="store-card">
            <div className="store-header">
              <div className="store-title">
                <h3>{store.name}</h3>
                <span className="store-badge">{store.type}</span>
              </div>
              <div className="store-location">
                <MapPin size={16} />
                <span>{store.address}</span>
              </div>
            </div>

            <div className="store-stats">
              <div className="stat-item">
                <div className="stat-value">₽{(store.stats.monthlyRevenue / 100).toFixed(1)}k</div>
                <div className="stat-label">Monthly Revenue</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{store.stats.activeCustomers}</div>
                <div className="stat-label">Active Customers</div>
              </div>
            </div>

            <div className="store-footer">
              <div className="store-manager">
                <div className="manager-avatar">
                  {store.manager.avatar}
                </div>
                <div className="manager-info">
                  <div className="manager-name">{store.manager.name}</div>
                  <div className="manager-title">{store.manager.title}</div>
                </div>
              </div>
              <div className="store-actions">
                <button className="btn btn-sm btn-secondary">
                  <BarChart3 size={14} />
                </button>
                <button className="btn btn-sm btn-secondary">
                  <Users size={14} />
                </button>
                <button className="btn btn-sm btn-primary">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stores;