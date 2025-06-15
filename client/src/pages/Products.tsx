import React, { useState } from 'react';
import { Package, Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertProductSchema, type Product, type Category, type Supplier } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import './Products.css';

type ProductWithRelations = Product & {
  category?: Category;
  supplier?: Supplier;
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
  
  const queryClient = useQueryClient();
  const itemsPerPage = 10;

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithRelations[]>({
    queryKey: ['/api/products']
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers']
  });

  // Get inventory for selected product
  const { data: inventory = [] } = useQuery({
    queryKey: ['/api/inventory', selectedProduct],
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

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Товар удален успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при удалении товара', variant: 'destructive' });
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