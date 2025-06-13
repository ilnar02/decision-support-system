import React, { useState } from 'react';
import { Warehouse, Search, MapPin, Package, TrendingUp, ArrowRight, Truck, ArrowUp, ArrowDown } from 'lucide-react';
import './Warehouses.css';

// Mock data for warehouses
const warehouseData = [
  {
    id: 1,
    name: 'Центральный распределительный центр',
    type: 'head',
    city: 'Москва',
    address: 'ул. Промышленная, 123',
    contact: 'Иванов Иван',
    phone: '(495) 123-4567',
    capacity: {
      total: 5000,
      used: 3750,
    },
    stats: {
      productCount: 850,
      incomingShipments: 12,
      outgoingShipments: 25,
    },
    recentActivity: [
      { id: 'Т-4321', type: 'Incoming', from: 'СтройПоставка', items: 12, date: '2025-05-20' },
      { id: 'Т-4320', type: 'Outgoing', to: 'Магазин Центральный', items: 35, date: '2025-05-19' },
      { id: 'Т-4319', type: 'Incoming', from: 'МеталлИндустрия', items: 8, date: '2025-05-18' },
    ],
    topProducts: [
      { id: 1, name: 'Цемент Портландский 50кг', quantity: 450 },
      { id: 2, name: 'Арматура 12мм', quantity: 320 },
      { id: 3, name: 'Труба ПВХ 100мм', quantity: 280 },
    ]
  },
  {
    id: 2,
    name: 'Западный региональный склад',
    type: 'head',
    city: 'Санкт-Петербург',
    address: 'пр. Индустриальный, 456',
    contact: 'Петрова Мария',
    phone: '(812) 765-4321',
    capacity: {
      total: 4000,
      used: 2800,
    },
    stats: {
      productCount: 720,
      incomingShipments: 8,
      outgoingShipments: 18,
    },
    recentActivity: [
      { id: 'Т-3210', type: 'Outgoing', to: 'Магазин на Невском', items: 25, date: '2025-05-20' },
      { id: 'Т-3209', type: 'Incoming', from: 'ЛесПром', items: 15, date: '2025-05-18' },
      { id: 'Т-3208', type: 'Outgoing', to: 'Магазин Приморский', items: 22, date: '2025-05-17' },
    ],
    topProducts: [
      { id: 4, name: 'Фанера строительная 18мм', quantity: 175 },
      { id: 5, name: 'Краска интерьерная белая', quantity: 150 },
      { id: 6, name: 'Плитка напольная Терракота', quantity: 125 },
    ]
  },
  {
    id: 3,
    name: 'Центральный локальный склад',
    type: 'local',
    city: 'Москва',
    address: 'ул. Складская, 789',
    contact: 'Сидоров Дмитрий',
    phone: '(495) 987-6543',
    capacity: {
      total: 1200,
      used: 950,
    },
    stats: {
      productCount: 320,
      incomingShipments: 5,
      outgoingShipments: 12,
    },
    recentActivity: [
      { id: 'Т-2109', type: 'Incoming', from: 'Центральный распределительный центр', items: 30, date: '2025-05-19' },
      { id: 'Т-2108', type: 'Outgoing', to: 'Магазин Восточный', items: 18, date: '2025-05-18' },
      { id: 'Т-2107', type: 'Outgoing', to: 'Магазин Западный', items: 15, date: '2025-05-17' },
    ],
    topProducts: [
      { id: 1, name: 'Цемент Портландский 50кг', quantity: 120 },
      { id: 7, name: 'Кабель электрический 2.5мм²', quantity: 85 },
      { id: 8, name: 'Ручки дверные - матовый никель', quantity: 75 },
    ]
  },
  {
    id: 4,
    name: 'Приморский локальный склад',
    type: 'local',
    city: 'Санкт-Петербург',
    address: 'ул. Приморская, 101',
    contact: 'Козлова Светлана',
    phone: '(812) 543-2109',
    capacity: {
      total: 800,
      used: 710,
    },
    stats: {
      productCount: 250,
      incomingShipments: 3,
      outgoingShipments: 8,
    },
    recentActivity: [
      { id: 'Т-1098', type: 'Incoming', from: 'Западный региональный склад', items: 22, date: '2025-05-20' },
      { id: 'Т-1097', type: 'Outgoing', to: 'Магазин на Невском', items: 14, date: '2025-05-19' },
      { id: 'Т-1096', type: 'Outgoing', to: 'Магазин на Московской', items: 10, date: '2025-05-18' },
    ],
    topProducts: [
      { id: 9, name: 'Плитка мраморная премиум', quantity: 65 },
      { id: 10, name: 'Сантехника премиум класса', quantity: 45 },
      { id: 11, name: 'Паркет дубовый', quantity: 40 },
    ]
  },
];

const Warehouses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(1); // Default to first warehouse
  
  // Filter warehouses based on search term
  const filteredWarehouses = warehouseData.filter(warehouse => {
    return warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           warehouse.city.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const selectedWarehouseData = selectedWarehouse
    ? warehouseData.find(w => w.id === selectedWarehouse)
    : null;

  return (
    <div className="warehouses-page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Склады и Хранение</h1>
          <p>Управляйте своими распределительными центрами и местными складами</p>
        </div>
        <button className="btn btn-primary">
          <Warehouse size={16} />
          <span>Добавить Склад</span>
        </button>
      </div>
      
      <div className="warehouses-grid">
        <div className="warehouses-sidebar">
          <div className="search-box">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Поиск складов..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="warehouse-list">
            {filteredWarehouses.map((warehouse) => (
              <div 
                key={warehouse.id} 
                className={`warehouse-item ${selectedWarehouse === warehouse.id ? 'active' : ''}`}
                onClick={() => setSelectedWarehouse(warehouse.id)}
              >
                <div className="warehouse-icon">
                  <Warehouse size={20} />
                </div>
                <div className="warehouse-info">
                  <h3>{warehouse.name}</h3>
                  <div className="warehouse-meta">
                    <span className={`warehouse-type ${warehouse.type}`}>
                      {warehouse.type === 'head' ? 'Распределительный центр' : 'Локальный склад'}
                    </span>
                    <div className="warehouse-location">
                      <MapPin size={14} />
                      <span>{warehouse.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {selectedWarehouseData && (
          <div className="warehouse-details fade-in">
            <div className="warehouse-details-header">
              <div>
                <h2>{selectedWarehouseData.name}</h2>
                <div className="warehouse-location-full">
                  <MapPin size={16} />
                  <span>{selectedWarehouseData.address}, {selectedWarehouseData.city}</span>
                </div>
              </div>
              <div className="warehouse-contact">
                <p><strong>Контакт:</strong> {selectedWarehouseData.contact}</p>
                <p><strong>Телефон:</strong> {selectedWarehouseData.phone}</p>
              </div>
            </div>
            
            <div className="warehouse-stats">
              <div className="stat-card capacity">
                <h3>Использование вместимости</h3>
                <div className="capacity-bar-container">
                  <div 
                    className="capacity-bar" 
                    style={{ width: `${(selectedWarehouseData.capacity.used / selectedWarehouseData.capacity.total) * 100}%` }}
                  >
                    {Math.round((selectedWarehouseData.capacity.used / selectedWarehouseData.capacity.total) * 100)}%
                  </div>
                </div>
                <div className="capacity-details">
                  <span>{selectedWarehouseData.capacity.used} / {selectedWarehouseData.capacity.total} м³ использовано</span>
                  <span>{selectedWarehouseData.capacity.total - selectedWarehouseData.capacity.used} м³ доступно</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <Package size={24} />
                </div>
                <div className="stat-content">
                  <h3>Товары</h3>
                  <p className="stat-value">{selectedWarehouseData.stats.productCount}</p>
                  <p className="stat-description">Уникальных товаров</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <Truck size={24} className="incoming" />
                </div>
                <div className="stat-content">
                  <h3>Входящие</h3>
                  <p className="stat-value">{selectedWarehouseData.stats.incomingShipments}</p>
                  <p className="stat-description">Ожидающие поставки</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <Truck size={24} className="outgoing" />
                </div>
                <div className="stat-content">
                  <h3>Исходящие</h3>
                  <p className="stat-value">{selectedWarehouseData.stats.outgoingShipments}</p>
                  <p className="stat-description">Поставки в обработке</p>
                </div>
              </div>
            </div>
            
            <div className="warehouse-data-grid">
              <div className="card recent-activity">
                <div className="card-header">
                  <h3 className="card-title">Последние операции</h3>
                  <a href="#" className="btn btn-sm btn-secondary">Показать все</a>
                </div>
                <div className="activity-list">
                  {selectedWarehouseData.recentActivity.map((activity, index) => (
                    <div className="activity-item" key={index}>
                      <div className={`activity-icon ${activity.type.toLowerCase()}`}>
                        {activity.type === 'Incoming' ? (
                          <ArrowDown size={16} />
                        ) : (
                          <ArrowUp size={16} />
                        )}
                      </div>
                      <div className="activity-details">
                        <div className="activity-header">
                          <h4>{activity.id}: {activity.type === 'Incoming' ? 'Входящая' : 'Исходящая'} поставка</h4>
                          <span className="activity-date">{activity.date}</span>
                        </div>
                        <p className="activity-description">
                          {activity.type === 'Incoming' ? 'От: ' : 'Кому: '}
                          <strong>{activity.type === 'Incoming' ? activity.from : activity.to}</strong>
                          {' • '}{activity.items} позиций
                        </p>
                      </div>
                      <a href="#" className="activity-link">
                        <ArrowRight size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="card top-products">
                <div className="card-header">
                  <h3 className="card-title">Популярные товары</h3>
                  <a href="#" className="btn btn-sm btn-secondary">Показать все</a>
                </div>
                <div className="product-list">
                  {selectedWarehouseData.topProducts.map((product, index) => (
                    <div className="product-item" key={index}>
                      <div className="product-rank">{index + 1}</div>
                      <div className="product-details">
                        <h4>{product.name}</h4>
                        <p>{product.quantity} единиц на складе</p>
                      </div>
                      <a href="#" className="product-link">
                        <ArrowRight size={16} />
                      </a>
                    </div>
                  ))}
                </div>
                <div className="inventory-actions">
                  <button className="btn btn-primary">
                    <TrendingUp size={16} />
                    Анализ запасов
                  </button>
                  <button className="btn btn-secondary">
                    <Package size={16} />
                    Инвентаризация
                  </button>
                </div>
              </div>
            </div>
            
            <div className="warehouse-actions">
              <button className="btn btn-primary">Создать перемещение</button>
              <button className="btn btn-secondary">Запланировать доставку</button>
              <button className="btn btn-secondary">Сформировать отчет</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Warehouses;