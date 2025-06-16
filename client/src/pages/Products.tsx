import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertProductSchema, type Product, type Category } from '@shared/schema';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import './Products.css';

type ProductWithRelations = Product & {
  category?: Category;
  totalStock?: number;
};

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithRelations[]>({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products')
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories')
  });

  // Fetch warehouses for distribution display
  const { data: warehouses = [] } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiRequest('/api/warehouses')
  });

  // Get inventory for selected product
  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ['/api/inventory', selectedProduct],
    queryFn: () => apiRequest(`/api/inventory/${selectedProduct}`),
    enabled: !!selectedProduct
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddModalOpen(false);
      toast({ title: 'Товар добавлен успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при добавлении товара', variant: 'destructive' });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsEditModalOpen(false);
      setEditingProduct(null);
      toast({ title: 'Товар обновлен успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при обновлении товара', variant: 'destructive' });
    }
  });

  // Delete product mutation (disabled - products used in transaction history)
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => Promise.resolve(), // No actual deletion
    onSuccess: () => {
      toast({ 
        title: 'Удаление товара недоступно', 
        description: 'Товары нельзя удалять, так как они используются в истории транзакций',
        variant: 'destructive' 
      });
    },
    onError: () => {
      toast({ title: 'Удаление товара недоступно', variant: 'destructive' });
    }
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'all' || 
                            product.categoryId?.toString() === selectedCategory;
    
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
    ? products.find(p => p.id === selectedProduct) 
    : null;

  const handleEditProduct = (product: ProductWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  return (
    <div className="products-page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Товары</h1>
          <p>Управление товарными запасами во всех локациях</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
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
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
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
                {productsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      Загрузка товаров...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      Товары не найдены
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
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
                        <span className="badge badge-primary">
                          {categories.find(c => c.id === product.categoryId)?.name || 'Без категории'}
                        </span>
                      </td>
                      <td>₽{parseFloat(product.price.toString()).toFixed(2)}</td>
                      <td>
                        <div className="stock-indicator">
                          <div 
                            className={`stock-bar ${
                              (product.totalStock || 0) <= (product.minStock || 0)
                                ? 'low' 
                                : (product.totalStock || 0) <= ((product.minStock || 0) * 2)
                                  ? 'medium' 
                                  : 'good'
                            }`}
                            style={{ width: `${Math.min(100, ((product.totalStock || 0) / ((product.minStock || 1) * 3)) * 100)}%` }}
                          ></div>
                          <span className="stock-text">{product.totalStock || 0} {product.unit}</span>
                        </div>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="icon-button" onClick={(e) => handleEditProduct(product, e)}>
                            <Edit size={16} />
                          </button>
                          <button className="icon-button danger" onClick={(e) => handleDeleteProduct(product.id, e)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                <span className="attribute-value">
                  {categories.find(c => c.id === selectedProductData.categoryId)?.name || 'Без категории'}
                </span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Единица измерения</span>
                <span className="attribute-value">{selectedProductData.unit}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Вес/Размер</span>
                <span className="attribute-value">{selectedProductData.weight || 'Не указано'}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Цена</span>
                <span className="attribute-value">₽{parseFloat(selectedProductData.price.toString()).toFixed(2)}</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Объем</span>
                <span className="attribute-value">{selectedProductData.volume} м³</span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Минимальный запас</span>
                <span className="attribute-value">{selectedProductData.minStock || 0} {selectedProductData.unit}</span>
              </div>
            </div>
            
            <div className="stock-distribution">
              <h3>Распределение по складам</h3>
              
              {/* Warehouse Type Filter */}
              <div className="warehouse-filters">
                <label>
                  <input 
                    type="radio" 
                    name="warehouseType" 
                    value="all" 
                    checked={warehouseFilter === 'all'}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                  />
                  Все склады
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="warehouseType" 
                    value="head" 
                    checked={warehouseFilter === 'head'}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                  />
                  Главные склады
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="warehouseType" 
                    value="local" 
                    checked={warehouseFilter === 'local'}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                  />
                  Локальные склады
                </label>
              </div>

              <div className="location-stocks">
                {inventory.length > 0 ? (
                  inventory
                    .filter((item: any) => item.locationType === 'warehouse')
                    .map((item: any, index: number) => {
                      const warehouse = warehouses.find((w: any) => w.id === item.locationId);
                      const isLowStock = item.quantity < (selectedProductData.minStock || 0);
                      
                      return (
                        <div className={`location-stock ${isLowStock ? 'low-stock' : ''}`} key={index}>
                          <div className="location-info">
                            <span className="location-name">
                              {warehouse?.name || `Склад №${item.locationId}`}
                              <span className="warehouse-type">({warehouse?.type || 'неизвестно'})</span>
                              {isLowStock && <span className="warning-icon">⚠️</span>}
                            </span>
                            <span className="location-quantity">
                              {item.quantity} {selectedProductData.unit}
                              {isLowStock && <span className="low-stock-text">(Мало товара)</span>}
                            </span>
                          </div>
                          <div className="location-details">
                            <small>Город: {warehouse?.city || 'Неизвестно'}</small>
                            <small>Адрес: {warehouse?.address || 'Не указан'}</small>
                          </div>
                          <div className="location-stock-bar-container">
                            <div 
                              className={`location-stock-bar ${isLowStock ? 'low-stock-bar' : ''}`}
                              style={{ width: `${(item.quantity / (selectedProductData.totalStock || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p>Нет данных о распределении товара по складам</p>
                )}
              </div>
            </div>
            
            <div className="product-actions">
              <button className="btn btn-secondary" onClick={(e) => handleEditProduct(selectedProductData, e)}>
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

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <ProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={(data) => addProductMutation.mutate(data)}
          categories={categories}
          title="Добавить товар"
          isLoading={addProductMutation.isPending}
        />
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <ProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={(data) => 
            updateProductMutation.mutate({ 
              id: editingProduct.id, 
              data 
            })
          }
          categories={categories}
          title="Редактировать товар"
          initialData={editingProduct}
          isLoading={updateProductMutation.isPending}
        />
      )}
    </div>
  );
};

// Product Modal Component
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: Category[];
  title: string;
  initialData?: ProductWithRelations;
  isLoading?: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  title,
  initialData,
  isLoading = false
}) => {
  const form = useForm<any>({
    defaultValues: {
      name: '',
      sku: '',
      categoryId: undefined,
      unit: '',
      weight: '',
      volume: 0.010,
      price: 0,
      minStock: 0,
      image: '',
    }
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        sku: initialData.sku || '',
        categoryId: initialData.categoryId || undefined,
        unit: initialData.unit || '',
        weight: initialData.weight || '',
        volume: initialData.volume ? parseFloat(initialData.volume.toString()) : 0.010,
        price: initialData.price ? parseFloat(initialData.price.toString()) : 0,
        minStock: initialData.minStock || 0,
        image: initialData.image || '',
      });
    } else {
      form.reset({
        name: '',
        sku: '',
        categoryId: undefined,
        unit: '',
        weight: '',
        volume: 0.010,
        price: 0,
        minStock: 0,
        image: '',
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: any) => {
    const submitData = {
      ...data,
      categoryId: data.categoryId || null,
      price: data.price.toString(),
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Название товара *</label>
              <input
                id="name"
                type="text"
                {...form.register('name', { required: 'Название товара обязательно' })}
                className="form-input"
                placeholder="Введите название товара"
              />
              {form.formState.errors.name && (
                <span className="error-text">{String(form.formState.errors.name.message)}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sku">Артикул *</label>
              <input
                id="sku"
                type="text"
                {...form.register('sku', { required: 'Артикул обязателен' })}
                className="form-input"
                placeholder="Введите артикул"
              />
              {form.formState.errors.sku && (
                <span className="error-text">{String(form.formState.errors.sku.message)}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="categoryId">Категория</label>
              <select
                id="categoryId"
                {...form.register('categoryId', { 
                  setValueAs: (value) => value === '' ? null : parseInt(value)
                })}
                className="form-select"
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.categoryId && (
                <span className="error-text">{String(form.formState.errors.categoryId.message)}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="volume">Объем (м³) *</label>
              <input
                type="number"
                id="volume"
                step="0.001"
                min="0"
                {...form.register('volume', {
                  required: 'Объем обязателен',
                  valueAsNumber: true,
                  min: { value: 0.001, message: 'Объем должен быть больше 0' }
                })}
                className="form-input"
              />
              {form.formState.errors.volume && (
                <span className="error-text">{String(form.formState.errors.volume.message)}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="unit">Единица измерения *</label>
              <input
                id="unit"
                type="text"
                {...form.register('unit', { required: 'Единица измерения обязательна' })}
                className="form-input"
                placeholder="мешок, метр, упаковка, лист"
              />
              {form.formState.errors.unit && (
                <span className="error-text">{String(form.formState.errors.unit.message)}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="weight">Вес/Размер</label>
              <input
                id="weight"
                type="text"
                {...form.register('weight')}
                className="form-input"
                placeholder="50кг, 12мм x 12м"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Цена *</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...form.register('price', { 
                  required: 'Цена обязательна',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Цена должна быть больше 0' }
                })}
                className="form-input"
                placeholder="0.00"
              />
              {form.formState.errors.price && (
                <span className="error-text">{String(form.formState.errors.price.message)}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="minStock">Минимальный запас</label>
              <input
                id="minStock"
                type="number"
                {...form.register('minStock', { valueAsNumber: true })}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">URL изображения</label>
            <input
              id="image"
              type="url"
              {...form.register('image')}
              className="form-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Products;