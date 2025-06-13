import React, { useState } from 'react';
import { Package, Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import './Products.css';

// Mock product data
const mockProducts = [
  { 
    id: 1, 
    name: 'Цемент Портландский', 
    category: 'Цемент и бетон', 
    sku: 'ЦП-001', 
    unit: 'мешок', 
    weight: '50кг',
    supplier: 'СтройПоставка',
    price: 450.00,
    stock: {
      total: 850,
      locations: [
        { name: 'Склад №1', quantity: 400 },
        { name: 'Склад №2', quantity: 200 },
        { name: 'Магазин №1', quantity: 100 },
        { name: 'Магазин №2', quantity: 150 },
      ]
    },
    minStock: 100,
    expiryDate: '2025-12-31',
    image: 'https://stroy-ekspert-ekologiya.ru/images/cement-powder-in-white-bag.jpg'
  },
  { 
    id: 2, 
    name: 'Арматура 12мм', 
    category: 'Металлопрокат', 
    sku: 'АРМ-012', 
    unit: 'метр', 
    weight: '12мм x 12м',
    supplier: 'МеталлИндустрия',
    price: 890.50,
    stock: {
      total: 400,
      locations: [
        { name: 'Склад №1', quantity: 300 },
        { name: 'Склад №2', quantity: 50 },
        { name: 'Магазин №3', quantity: 50 },
      ]
    },
    minStock: 50,
    expiryDate: null,
    image: 'https://st44.stpulscen.ru/images/product/486/384/900_original.png'
  },
  { 
    id: 3, 
    name: 'Плитка напольная Терракота', 
    category: 'Плитка и напольные покрытия', 
    sku: 'ПЛТ-ТЕРРА', 
    unit: 'упаковка', 
    weight: '15кг/уп.',
    supplier: 'КерамикаПлюс',
    price: 1250.75,
    stock: {
      total: 210,
      locations: [
        { name: 'Склад №3', quantity: 150 },
        { name: 'Магазин №1', quantity: 30 },
        { name: 'Магазин №4', quantity: 30 },
      ]
    },
    minStock: 40,
    expiryDate: null,
    image: 'https://sochi.kwadratura.ru/_mod_files/ce_images/eshop/generated/11133_d826bbade21470f47983b3b903bb05d1_540x443_pc.jpg'
  },
  { 
    id: 4, 
    name: 'Фанера строительная 18мм', 
    category: 'Пиломатериалы', 
    sku: 'ФАН-018', 
    unit: 'лист', 
    weight: '15кг/лист',
    supplier: 'ЛесПром',
    price: 890.95,
    stock: {
      total: 120,
      locations: [
        { name: 'Склад №2', quantity: 80 },
        { name: 'Магазин №2', quantity: 20 },
        { name: 'Магазин №5', quantity: 20 },
      ]
    },
    minStock: 30,
    expiryDate: null,
    image: 'https://stkperspektiva.ru/uploadedFiles/eshopimages/big/fanera-nekond_12.jpg'
  },
  { 
    id: 5, 
    name: 'Труба ПВХ 100мм', 
    category: 'Сантехника', 
    sku: 'ПВХ-100', 
    unit: 'метр', 
    weight: '3кг/м',
    supplier: 'СантехСнаб',
    price: 345.45,
    stock: {
      total: 350,
      locations: [
        { name: 'Склад №1', quantity: 200 },
        { name: 'Магазин №3', quantity: 100 },
        { name: 'Магазин №6', quantity: 50 },
      ]
    },
    minStock: 80,
    expiryDate: null,
    image: 'https://st34.stpulscen.ru/images/product/465/479/805_original.jpeg'
  },
  { 
    id: 6, 
    name: 'Краска интерьерная белая', 
    category: 'Краски и покрытия', 
    sku: 'КРБ-20Л', 
    unit: 'ведро', 
    weight: '20л',
    supplier: 'КраскиПро',
    price: 1590.00,
    stock: {
      total: 85,
      locations: [
        { name: 'Склад №3', quantity: 50 },
        { name: 'Магазин №1', quantity: 15 },
        { name: 'Магазин №4', quantity: 20 },
      ]
    },
    minStock: 25,
    expiryDate: '2025-10-15',
    image: 'https://stroimaks.ru/wa-data/public/shop/products/36/64/16436/images/24181/24181.970.jpg'
  },
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  
  const itemsPerPage = 5;
  
  // Mock categories
  const categories = [
    'Все категории',
    'Цемент и бетон',
    'Металлопрокат',
    'Плитка и напольные покрытия',
    'Пиломатериалы',
    'Сантехника',
    'Краски и покрытия',
    'Инструменты',
    'Электротовары',
    'Крепеж и фурнитура'
  ];
  
  // Filter products based on search term and category
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'Все категории' || 
                            product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle product selection for details view
  const handleProductSelect = (productId: number) => {
    setSelectedProduct(productId === selectedProduct ? null : productId);
  };
  
  const selectedProductData = selectedProduct 
    ? mockProducts.find(p => p.id === selectedProduct) 
    : null;

  return (
    <div className="products-page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Товары</h1>
          <p>Управление товарными запасами во всех локациях</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          <span>Добавить товар</span>
        </button>
      </div>
      
      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Поиск по названию или артикулу..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="category-filter">
          <Filter size={20} />
          <select 
            className="form-select category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="products-container">
        <div className="products-list">
          <div className="table-container">
            <table className="table products-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Артикул</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Запас</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`product-row ${selectedProduct === product.id ? 'selected' : ''}`}
                    onClick={() => handleProductSelect(product.id)}
                  >
                    <td className="product-cell">
                      <div className="product-info">
                        <div className="product-image">
                          {product.image ? (
                            <img src={product.image} alt={product.name} />
                          ) : (
                            <Package size={24} />
                          )}
                        </div>
                        <span className="product-name">{product.name}</span>
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>
                      <span className="badge badge-primary">{product.category}</span>
                    </td>
                    <td>₽{product.price.toFixed(2)}</td>
                    <td>
                      <div className="stock-indicator">
                        <div 
                          className={`stock-bar ${
                            product.stock.total <= product.minStock 
                              ? 'low' 
                              : product.stock.total <= product.minStock * 2 
                                ? 'medium' 
                                : 'good'
                          }`}
                          style={{ width: `${Math.min(100, (product.stock.total / (product.minStock * 3)) * 100)}%` }}
                        ></div>
                        <span className="stock-text">{product.stock.total} {product.unit}s</span>
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="icon-button" onClick={(e) => e.stopPropagation()}>
                          <Edit size={16} />
                        </button>
                        <button className="icon-button danger" onClick={(e) => e.stopPropagation()}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="pagination">
            <button 
              className="pagination-button" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
              Предыдущая
            </button>
            
            <div className="pagination-info">
              Страница {currentPage} из {totalPages}
            </div>
            
            <button 
              className="pagination-button" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Следующая
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {selectedProductData && (
          <div className="product-details slide-in">
            <div className="product-details-header">
              <h2>{selectedProductData.name}</h2>
              <p className="product-sku">Артикул: {selectedProductData.sku}</p>
            </div>
            
            <div className="product-image-large">
              {selectedProductData.image ? (
                <img src={selectedProductData.image} alt={selectedProductData.name} />
              ) : (
                <div className="placeholder-image">
                  <Package size={48} />
                </div>
              )}
            </div>
            
            <div className="product-attributes">
              <div className="attribute">
                <span className="attribute-label">Категория</span>
                <span className="attribute-value">{selectedProductData.category}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Единица измерения</span>
                <span className="attribute-value">{selectedProductData.unit}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Вес/Размер</span>
                <span className="attribute-value">{selectedProductData.weight}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Цена</span>
                <span className="attribute-value">₽{selectedProductData.price.toFixed(2)}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Поставщик</span>
                <span className="attribute-value">{selectedProductData.supplier}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Минимальный запас</span>
                <span className="attribute-value">{selectedProductData.minStock} {selectedProductData.unit}</span>
              </div>
              
              {selectedProductData.expiryDate && (
                <div className="attribute">
                  <span className="attribute-label">Срок годности</span>
                  <span className="attribute-value">{selectedProductData.expiryDate}</span>
                </div>
              )}
            </div>
            
            <div className="stock-distribution">
              <h3>Распределение по складам</h3>
              <div className="location-stocks">
                {selectedProductData.stock.locations.map((location, index) => (
                  <div className="location-stock" key={index}>
                    <div className="location-info">
                      <span className="location-name">{location.name}</span>
                      <span className="location-quantity">{location.quantity} {selectedProductData.unit}</span>
                    </div>
                    <div className="location-stock-bar-container">
                      <div 
                        className="location-stock-bar"
                        style={{ width: `${(location.quantity / selectedProductData.stock.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="product-actions">
              <button className="btn btn-secondary">
                <Edit size={16} />
                Редактировать товар
              </button>
              <button className="btn btn-primary">
                Переместить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;