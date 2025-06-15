import React, { useState } from 'react';
import { 
  Warehouse, 
  Search, 
  MapPin, 
  Package, 
  TrendingUp, 
  ArrowRight, 
  Truck, 
  ArrowUp, 
  ArrowDown,
  Plus,
  Edit,
  Trash2,
  ArrowLeftRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Warehouse as WarehouseType, Product, Inventory, Transaction } from '@shared/schema';

// Form schemas
const warehouseSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  type: z.string().min(1, 'Тип обязателен'),
  city: z.string().min(1, 'Город обязателен'),
  address: z.string().min(1, 'Адрес обязателен'),
  contact: z.string().min(1, 'Контакт обязателен'),
  phone: z.string().min(1, 'Телефон обязателен'),
  totalCapacity: z.number().min(1, 'Вместимость должна быть больше 0'),
});

const transferSchema = z.object({
  productId: z.number().min(1, 'Выберите товар'),
  quantity: z.number().min(1, 'Количество должно быть больше 0'),
  fromLocationId: z.number().min(1, 'Выберите склад отправитель'),
  toLocationId: z.number().min(1, 'Выберите склад получатель'),
  notes: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

type WarehouseWithStats = WarehouseType & {
  inventory?: Inventory[];
  totalProducts?: number;
  usedCapacity?: number;
  recentTransactions?: Transaction[];
};

const Warehouses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: warehouses = [], isLoading: warehousesLoading, error: warehousesError } = useQuery<WarehouseWithStats[]>({
    queryKey: ['/api/warehouses'],
  });

  // Debug logging
  console.log('Warehouses data:', warehouses);
  console.log('Loading state:', warehousesLoading);
  console.log('Error:', warehousesError);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: selectedWarehouseInventory = [], isLoading: inventoryLoading } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory', selectedWarehouse, 'warehouse'],
    enabled: !!selectedWarehouse,
  });

  const { data: recentTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Mutations
  const createWarehouseMutation = useMutation({
    mutationFn: (data: WarehouseFormData) => 
      apiRequest('/api/warehouses', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setIsAddModalOpen(false);
      toast({ title: 'Склад создан успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при создании склада', variant: 'destructive' });
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: TransferFormData) => 
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'transfer',
          fromLocationId: data.fromLocationId,
          fromLocationType: 'warehouse',
          toLocationId: data.toLocationId,
          toLocationType: 'warehouse',
          items: [{
            productId: data.productId,
            quantity: data.quantity,
            unitPrice: '0.00',
            totalPrice: '0.00'
          }]
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setIsTransferModalOpen(false);
      toast({ title: 'Перемещение выполнено успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при перемещении товара', variant: 'destructive' });
    }
  });

  // Filter warehouses
  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedWarehouseData = selectedWarehouse
    ? warehouses.find(w => w.id === selectedWarehouse)
    : null;

  // Get inventory for selected warehouse
  const warehouseInventory = selectedWarehouseInventory.map(inv => {
    const product = products.find(p => p.id === inv.productId);
    return {
      ...inv,
      product
    };
  });

  // Calculate warehouse stats
  const getWarehouseStats = (warehouse: WarehouseType) => {
    // Use existing usedCapacity from database if available, otherwise calculate from inventory
    const usedCapacity = warehouse.usedCapacity || 0;
    const capacityPercentage = warehouse.totalCapacity ? (usedCapacity / warehouse.totalCapacity) * 100 : 0;
    
    return {
      totalProducts: Math.floor(usedCapacity / 10), // Estimate products based on capacity
      usedCapacity,
      capacityPercentage
    };
  };

  // Get recent transactions for warehouse
  const getWarehouseTransactions = (warehouseId: number) => {
    return recentTransactions
      .filter(t => 
        (t.fromLocationId === warehouseId && t.fromLocationType === 'warehouse') ||
        (t.toLocationId === warehouseId && t.toLocationType === 'warehouse')
      )
      .slice(0, 5);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Склады</h1>
          <p className="text-gray-600">Управление складами и перемещением товаров</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeftRight size={16} />
            Перемещение
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={16} />
            Добавить склад
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouses List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск складов..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {warehousesLoading ? (
                <div className="p-4 text-center text-gray-500">Загрузка...</div>
              ) : filteredWarehouses.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Склады не найдены</div>
              ) : (
                filteredWarehouses.map((warehouse) => {
                  const stats = getWarehouseStats(warehouse);
                  return (
                    <div
                      key={warehouse.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedWarehouse === warehouse.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedWarehouse(warehouse.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Warehouse size={20} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{warehouse.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin size={14} />
                            <span className="truncate">{warehouse.city}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-green-600">
                              {stats.totalProducts} товаров
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(stats.capacityPercentage)}% заполнено
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Warehouse Details */}
        <div className="lg:col-span-2">
          {selectedWarehouseData ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedWarehouseData.name}</h2>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <MapPin size={16} />
                      <span>{selectedWarehouseData.address}, {selectedWarehouseData.city}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingWarehouse(selectedWarehouseData);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="text-blue-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Товары</p>
                        <p className="text-xl font-bold text-gray-900">
                          {getWarehouseStats(selectedWarehouseData).totalProducts}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="text-green-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Заполнено</p>
                        <p className="text-xl font-bold text-gray-900">
                          {Math.round(getWarehouseStats(selectedWarehouseData).capacityPercentage)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Warehouse className="text-purple-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Вместимость</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedWarehouseData.totalCapacity}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-gray-900">Товары на складе</h3>
                </div>
                <div className="overflow-x-auto">
                  {inventoryLoading ? (
                    <div className="p-4 text-center text-gray-500">Загрузка...</div>
                  ) : warehouseInventory.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Товары не найдены</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Товар</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">SKU</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Количество</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Обновлено</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {warehouseInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.product?.name || 'Неизвестный товар'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.product?.sku || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                item.quantity > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('ru-RU') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-gray-900">Последние операции</h3>
                </div>
                <div className="p-4">
                  {getWarehouseTransactions(selectedWarehouseData.id).length === 0 ? (
                    <div className="text-center text-gray-500">Операции не найдены</div>
                  ) : (
                    <div className="space-y-3">
                      {getWarehouseTransactions(selectedWarehouseData.id).map((transaction) => (
                        <div key={transaction.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'incoming' ? 'bg-green-100 text-green-600' :
                            transaction.type === 'outgoing' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {transaction.type === 'incoming' ? <ArrowDown size={16} /> :
                             transaction.type === 'outgoing' ? <ArrowUp size={16} /> :
                             <ArrowLeftRight size={16} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {transaction.type === 'incoming' ? 'Поступление' :
                                 transaction.type === 'outgoing' ? 'Отгрузка' :
                                 'Перемещение'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('ru-RU') : '-'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Сумма: {transaction.totalAmount || '0.00'} ₽
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Warehouse size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите склад</h3>
              <p className="text-gray-600">Выберите склад из списка, чтобы просмотреть детали</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Warehouse Modal */}
      {isAddModalOpen && <WarehouseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={(data) => createWarehouseMutation.mutate(data)}
        title="Добавить склад"
        isLoading={createWarehouseMutation.isPending}
      />}

      {/* Transfer Modal */}
      {isTransferModalOpen && <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={(data) => createTransferMutation.mutate(data)}
        warehouses={warehouses}
        products={products}
        isLoading={createTransferMutation.isPending}
      />}
    </div>
  );
};

// Warehouse Modal Component
interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WarehouseFormData) => void;
  title: string;
  initialData?: WarehouseType;
  isLoading?: boolean;
}

const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  isLoading = false
}) => {
  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      contact: initialData?.contact || '',
      phone: initialData?.phone || '',
      totalCapacity: initialData?.totalCapacity || 0,
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              {...form.register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.name && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип
            </label>
            <select
              {...form.register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите тип</option>
              <option value="head">Распределительный центр</option>
              <option value="local">Локальный склад</option>
            </select>
            {form.formState.errors.type && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Город
            </label>
            <input
              {...form.register('city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.city && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <input
              {...form.register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.address && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Контактное лицо
            </label>
            <input
              {...form.register('contact')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.contact && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.contact.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              {...form.register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.phone && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вместимость
            </label>
            <input
              type="number"
              {...form.register('totalCapacity', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.totalCapacity && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.totalCapacity.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Transfer Modal Component
interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransferFormData) => void;
  warehouses: WarehouseType[];
  products: Product[];
  isLoading?: boolean;
}

const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  warehouses,
  products,
  isLoading = false
}) => {
  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Перемещение товара</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Товар
            </label>
            <select
              {...form.register('productId', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите товар</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            {form.formState.errors.productId && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.productId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество
            </label>
            <input
              type="number"
              {...form.register('quantity', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.quantity && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Со склада
            </label>
            <select
              {...form.register('fromLocationId', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите склад</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {form.formState.errors.fromLocationId && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.fromLocationId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              На склад
            </label>
            <select
              {...form.register('toLocationId', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите склад</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {form.formState.errors.toLocationId && (
              <p className="text-red-600 text-sm mt-1">{form.formState.errors.toLocationId.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Перемещение...' : 'Переместить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Warehouses;