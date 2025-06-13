import React, { useState } from 'react';
import { 
  Truck, Search, Filter, Star, Phone, Mail, MapPin, 
  Package, Clock, DollarSign, BarChart3, FileText, 
  Send, ExternalLink
} from 'lucide-react';
import './Suppliers.css';

// Mock data for suppliers
const suppliersData = [
  {
    id: 1,
    name: 'СтройПоставка',
    category: 'Общие строительные материалы',
    rating: 4.8,
    stats: {
      activeProducts: 245,
      deliveryTime: '2-3 дня',
      totalOrders: 1250,
      returnRate: '0.8%',
    },
    contact: {
      phone: '+7 (495) 123-4567',
      email: 'orders@stroypostavka.ru',
      address: 'ул. Промышленная, 123, Москва',
    },
    details: {
      contacts: [
        { name: 'Роберт Смирнов', role: 'Менеджер по работе с клиентами', avatar: 'РС' },
        { name: 'Светлана Иванова', role: 'Представитель по продажам', avatar: 'СИ' },
      ],
      delivery: {
        minimumOrder: '50 000 ₽',
        deliveryArea: 'Московский регион',
        paymentTerms: 'Отсрочка 30 дней',
        shippingMethod: 'Собственный автопарк',
      },
      categories: [
        'Цемент и бетон',
        'Сталь и металлы',
        'Пиломатериалы',
        'Крепежные изделия',
      ],
    },
  },
  {
    id: 2,
    name: 'МеталлПром',
    category: 'Металлопрокат',
    rating: 4.6,
    stats: {
      activeProducts: 128,
      deliveryTime: '3-5 дней',
      totalOrders: 890,
      returnRate: '0.5%',
    },
    contact: {
      phone: '+7 (812) 123-4567',
      email: 'sales@metallprom.ru',
      address: 'ул. Металлургов, 456, Санкт-Петербург',
    },
    details: {
      contacts: [
        { name: 'Михаил Чернов', role: 'Директор по продажам', avatar: 'МЧ' },
        { name: 'Елена Белова', role: 'Технический специалист', avatar: 'ЕБ' },
      ],
      delivery: {
        minimumOrder: '100 000 ₽',
        deliveryArea: 'По всей России',
        paymentTerms: 'Отсрочка 45 дней',
        shippingMethod: 'Контрактные перевозчики',
      },
      categories: [
        'Конструкционная сталь',
        'Арматура',
        'Металлические листы',
        'Стальные трубы',
      ],
    },
  },
  {
    id: 3,
    name: 'ЛесоТрейд',
    category: 'Пиломатериалы',
    rating: 4.7,
    stats: {
      activeProducts: 165,
      deliveryTime: '4-6 дней',
      totalOrders: 720,
      returnRate: '1.2%',
    },
    contact: {
      phone: '+7 (495) 765-4321',
      email: 'orders@lesotrade.ru',
      address: 'ул. Лесная, 789, Москва',
    },
    details: {
      contacts: [
        { name: 'Дмитрий Волков', role: 'Операционный менеджер', avatar: 'ДВ' },
        { name: 'Людмила Андреева', role: 'Менеджер по работе с клиентами', avatar: 'ЛА' },
      ],
      delivery: {
        minimumOrder: '75 000 ₽',
        deliveryArea: 'Центральный регион',
        paymentTerms: 'Отсрочка 30 дней',
        shippingMethod: 'Партнерская логистика',
      },
      categories: [
        'Твердые породы дерева',
        'Фанера',
        'Пиломатериалы',
        'Древесные панели',
      ],
    },
  },
];

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);

  const categories = [
    'Все категории',
    'Общие строительные материалы',
    'Металлопрокат',
    'Пиломатериалы',
    'Электротовары',
    'Сантехника',
  ];

  const filteredSuppliers = suppliersData.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Все категории' || supplier.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedSupplierData = selectedSupplier
    ? suppliersData.find(s => s.id === selectedSupplier)
    : null;

  return (
    <div className="suppliers-page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Поставщики</h1>
          <p>Управление отношениями с поставщиками и заказами</p>
        </div>
        <button className="btn btn-primary">
          <Truck size={16} />
          <span>Добавить поставщика</span>
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Поиск поставщиков..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="suppliers-container">
        <div className="suppliers-list">
          {filteredSuppliers.map(supplier => (
            <div 
              key={supplier.id} 
              className="supplier-card"
              onClick={() => setSelectedSupplier(supplier.id)}
            >
              <div className="supplier-header">
                <div className="supplier-info">
                  <div className="supplier-logo">
                    <Truck size={24} />
                  </div>
                  <div className="supplier-name">
                    <h3>{supplier.name}</h3>
                    <div className="supplier-category">{supplier.category}</div>
                  </div>
                </div>
                <div className="supplier-rating">
                  <Star size={16} />
                  <span>{supplier.rating}</span>
                </div>
              </div>

              <div className="supplier-content">
                <div className="supplier-stats">
                  <div className="stat-box">
                    <h4>Активные товары</h4>
                    <p>{supplier.stats.activeProducts}</p>
                  </div>
                  <div className="stat-box">
                    <h4>Время доставки</h4>
                    <p>{supplier.stats.deliveryTime}</p>
                  </div>
                  <div className="stat-box">
                    <h4>Всего заказов</h4>
                    <p>{supplier.stats.totalOrders}</p>
                  </div>
                  <div className="stat-box">
                    <h4>Процент возвратов</h4>
                    <p>{supplier.stats.returnRate}</p>
                  </div>
                </div>

                <div className="supplier-contact">
                  <div className="contact-item">
                    <Phone size={16} />
                    <span>{supplier.contact.phone}</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={16} />
                    <span>{supplier.contact.email}</span>
                  </div>
                  <div className="contact-item">
                    <MapPin size={16} />
                    <span>{supplier.contact.address}</span>
                  </div>
                </div>

                <div className="supplier-actions">
                  <button className="btn btn-secondary">
                    <Package size={16} />
                    <span>Товары</span>
                  </button>
                  <button className="btn btn-secondary">
                    <Clock size={16} />
                    <span>История заказов</span>
                  </button>
                  <button className="btn btn-primary">
                    <Send size={16} />
                    <span>Разместить заказ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedSupplierData && (
          <div className="supplier-details">
            <div className="details-header">
              <h2>Детали поставщика</h2>
              <p>{selectedSupplierData.category}</p>
            </div>

            <div className="details-content">
              <div className="details-section">
                <h3>Контактные лица</h3>
                <div className="contact-list">
                  {selectedSupplierData.details.contacts.map((contact, index) => (
                    <div key={index} className="contact-person">
                      <div className="contact-avatar">{contact.avatar}</div>
                      <div className="contact-details">
                        <h4>{contact.name}</h4>
                        <p>{contact.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="details-section">
                <h3>Информация о доставке</h3>
                <div className="delivery-info">
                  {Object.entries(selectedSupplierData.details.delivery).map(([key, value]) => (
                    <div key={key} className="delivery-item">
                      <span className="delivery-label">
                        {key === 'minimumOrder' ? 'Минимальный заказ' :
                         key === 'deliveryArea' ? 'Зона доставки' :
                         key === 'paymentTerms' ? 'Условия оплаты' :
                         key === 'shippingMethod' ? 'Способ доставки' :
                         key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className="delivery-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="details-section">
                <h3>Категории продукции</h3>
                <div className="product-categories">
                  {selectedSupplierData.details.categories.map((category, index) => (
                    <span key={index} className="category-tag">{category}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;