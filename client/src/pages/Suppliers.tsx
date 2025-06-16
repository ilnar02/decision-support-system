import React, { useState } from 'react';
import { 
  Truck, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, 
  Package, Clock, DollarSign, Star, User, Building, 
  FileText, Send, Eye, X
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Supplier, Product, insertSupplierSchema } from '@shared/schema';

// Form schemas
const supplierSchema = insertSupplierSchema.extend({
  deliveryCities: z.array(z.string()).optional(),
  productCategories: z.array(z.string()).optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

type SupplierWithStats = Supplier & {
  productsCount?: number;
  activeProductsCount?: number;
};

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierWithStats | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const { toast } = useToast();

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: () => apiRequest('/api/suppliers')
  });

  // Fetch products for supplier product management
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers', selectedSupplier?.id, 'products'] });
      toast({ title: 'Товар удален у поставщика' });
    },
    onError: () => {
      toast({ title: 'Ошибка при удалении товара', variant: 'destructive' });
    }
  });

  const filteredSuppliers = suppliers.filter((supplier: SupplierWithStats) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Поставщики</h1>
          <p className="text-gray-600">Управление поставщиками и их ассортиментом</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          Добавить поставщика
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suppliers List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-center py-8">Загрузка поставщиков...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Поставщики не найдены
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
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="text-yellow-400" size={14} />
                          <span className="text-sm text-gray-600">{supplier.rating || '0.0'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSupplier(supplier);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Вы уверены, что хотите удалить этого поставщика?')) {
                            deleteMutation.mutate(supplier.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
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

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSupplier(supplier);
                        setShowProductsModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      <Package size={14} />
                      Товары
                    </button>
                    {supplier.deliveryTime && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                        <Clock size={14} />
                        {supplier.deliveryTime}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier Details */}
        <div className="lg:col-span-1">
          {selectedSupplier ? (
            <div className="bg-white rounded-lg border p-4 sticky top-6">
              <h3 className="font-medium text-gray-900 mb-4">Детали поставщика</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Основная информация</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Название:</span> {selectedSupplier.name}</div>
                    <div><span className="text-gray-600">Специализация:</span> {selectedSupplier.specialization}</div>
                    <div><span className="text-gray-600">Рейтинг:</span> {selectedSupplier.rating || '0.0'}</div>
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
                      {selectedSupplier.deliveryCities.map((city, index) => (
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
                      {selectedSupplier.productCategories.map((category, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowProductsModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Package size={16} />
                  Управление товарами
                </button>
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
    </div>
  );
};

// Supplier Modal Component
interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  supplier?: SupplierWithStats | null;
  isLoading?: boolean;
}

const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplier,
  isLoading = false
}) => {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || '',
      specialization: supplier?.specialization || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      address: supplier?.address || '',
      representative: supplier?.representative || '',
      representativePhone: supplier?.representativePhone || '',
      representativeEmail: supplier?.representativeEmail || '',
      minimumOrder: supplier?.minimumOrder ? Number(supplier.minimumOrder) : undefined,
      paymentTerms: supplier?.paymentTerms || '',
      deliveryTime: supplier?.deliveryTime || '',
      deliveryCities: supplier?.deliveryCities || [],
      productCategories: supplier?.productCategories || [],
      rating: supplier?.rating ? Number(supplier.rating) : undefined,
      notes: supplier?.notes || '',
    }
  });

  const [deliveryCitiesText, setDeliveryCitiesText] = useState(
    supplier?.deliveryCities?.join(', ') || ''
  );
  const [productCategoriesText, setProductCategoriesText] = useState(
    supplier?.productCategories?.join(', ') || ''
  );

  const handleSubmit = (data: SupplierFormData) => {
    const submitData = {
      ...data,
      deliveryCities: deliveryCitiesText.split(',').map(s => s.trim()).filter(Boolean),
      productCategories: productCategoriesText.split(',').map(s => s.trim()).filter(Boolean),
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {supplier ? 'Редактировать поставщика' : 'Добавить поставщика'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название *
              </label>
              <input
                {...form.register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Название компании"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
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
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.specialization.message}</p>
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
                placeholder="email@company.ru"
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
              placeholder="Полный адрес компании"
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
                placeholder="Имя представителя"
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
                step="0.01"
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
                placeholder="Отсрочка 30 дней"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время доставки
              </label>
              <input
                {...form.register('deliveryTime')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2-3 дня"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Города доставки (через запятую)
            </label>
            <input
              value={deliveryCitiesText}
              onChange={(e) => setDeliveryCitiesText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Москва, Санкт-Петербург, Казань"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категории товаров (через запятую)
            </label>
            <input
              value={productCategoriesText}
              onChange={(e) => setProductCategoriesText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Цемент, Арматура, Кирпич"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Примечания
            </label>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Дополнительная информация о поставщике"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {supplier ? 'Обновить' : 'Добавить'}
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
  const [supplierPrice, setSupplierPrice] = useState<string>('');

  const supplierProductIds = new Set(supplierProducts.map(sp => sp.productId));
  
  const availableProducts = products.filter(product =>
    !supplierProductIds.has(product.id) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    if (selectedProductId) {
      onAddProduct(selectedProductId, supplierPrice ? Number(supplierPrice) : undefined);
      setSelectedProductId(null);
      setSupplierPrice('');
    }
  };

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Товары поставщика: {supplier.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                  <option value="">Выберите товар</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₽{Number(product.price).toFixed(2)}
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

              <div className="max-h-64 overflow-y-auto">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Доступные товары ({availableProducts.length})
                </div>
                <div className="space-y-1">
                  {availableProducts.slice(0, 10).map(product => (
                    <div key={product.id} className="p-2 border rounded text-sm hover:bg-gray-50">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-gray-600">
                        {product.sku} | ₽{Number(product.price).toFixed(2)} | {product.unit}
                      </div>
                    </div>
                  ))}
                  {availableProducts.length > 10 && (
                    <div className="text-xs text-gray-500 text-center p-2">
                      И еще {availableProducts.length - 10} товаров...
                    </div>
                  )}
                </div>
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