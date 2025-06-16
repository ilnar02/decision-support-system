import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, Mail, Phone, MapPin, User, Clock, Truck, X } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { queryClient } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
// Types
interface SupplierWithStats {
  id: number;
  name: string;
  specialization: string;
  email?: string;
  phone?: string;
  address?: string;
  representative?: string;
  representativePhone?: string;
  representativeEmail?: string;
  minimumOrder?: number;
  paymentTerms?: string;
  deliveryTime?: string;
  deliveryCities?: string[];
  productCategories?: string[];
  notes?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  unit: string;
}

interface Category {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
  city: string;
}

// Form schemas
const supplierSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  specialization: z.string().min(1, "Специализация обязательна"),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  representative: z.string().optional(),
  representativePhone: z.string().optional(),
  representativeEmail: z.string().optional(),
  minimumOrder: z.coerce.number().int().positive().optional(),
  paymentTerms: z.string().optional(),
  deliveryTime: z.string().optional(),
  deliveryCities: z.array(z.string()).optional(),
  productCategories: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const Suppliers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierWithStats | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const { toast } = useToast();

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: () => apiRequest('/api/suppliers')
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products')
  });

  // Fetch categories for dropdown selection
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories')
  });

  // Fetch warehouses for delivery
  const { data: warehouses = [] } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiRequest('/api/warehouses')
  });

  // Fetch supplier products when viewing details
  const { data: supplierProducts = [] } = useQuery({
    queryKey: ['/api/suppliers', selectedSupplier?.id, 'products'],
    queryFn: () => apiRequest(`/api/suppliers/${selectedSupplier?.id}/products`),
    enabled: !!selectedSupplier?.id
  });

  // Create supplier mutation
  const createMutation = useMutation({
    mutationFn: (data: SupplierFormData) => 
      apiRequest('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers', selectedSupplier?.id] });
      toast({ title: 'Поставщик добавлен успешно' });
      setShowAddModal(false);
    },
    onError: () => {
      toast({ title: 'Ошибка при добавлении поставщика', variant: 'destructive' });
    }
  });

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierFormData> }) =>
      apiRequest(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: (updatedSupplier) => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers', selectedSupplier?.id] });
      if (selectedSupplier) {
        // Update the current selected supplier to reflect changes
        setSelectedSupplier(updatedSupplier);
      }
      toast({ title: 'Поставщик обновлен успешно' });
      setEditingSupplier(null);
    },
    onError: () => {
      toast({ title: 'Ошибка при обновлении поставщика', variant: 'destructive' });
    }
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/suppliers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({ title: 'Поставщик удален успешно' });
      setSelectedSupplier(null);
    },
    onError: () => {
      toast({ title: 'Ошибка при удалении поставщика', variant: 'destructive' });
    }
  });

  // Add product to supplier mutation
  const addProductMutation = useMutation({
    mutationFn: ({ supplierId, productId, supplierPrice }: { supplierId: number; productId: number; supplierPrice?: number }) =>
      apiRequest(`/api/suppliers/${supplierId}/products`, {
        method: 'POST',
        body: JSON.stringify({ productId, supplierPrice })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers', selectedSupplier?.id, 'products'] });
      toast({ title: 'Товар добавлен к поставщику' });
    },
    onError: () => {
      toast({ title: 'Ошибка при добавлении товара', variant: 'destructive' });
    }
  });

  // Remove product from supplier mutation
  const removeProductMutation = useMutation({
    mutationFn: ({ supplierId, productId }: { supplierId: number; productId: number }) =>
      apiRequest(`/api/suppliers/${supplierId}/products/${productId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers', selectedSupplier?.id, 'products'] });
      toast({ title: 'Товар удален у поставщика' });
    },
    onError: () => {
      toast({ title: 'Ошибка при удалении товара', variant: 'destructive' });
    }
  });

  // Delivery mutation
  const deliveryMutation = useMutation({
    mutationFn: ({ deliveryData }: { deliveryData: any }) =>
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(deliveryData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({ title: 'Поставка успешно выполнена' });
      setShowDeliveryModal(false);
    },
    onError: () => {
      toast({ title: 'Ошибка при выполнении поставки', variant: 'destructive' });
    }
  });

  const filteredSuppliers = suppliers.filter((supplier: SupplierWithStats) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Поставщики</h1>
          <p className="text-gray-600">Управление поставщиками и их продукцией</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Добавить поставщика
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suppliers List */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск поставщиков..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Загрузка поставщиков...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuppliers.map((supplier: SupplierWithStats) => (
                <div
                  key={supplier.id}
                  className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedSupplier?.id === supplier.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-600">{supplier.specialization}</p>
                        <div className="mt-1">
                          <span className="text-sm text-gray-500">{supplier.deliveryTime || 'Время доставки не указано'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      {supplier.phone || 'Не указан'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      {supplier.email || 'Не указан'}
                    </div>
                  </div>

                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin size={14} />
                      {supplier.address}
                    </div>
                  )}

                  {supplier.deliveryTime && (
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                        <Clock size={14} />
                        {supplier.deliveryTime}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier Details */}
        <div className="lg:col-span-1">
          {selectedSupplier ? (
            <div className="bg-white rounded-lg border p-6 sticky top-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">{selectedSupplier.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingSupplier(selectedSupplier)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Edit size={14} />
                    Редактировать
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Вы уверены, что хотите удалить этого поставщика?')) {
                        deleteMutation.mutate(selectedSupplier.id);
                        setSelectedSupplier(null);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Удалить
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Основная информация</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Название:</span> {selectedSupplier.name}</div>
                    <div><span className="text-gray-600">Специализация:</span> {selectedSupplier.specialization}</div>
                    {selectedSupplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span className="text-gray-600">Email:</span> {selectedSupplier.email}
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span className="text-gray-600">Телефон:</span> {selectedSupplier.phone}
                      </div>
                    )}
                    {selectedSupplier.address && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span className="text-gray-600">Адрес:</span> {selectedSupplier.address}
                      </div>
                    )}
                  </div>
                </div>

                {selectedSupplier.representative && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Представитель</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        {selectedSupplier.representative}
                      </div>
                      {selectedSupplier.representativePhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          {selectedSupplier.representativePhone}
                        </div>
                      )}
                      {selectedSupplier.representativeEmail && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          {selectedSupplier.representativeEmail}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Условия работы</h4>
                  <div className="space-y-2 text-sm">
                    {selectedSupplier.minimumOrder && (
                      <div><span className="text-gray-600">Минимальный заказ:</span> ₽{Number(selectedSupplier.minimumOrder).toFixed(2)}</div>
                    )}
                    {selectedSupplier.paymentTerms && (
                      <div><span className="text-gray-600">Условия оплаты:</span> {selectedSupplier.paymentTerms}</div>
                    )}
                    {selectedSupplier.deliveryTime && (
                      <div><span className="text-gray-600">Время доставки:</span> {selectedSupplier.deliveryTime}</div>
                    )}
                  </div>
                </div>

                {selectedSupplier.deliveryCities && selectedSupplier.deliveryCities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Города доставки</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSupplier.deliveryCities.map((city: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSupplier.productCategories && selectedSupplier.productCategories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Категории товаров</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSupplier.productCategories.map((category: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSupplier.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Заметки</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedSupplier.notes}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => setShowProductsModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Package size={16} />
                    Управление товарами
                  </button>
                  
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Truck size={16} />
                    Выполнить поставку
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-4 text-center text-gray-500 sticky top-6">
              Выберите поставщика для просмотра деталей
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      <SupplierModal
        isOpen={showAddModal || !!editingSupplier}
        onClose={() => {
          setShowAddModal(false);
          setEditingSupplier(null);
        }}
        onSubmit={(data) => {
          if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        supplier={editingSupplier}
        categories={categories}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Supplier Products Modal */}
      <SupplierProductsModal
        isOpen={showProductsModal}
        onClose={() => setShowProductsModal(false)}
        supplier={selectedSupplier}
        products={products}
        supplierProducts={supplierProducts}
        onAddProduct={(productId, supplierPrice) => {
          if (selectedSupplier) {
            addProductMutation.mutate({ supplierId: selectedSupplier.id, productId, supplierPrice });
          }
        }}
        onRemoveProduct={(productId) => {
          if (selectedSupplier) {
            removeProductMutation.mutate({ supplierId: selectedSupplier.id, productId });
          }
        }}
        isLoading={addProductMutation.isPending || removeProductMutation.isPending}
      />

      {/* Delivery Modal */}
      <DeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        supplier={selectedSupplier}
        products={products}
        warehouses={warehouses}
        supplierProducts={supplierProducts}
        onSubmit={(deliveryData) => deliveryMutation.mutate({ deliveryData })}
        isLoading={deliveryMutation.isPending}
      />
    </div>
  );
};

// Delivery Modal Component
interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierWithStats | null;
  products: Product[];
  warehouses: any[];
  supplierProducts: any[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  supplier,
  products,
  warehouses,
  supplierProducts,
  onSubmit,
  isLoading = false
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<Array<{ productId: number; quantity: number; price: number }>>([]);

  if (!isOpen || !supplier) return null;

  // Filter warehouses based on supplier delivery cities
  const availableWarehouses = warehouses.filter((warehouse: any) => 
    supplier.deliveryCities && supplier.deliveryCities.includes(warehouse.city)
  );

  // Get supplier products for delivery
  const availableProducts = supplierProducts.map(sp => {
    const product = products.find(p => p.id === sp.productId);
    return product ? { ...product, supplierPrice: sp.supplierPrice } : null;
  }).filter((product): product is NonNullable<typeof product> => product !== null);

  const addDeliveryItem = () => {
    setDeliveryItems([...deliveryItems, { productId: 0, quantity: 1, price: 0 }]);
  };

  const removeDeliveryItem = (index: number) => {
    setDeliveryItems(deliveryItems.filter((_, i) => i !== index));
  };

  const updateDeliveryItem = (index: number, field: string, value: any) => {
    const updated = [...deliveryItems];
    if (field === 'productId') {
      const selectedProduct = availableProducts.find(p => p.id === Number(value));
      updated[index] = {
        ...updated[index],
        productId: Number(value),
        price: selectedProduct ? (selectedProduct.supplierPrice || selectedProduct.price) : 0
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDeliveryItems(updated);
  };

  const getTotalCost = () => {
    return deliveryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = () => {
    if (!selectedWarehouseId || deliveryItems.length === 0) {
      return;
    }

    // Validate all items have valid products and quantities
    const validItems = deliveryItems.filter(item => 
      item.productId > 0 && item.quantity > 0 && item.price > 0
    );

    if (validItems.length === 0) {
      return;
    }

    const deliveryData = {
      type: 'delivery',
      fromLocationId: null,
      fromLocationType: null,
      toLocationId: selectedWarehouseId,
      toLocationType: 'warehouse',
      items: validItems
    };

    onSubmit(deliveryData);
    
    // Reset form
    setSelectedWarehouseId(null);
    setDeliveryItems([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Выполнить поставку - {supplier.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Warehouse Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Склад назначения
            </label>
            {availableWarehouses.length === 0 ? (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded">
                Нет доступных складов в городах доставки поставщика
                {supplier.deliveryCities && supplier.deliveryCities.length > 0 && (
                  <div className="mt-1">
                    Города доставки: {supplier.deliveryCities.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <select
                value={selectedWarehouseId || ''}
                onChange={(e) => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите склад ({availableWarehouses.length} доступно)</option>
                {availableWarehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.city}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Delivery Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Товары для поставки
              </label>
              <button
                type="button"
                onClick={addDeliveryItem}
                disabled={availableProducts.length === 0}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus size={14} />
                Добавить товар
              </button>
            </div>

            {deliveryItems.length === 0 ? (
              <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                Нажмите "Добавить товар" для начала формирования поставки
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">Товар #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDeliveryItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Товар</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateDeliveryItem(index, 'productId', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={0}>Выберите товар</option>
                          {availableProducts.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} | {product.sku}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Количество</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateDeliveryItem(index, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Кол-во"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Цена за единицу</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateDeliveryItem(index, 'price', Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="₽"
                        />
                      </div>
                    </div>
                    
                    {item.productId > 0 && item.quantity > 0 && item.price > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Стоимость: ₽{(item.quantity * item.price).toFixed(2)}
                        {(() => {
                          const product = availableProducts.find(p => p.id === item.productId);
                          return product ? ` | ${product.unit}` : '';
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Summary */}
          {deliveryItems.length > 0 && selectedWarehouseId && (
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-medium text-blue-900 mb-2">Сводка поставки</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Склад: {availableWarehouses.find(w => w.id === selectedWarehouseId)?.name}</div>
                <div>Товаров в поставке: {deliveryItems.filter(item => item.productId > 0).length}</div>
                <div>Общая стоимость: ₽{getTotalCost().toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedWarehouseId || deliveryItems.length === 0 || deliveryItems.filter(item => item.productId > 0 && item.quantity > 0 && item.price > 0).length === 0 || isLoading || availableWarehouses.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <Truck size={16} />
            Выполнить поставку
          </button>
        </div>
      </div>
    </div>
  );
};

// Supplier Modal Component
interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  supplier?: SupplierWithStats | null;
  categories: Category[];
  isLoading?: boolean;
}

const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplier,
  categories,
  isLoading = false
}) => {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      specialization: '',
      email: '',
      phone: '',
      address: '',
      representative: '',
      representativePhone: '',
      representativeEmail: '',
      minimumOrder: undefined,
      paymentTerms: '',
      deliveryTime: '',
      deliveryCities: [],
      productCategories: [],
      notes: '',
    }
  });

  // Reset form when supplier changes
  React.useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name || '',
        specialization: supplier.specialization || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        representative: supplier.representative || '',
        representativePhone: supplier.representativePhone || '',
        representativeEmail: supplier.representativeEmail || '',
        minimumOrder: supplier.minimumOrder || undefined,
        paymentTerms: supplier.paymentTerms || '',
        deliveryTime: supplier.deliveryTime || '',
        deliveryCities: supplier.deliveryCities || [],
        productCategories: supplier.productCategories || [],
        notes: supplier.notes || '',
      });
      setDeliveryCitiesText(supplier.deliveryCities?.join(', ') || '');
      setSelectedCategories(supplier.productCategories || []);
    } else {
      form.reset({
        name: '',
        specialization: '',
        email: '',
        phone: '',
        address: '',
        representative: '',
        representativePhone: '',
        representativeEmail: '',
        minimumOrder: undefined,
        paymentTerms: '',
        deliveryTime: '',
        deliveryCities: [],
        productCategories: [],
        notes: '',
      });
      setDeliveryCitiesText('');
      setSelectedCategories([]);
    }
  }, [supplier, form]);

  const [deliveryCitiesText, setDeliveryCitiesText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    supplier?.productCategories || []
  );

  const handleSubmit = (data: SupplierFormData) => {
    // Convert form data to proper format for backend
    const submitData = {
      name: data.name,
      specialization: data.specialization,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      representative: data.representative || undefined,
      representativePhone: data.representativePhone || undefined,
      representativeEmail: data.representativeEmail || undefined,
      minimumOrder: data.minimumOrder ? Math.floor(data.minimumOrder) : undefined,
      paymentTerms: data.paymentTerms || undefined,
      deliveryTime: data.deliveryTime || undefined,
      deliveryCities: deliveryCitiesText.split(',').map(s => s.trim()).filter(Boolean),
      productCategories: selectedCategories,
      notes: data.notes || undefined,
    };
    onSubmit(submitData);
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {supplier ? 'Редактировать поставщика' : 'Добавить поставщика'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название поставщика *
              </label>
              <input
                {...form.register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ООО СтройКомплект"
              />
              {form.formState.errors.name && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Специализация *
              </label>
              <input
                {...form.register('specialization')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Строительные материалы"
              />
              {form.formState.errors.specialization && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.specialization.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                {...form.register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="info@company.ru"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                {...form.register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+7 (000) 000-00-00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Адрес
            </label>
            <input
              {...form.register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="г. Москва, ул. Строительная, 123"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Представитель
              </label>
              <input
                {...form.register('representative')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Иван Иванов"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон представителя
              </label>
              <input
                {...form.register('representativePhone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+7 (000) 000-00-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email представителя
              </label>
              <input
                {...form.register('representativeEmail')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="rep@company.ru"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимальный заказ (₽)
              </label>
              <input
                {...form.register('minimumOrder', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Условия оплаты
              </label>
              <input
                {...form.register('paymentTerms')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30 дней с момента поставки"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время доставки
              </label>
              <input
                {...form.register('deliveryTime')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3-5 дней"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Города доставки (через запятую)
            </label>
            <input
              type="text"
              value={deliveryCitiesText}
              onChange={(e) => setDeliveryCitiesText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Москва, Санкт-Петербург, Казань"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категории товаров
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-300 rounded-md max-h-40 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                    className="rounded"
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заметки
            </label>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Дополнительная информация о поставщике..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {supplier ? 'Обновить' : 'Создать'} поставщика
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Supplier Products Modal Component
interface SupplierProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierWithStats | null;
  products: Product[];
  supplierProducts: any[];
  onAddProduct: (productId: number, supplierPrice?: number) => void;
  onRemoveProduct: (productId: number) => void;
  isLoading?: boolean;
}

const SupplierProductsModal: React.FC<SupplierProductsModalProps> = ({
  isOpen,
  onClose,
  supplier,
  products,
  supplierProducts,
  onAddProduct,
  onRemoveProduct,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [supplierPrice, setSupplierPrice] = useState('');

  if (!isOpen || !supplier) return null;

  const supplierProductIds = supplierProducts.map(sp => sp.productId);
  const availableProducts = products.filter(product => 
    !supplierProductIds.includes(product.id) &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddProduct = () => {
    if (selectedProductId) {
      onAddProduct(selectedProductId, supplierPrice ? Number(supplierPrice) : undefined);
      setSelectedProductId(null);
      setSupplierPrice('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Управление товарами - {supplier.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Products */}
          <div>
            <h3 className="text-lg font-medium mb-4">Текущие товары ({supplierProducts.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {supplierProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  У поставщика пока нет товаров
                </div>
              ) : (
                supplierProducts.map((sp) => (
                  <div key={sp.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{sp.productName}</div>
                      <div className="text-sm text-gray-600">
                        Код: {sp.productSku} | Цена: ₽{Number(sp.productPrice).toFixed(2)}
                        {sp.supplierPrice && (
                          <span className="ml-2 text-green-600">
                            | Цена поставщика: ₽{Number(sp.supplierPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {sp.categoryName && (
                        <div className="text-xs text-gray-500">{sp.categoryName}</div>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveProduct(sp.productId)}
                      disabled={isLoading}
                      className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Products */}
          <div>
            <h3 className="text-lg font-medium mb-4">Добавить товары</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <select
                  value={selectedProductId || ''}
                  onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите товар из списка ({availableProducts.length} доступно)</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} | {product.sku} | ₽{Number(product.price).toFixed(2)} | {product.unit}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Цена поставщика (опционально)"
                  value={supplierPrice}
                  onChange={(e) => setSupplierPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <button
                  onClick={handleAddProduct}
                  disabled={!selectedProductId || isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <Plus size={16} />
                  Добавить товар
                </button>
              </div>

            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;