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
  fromLocationId: z.number().min(1, 'Выберите склад отправитель'),
  toLocationId: z.number().min(1, 'Выберите склад получатель'),
  notes: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;
type TransferFormData = z.infer<typeof transferSchema> & {
  items: Array<{productId: number, quantity: number}>;
};

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
    queryFn: () => apiRequest('/api/warehouses'),
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products'),
  });

  const { data: selectedWarehouseInventory = [], isLoading: inventoryLoading } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory', selectedWarehouse, 'warehouse'],
    queryFn: () => apiRequest(`/api/inventory/${selectedWarehouse}/warehouse`),
    enabled: !!selectedWarehouse,
  });

  const { data: recentTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: () => apiRequest('/api/transactions'),
  });

  const { data: inTransitTransactions = [] } = useQuery({
    queryKey: ['/api/transactions/in-transit'],
    queryFn: () => apiRequest('/api/transactions/in-transit'),
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
    mutationFn: (data: { fromLocationId: number; toLocationId: number; notes?: string; items: Array<{productId: number, quantity: number}> }) => 
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'transfer',
          fromLocationId: data.fromLocationId,
          fromLocationType: 'warehouse',
          toLocationId: data.toLocationId,
          toLocationType: 'warehouse',
          notes: data.notes,
          items: data.items
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/in-transit'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/detailed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      // Invalidate specific warehouse inventories
      warehouses.forEach(warehouse => {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory', warehouse.id, 'warehouse'] });
      });
      setIsTransferModalOpen(false);
      toast({ title: 'Перемещение выполнено успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при перемещении товара', variant: 'destructive' });
    }
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: (transactionId: number) => 
      apiRequest(`/api/transactions/${transactionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/in-transit'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/detailed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      // Invalidate specific warehouse inventories
      warehouses.forEach(warehouse => {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory', warehouse.id, 'warehouse'] });
      });
      toast({ title: 'Поставка подтверждена' });
    },
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

  // Get all inventory data for warehouse stats calculation
  const { data: allInventory = [] } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory'],
    queryFn: () => apiRequest('/api/inventory'),
  });

  // Calculate warehouse stats with volume-based capacity
  const getWarehouseStats = (warehouse: WarehouseType) => {
    const warehouseInventory = allInventory.filter(
      (item: Inventory) => item.locationId === warehouse.id && item.locationType === 'warehouse'
    );
    
    const totalProducts = warehouseInventory.reduce((sum: number, item: Inventory) => sum + item.quantity, 0);
    
    // Calculate used volume in m³
    const usedVolume = warehouseInventory.reduce((sum: number, item: Inventory) => {
      const product = products.find(p => p.id === item.productId);
      const productVolume = product?.volume ? parseFloat(product.volume.toString()) : 0.010;
      return sum + (item.quantity * productVolume);
    }, 0);
    
    const capacityPercentage = warehouse.totalCapacity > 0 
      ? Math.min((usedVolume / warehouse.totalCapacity) * 100, 100)
      : 0;
    
    return {
      totalProducts,
      usedVolume: Math.round(usedVolume * 100) / 100, // Round to 2 decimal places
      capacityPercentage: Math.round(capacityPercentage * 10) / 10 // Round to 1 decimal place
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
                          {getWarehouseStats(selectedWarehouseData).capacityPercentage}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {getWarehouseStats(selectedWarehouseData).usedVolume} м³
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
                          {selectedWarehouseData.totalCapacity} м³
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedWarehouseData.totalCapacity - getWarehouseStats(selectedWarehouseData).usedVolume).toFixed(1)} м³ свободно
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incoming Deliveries */}
              {inTransitTransactions.filter((t: any) => 
                t.toLocationId === selectedWarehouseData.id && t.toLocationType === 'warehouse'
              ).length > 0 && (
                <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200">
                  <div className="p-4 border-b border-yellow-200 bg-yellow-100">
                    <h3 className="font-medium text-yellow-800 flex items-center gap-2">
                      <Truck size={20} className="text-yellow-600" />
                      Ожидающие подтверждения поставки ({inTransitTransactions.filter((t: any) => 
                        t.toLocationId === selectedWarehouseData.id && t.toLocationType === 'warehouse'
                      ).length})
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {inTransitTransactions.filter((t: any) => 
                      t.toLocationId === selectedWarehouseData.id && t.toLocationType === 'warehouse'
                    ).map((transaction: any) => (
                      <div key={transaction.id} className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.type === 'delivery' ? 'Поставка от поставщика' : 'Перемещение'}
                              <span className="ml-2 text-sm text-gray-500">#{transaction.id}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => confirmDeliveryMutation.mutate(transaction.id)}
                            disabled={confirmDeliveryMutation.isPending}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {confirmDeliveryMutation.isPending ? 'Подтверждение...' : 'Подтвердить'}
                          </button>
                        </div>
                        <div className="border-t pt-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">Товары:</div>
                          {transaction.items.map((item: any) => {
                            const product = products.find((p: any) => p.id === item.productId);
                            return (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{product?.name || `Товар #${item.productId}`}</span>
                                <span className="font-medium">{item.quantity} {product?.unit || 'шт'}</span>
                              </div>
                            );
                          })}
                        </div>
                        {transaction.notes && (
                          <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                            <strong>Примечания:</strong> {transaction.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                              {transaction.notes || 'Перемещение товаров между складами'}
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
  const [fromWarehouseId, setFromWarehouseId] = useState<number | null>(null);
  const [toWarehouseId, setToWarehouseId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{productId: number, quantity: number}>>([]);
  const [notes, setNotes] = useState('');

  const { data: fromInventory = [] } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory', fromWarehouseId, 'warehouse'],
    queryFn: () => apiRequest(`/api/inventory/${fromWarehouseId}/warehouse`),
    enabled: !!fromWarehouseId,
  });

  const { data: toInventory = [] } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory', toWarehouseId, 'warehouse'],
    queryFn: () => apiRequest(`/api/inventory/${toWarehouseId}/warehouse`),
    enabled: !!toWarehouseId,
  });

  const handleSubmit = () => {
    console.log("Handle submit called directly");
    console.log("Selected items:", selectedItems);
    console.log("From warehouse:", fromWarehouseId);
    console.log("To warehouse:", toWarehouseId);
    
    if (!fromWarehouseId || !toWarehouseId) {
      console.error("Missing warehouse IDs");
      return;
    }
    
    if (selectedItems.length === 0) {
      console.error("No items selected");
      return;
    }
    
    const submitData = {
      fromLocationId: fromWarehouseId,
      toLocationId: toWarehouseId,
      notes: notes,
      items: selectedItems
    };
    
    console.log("Submitting transfer data:", submitData);
    onSubmit(submitData);
  };

  const addItem = (productId: number, quantity: number) => {
    const existingIndex = selectedItems.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity = quantity;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { productId, quantity }]);
    }
  };

  const removeItem = (productId: number) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Пакетное перемещение товаров</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Warehouse Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Со склада
              </label>
              <select
                value={fromWarehouseId || ''}
                onChange={(e) => setFromWarehouseId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите склад</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                На склад
              </label>
              <select
                value={toWarehouseId || ''}
                onChange={(e) => setToWarehouseId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите склад</option>
                {warehouses.filter(w => w.id !== fromWarehouseId).map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory Display */}
          {fromWarehouseId && toWarehouseId && (
            <div className="grid grid-cols-2 gap-6">
              {/* Source Warehouse Inventory */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Товары на складе-отправителе
                </h3>
                <div className="border rounded-lg">
                  <div className="max-h-60 overflow-y-auto">
                    {fromInventory.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">Товары не найдены</div>
                    ) : (
                      fromInventory.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        const selectedItem = selectedItems.find(si => si.productId === item.productId);
                        return (
                          <div key={item.id} className="p-3 border-b flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-medium">{product?.name}</div>
                              <div className="text-sm text-gray-500">
                                Доступно: {item.quantity} {product?.unit}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                placeholder="Кол-во"
                                value={selectedItem?.quantity || ''}
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value);
                                  if (qty > 0 && qty <= item.quantity) {
                                    addItem(item.productId, qty);
                                  }
                                }}
                                className="w-20 px-2 py-1 border rounded text-sm"
                              />
                              {selectedItem && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.productId)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Destination Warehouse Inventory */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Товары на складе-получателе
                </h3>
                <div className="border rounded-lg">
                  <div className="max-h-60 overflow-y-auto">
                    {toInventory.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">Товары не найдены</div>
                    ) : (
                      toInventory.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <div key={item.id} className="p-3 border-b">
                            <div className="font-medium">{product?.name}</div>
                            <div className="text-sm text-gray-500">
                              Текущий остаток: {item.quantity} {product?.unit}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Выбранные товары для перемещения ({selectedItems.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-3">
                {selectedItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex justify-between items-center py-1">
                      <span>{product?.name}</span>
                      <span className="font-medium">{item.quantity} {product?.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Примечания (необязательно)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Добавьте примечания к перемещению..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              disabled={isLoading || !fromWarehouseId || !toWarehouseId || selectedItems.length === 0}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSubmit}
            >
              {isLoading ? 'Перемещение...' : `Переместить ${selectedItems.length} товаров`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warehouses;