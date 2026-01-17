import React, { useState } from 'react';
import { Store, MapPin, Search, Package, Truck, ShoppingCart, Edit, Plus, ArrowRight, TrendingUp, BarChart, Calendar, Filter } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Store as StoreType, Warehouse, Product, Inventory, Transaction, insertTransactionSchema, insertTransactionItemSchema } from '@shared/schema';

// Form schemas
const deliverySchema = z.object({
  fromLocationId: z.number(),
  toLocationId: z.number(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
  })).min(1),
});

const saleSchema = z.object({
  storeId: z.number(),
  customerName: z.string().min(1, "Имя покупателя обязательно"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })).min(1),
});

const storeSchema = z.object({
  name: z.string().min(1, 'Название магазина обязательно'),
  region: z.string().min(1, 'Регион обязателен'),
  address: z.string().min(1, 'Адрес обязателен'),
  type: z.string().min(1, 'Тип магазина обязателен'),
  managerId: z.number().optional(),
  warehouseId: z.number().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;
type SaleFormData = z.infer<typeof saleSchema>;
type StoreFormData = z.infer<typeof storeSchema>;

type StoreWithStats = StoreType & {
  manager?: { name: string };
  warehouse?: Warehouse;
  inventory?: Inventory[];
  totalProducts?: number;
  recentTransactions?: Transaction[];
};

const Stores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showSalesHistoryModal, setShowSalesHistoryModal] = useState(false);
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const { toast } = useToast();

  // Data queries
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['/api/stores'],
    queryFn: () => apiRequest('/api/stores')
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiRequest('/api/warehouses')
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products')
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['/api/inventory'],
    queryFn: () => apiRequest('/api/inventory')
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => apiRequest('/api/transactions')
  });

  // Store inventory query
  const { data: storeInventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/inventory', selectedStore?.id, 'store'],
    queryFn: () => apiRequest(`/api/inventory/${selectedStore?.id}/store`),
    enabled: !!selectedStore
  });

  // Delivery mutation
  const deliveryMutation = useMutation({
    mutationFn: (data: DeliveryFormData) => 
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'transfer',
          fromLocationId: data.fromLocationId,
          fromLocationType: 'warehouse',
          toLocationId: data.toLocationId,
          toLocationType: 'store',
          notes: data.notes || '',
          items: data.items
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/in-transit'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/detailed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      // Invalidate specific warehouse and store inventories
      warehouses.forEach((warehouse: any) => {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory', warehouse.id, 'warehouse'] });
      });
      stores.forEach((store: any) => {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory', store.id, 'store'] });
      });
      toast({ title: 'Доставка выполнена успешно' });
      setTimeout(() => {
        setShowDeliveryModal(false);
      }, 1500);
    },
    onError: () => {
      toast({ title: 'Ошибка при выполнении доставки', variant: 'destructive' });
    }
  });

  const { data: inTransitTransactions = [] } = useQuery({
    queryKey: ['/api/transactions/in-transit'],
    queryFn: () => apiRequest('/api/transactions/in-transit'),
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
      // Invalidate specific store inventory
      stores.forEach((store: any) => {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory', store.id, 'store'] });
      });
      toast({ title: 'Поставка подтверждена' });
    },
  });

  // Sale mutation
  const saleMutation = useMutation({
    mutationFn: (data: SaleFormData) => 
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'sale',
          fromLocationId: data.storeId,
          fromLocationType: 'store',
          toLocationId: null,
          toLocationType: null,
          notes: `Продажа: ${data.customerName}${data.customerPhone ? ` (${data.customerPhone})` : ''}${data.notes ? `. ${data.notes}` : ''}`,
          items: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString()
          }))
        })
      }),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/detailed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      // Invalidate specific store inventory
      if (variables.storeId) {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory', variables.storeId, 'store'] });
      }
      toast({ title: 'Продажа зарегистрирована успешно' });
      setTimeout(() => {
        setShowSaleModal(false);
      }, 1500);
    },
    onError: () => {
      toast({ title: 'Ошибка при регистрации продажи', variant: 'destructive' });
    }
  });

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: (data: StoreFormData) => 
      apiRequest('/api/stores', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      setIsAddStoreModalOpen(false);
      toast({ title: 'Магазин создан успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при создании магазина', variant: 'destructive' });
    }
  });

  // Enhanced stores with stats
  const storesWithStats = stores.map((store: StoreType) => {
    const storeInventoryItems = inventory.filter(
      (item: Inventory) => item.locationId === store.id && item.locationType === 'store'
    );
    
    const totalProducts = storeInventoryItems.reduce((sum: number, item: Inventory) => sum + item.quantity, 0);
    
    const recentTransactions = transactions
      .filter((t: Transaction) => 
        (t.fromLocationId === store.id && t.fromLocationType === 'store') ||
        (t.toLocationId === store.id && t.toLocationType === 'store')
      )
      .slice(0, 5);

    const warehouse = warehouses.find((w: Warehouse) => w.id === store.warehouseId);

    return {
      ...store,
      inventory: storeInventoryItems,
      totalProducts,
      recentTransactions,
      warehouse
    };
  });

  // Filter stores
  const filteredStores = storesWithStats.filter((store: StoreWithStats) => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = !selectedCity || store.region === selectedCity;
    return matchesSearch && matchesRegion;
  });

  // Get unique regions
  const regions = Array.from(new Set(stores.map((store: StoreType) => store.region))) as string[];

  // Get region warehouses for delivery
  const getRegionWarehouses = (regionName: string) => {
    return warehouses.filter((warehouse: Warehouse) => warehouse.city === regionName);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Магазины</h1>
          <p className="text-gray-600">Управление розничными точками и продажами</p>
        </div>
        <button
          onClick={() => setIsAddStoreModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={16} />
          Добавить магазин
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск магазинов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Все регионы</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {storesLoading ? (
        <div className="text-center py-8">Загрузка магазинов...</div>
      ) : (
        <>
          {/* Stores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredStores.map((store: StoreWithStats) => {
              const storeInTransit = inTransitTransactions.filter((t: any) => 
                t.toLocationId === store.id && t.toLocationType === 'store'
              );
              
              return (
                <div key={store.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  {storeInTransit.length > 0 && (
                    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck size={16} className="text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Ожидает подтверждения поставок: {storeInTransit.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {storeInTransit.map((transaction: any) => (
                          <div key={transaction.id} className="bg-white rounded p-3 border border-yellow-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  Поставка #{transaction.id}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {transaction.type === 'delivery' ? 'От поставщика' : 
                                   transaction.type === 'transfer' ? `Со склада ${transaction.fromLocationName || `#${transaction.fromLocationId}`}` :
                                   'Перемещение товара'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {transaction.items?.length || 0} позиций • {new Date(transaction.createdAt).toLocaleDateString('ru-RU')}
                                </div>
                                {transaction.notes && (
                                  <div className="text-xs text-gray-600 mt-1 italic">
                                    {transaction.notes}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  console.log('Confirming delivery for store:', store.name, 'Transaction ID:', transaction.id);
                                  confirmDeliveryMutation.mutate(transaction.id);
                                }}
                                disabled={confirmDeliveryMutation.isPending}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 ml-3"
                              >
                                {confirmDeliveryMutation.isPending ? 'Подтверждение...' : 'Подтвердить'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin size={16} className="mr-1" />
                        <span className="text-sm">{store.address}, {store.region}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStore(store)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Товары</div>
                      <div className="text-xl font-bold text-blue-600">
                        {store.totalProducts || 0}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Склад</div>
                      <div className="text-sm font-medium text-green-600">
                        {store.warehouse?.name || 'Не назначен'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        console.log('Delivery button clicked for store:', store.name);
                        setSelectedStore(store);
                        setShowDeliveryModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Truck size={16} />
                      Доставка
                    </button>
                    <button
                      onClick={() => {
                        console.log('Sale button clicked for store:', store.name);
                        setSelectedStore(store);
                        setShowSaleModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Продажа
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStore(store);
                        setShowSalesHistoryModal(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <BarChart size={16} />
                      История
                    </button>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Store Details */}
          {selectedStore && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedStore.name}</h2>
                    <p className="text-gray-600">{selectedStore.address}, {selectedStore.region}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStore(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Store Inventory */}
              <div className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Товары в магазине</h3>
                {inventoryLoading ? (
                  <div className="text-center py-4">Загрузка...</div>
                ) : storeInventory.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">Товары не найдены</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Товар</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Количество</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Цена</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {storeInventory.map((item: Inventory) => {
                          const product = products.find((p: Product) => p.id === item.productId);
                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="font-medium text-gray-900">{product?.name}</div>
                                  <div className="text-sm text-gray-500">{product?.sku}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-900">{item.quantity}</td>
                              <td className="px-4 py-3 text-gray-900">{product?.price ? `₽${product.price}` : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedStore && (
        <DeliveryModal
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          onSubmit={(data: DeliveryFormData) => deliveryMutation.mutate(data)}
          store={selectedStore}
          warehouses={getRegionWarehouses(selectedStore.region)}
          products={products}
          isLoading={deliveryMutation.isPending}
        />
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedStore && (
        <SaleModal
          isOpen={showSaleModal}
          onClose={() => setShowSaleModal(false)}
          onSubmit={(data: SaleFormData) => saleMutation.mutate(data)}
          store={selectedStore}
          storeInventory={storeInventory}
          products={products}
          isLoading={saleMutation.isPending}
        />
      )}

      {/* Sales History Modal */}
      {showSalesHistoryModal && selectedStore && (
        <SalesHistoryModal
          isOpen={showSalesHistoryModal}
          onClose={() => setShowSalesHistoryModal(false)}
          store={selectedStore}
          products={products}
        />
      )}

      {/* Add Store Modal */}
      {isAddStoreModalOpen && (
        <AddStoreModal
          isOpen={isAddStoreModalOpen}
          onClose={() => setIsAddStoreModalOpen(false)}
          onSubmit={(data: StoreFormData) => createStoreMutation.mutate(data)}
          warehouses={warehouses}
          isLoading={createStoreMutation.isPending}
        />
      )}
    </div>
  );
};



// Delivery Modal Component
interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeliveryFormData) => void;
  store: StoreType;
  warehouses: Warehouse[];
  products: Product[];
  isLoading?: boolean;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  store,
  warehouses,
  products,
  isLoading = false
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ productId: number; quantity: number; maxQuantity: number }[]>([]);

  const { data: warehouseInventory = [] } = useQuery({
    queryKey: ['/api/inventory', selectedWarehouse?.id, 'warehouse'],
    queryFn: () => apiRequest(`/api/inventory/${selectedWarehouse?.id}/warehouse`),
    enabled: !!selectedWarehouse
  });

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      fromLocationId: selectedWarehouse?.id || 0,
      toLocationId: store.id,
      notes: '',
      items: []
    }
  });

  const handleSubmit = (data: DeliveryFormData) => {
    console.log('Delivery form submitted:', data, 'Selected items:', selectedItems, 'Warehouse:', selectedWarehouse);
    if (!selectedWarehouse) {
      console.log('No warehouse selected');
      return;
    }
    if (selectedItems.length === 0) {
      console.log('No items selected');
      return;
    }
    onSubmit({
      ...data,
      fromLocationId: selectedWarehouse.id,
      toLocationId: store.id,
      items: selectedItems
    });
  };

  const addItem = (productId: number) => {
    const inventory = warehouseInventory.find((item: Inventory) => item.productId === productId);
    const maxQuantity = inventory?.quantity || 0;
    
    if (maxQuantity > 0 && !selectedItems.find(item => item.productId === productId)) {
      setSelectedItems([...selectedItems, { productId, quantity: 1, maxQuantity }]);
    }
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    setSelectedItems(items =>
      items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setSelectedItems(items => items.filter(item => item.productId !== productId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Доставка в {store.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <form onSubmit={(e) => {
          console.log('Form submission event triggered');
          form.handleSubmit(handleSubmit)(e);
        }}>
          {/* Warehouse Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите склад ({store.region})
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  onClick={() => setSelectedWarehouse(warehouse)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedWarehouse?.id === warehouse.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <h3 className="font-medium">{warehouse.name}</h3>
                  <p className="text-sm text-gray-600">{warehouse.address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Available Products */}
          {selectedWarehouse && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Доступные товары</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {warehouseInventory.map((item: Inventory) => {
                  const product = products.find((p: Product) => p.id === item.productId);
                  const isSelected = selectedItems.some(si => si.productId === item.productId);
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-lg ${
                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{product?.name}</div>
                          <div className="text-sm text-gray-600">
                            Доступно: {item.quantity} шт.
                          </div>
                        </div>
                        {!isSelected ? (
                          <button
                            type="button"
                            onClick={() => addItem(item.productId)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            <Plus size={16} />
                          </button>
                        ) : (
                          <span className="text-green-600 font-medium">Выбрано</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Товары к доставке</h3>
              <div className="space-y-3">
                {selectedItems.map((item) => {
                  const product = products.find((p: Product) => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{product?.name}</div>
                        <div className="text-sm text-gray-600">Макс: {item.maxQuantity} шт.</div>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Примечания
            </label>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Дополнительная информация о доставке..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isLoading || !selectedWarehouse || selectedItems.length === 0}
              onClick={() => {
                console.log('Delivery submit button clicked', { selectedWarehouse, selectedItems, isLoading });
                if (selectedWarehouse && selectedItems.length > 0) {
                  const deliveryData = {
                    fromLocationId: selectedWarehouse.id,
                    toLocationId: store.id,
                    notes: form.getValues('notes') || '',
                    items: selectedItems
                  };
                  console.log('Submitting delivery data:', deliveryData);
                  onSubmit(deliveryData);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Выполнить доставку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sale Modal Component
interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData) => void;
  store: StoreType;
  storeInventory: Inventory[];
  products: Product[];
  isLoading?: boolean;
}

const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  store,
  storeInventory,
  products,
  isLoading = false
}) => {
  const [selectedItems, setSelectedItems] = useState<{ productId: number; quantity: number; price: number; maxQuantity: number }[]>([]);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      storeId: store.id,
      customerName: '',
      customerPhone: '',
      notes: '',
      items: []
    }
  });

  const handleSubmit = (data: SaleFormData) => {
    console.log('Sale form submitted:', data, 'Selected items:', selectedItems);
    console.log('Form errors:', form.formState.errors);
    if (selectedItems.length === 0) {
      console.log('No items selected for sale');
      return;
    }
    if (!data.customerName) {
      console.log('Customer name is required');
      return;
    }
    onSubmit({
      ...data,
      storeId: store.id,
      items: selectedItems
    });
  };

  const addItem = (productId: number) => {
    const inventory = storeInventory.find((item: Inventory) => item.productId === productId);
    const product = products.find((p: Product) => p.id === productId);
    const maxQuantity = inventory?.quantity || 0;
    const price = parseFloat(product?.price || '0');
    
    if (maxQuantity > 0 && !selectedItems.find(item => item.productId === productId)) {
      setSelectedItems([...selectedItems, { productId, quantity: 1, price, maxQuantity }]);
    }
  };

  const updateItem = (productId: number, field: 'quantity' | 'price', value: number) => {
    setSelectedItems(items =>
      items.map(item =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setSelectedItems(items => items.filter(item => item.productId !== productId));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Продажа в {store.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <form onSubmit={(e) => {
          console.log('Sale form submission event triggered');
          form.handleSubmit(handleSubmit)(e);
        }}>
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя покупателя *
              </label>
              <input
                {...form.register('customerName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите имя покупателя"
              />
              {form.formState.errors.customerName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.customerName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон покупателя
              </label>
              <input
                {...form.register('customerPhone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>

          {/* Available Products */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Товары в наличии</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
              {storeInventory.map((item: Inventory) => {
                const product = products.find((p: Product) => p.id === item.productId);
                const isSelected = selectedItems.some(si => si.productId === item.productId);
                
                return (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg ${
                      isSelected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{product?.name}</div>
                        <div className="text-sm text-gray-600">
                          В наличии: {item.quantity} шт. • ₽{product?.price || 0}
                        </div>
                      </div>
                      {!isSelected ? (
                        <button
                          type="button"
                          onClick={() => addItem(item.productId)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          <Plus size={16} />
                        </button>
                      ) : (
                        <span className="text-green-600 font-medium">Выбрано</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Товары к продаже</h3>
              <div className="space-y-3">
                {selectedItems.map((item) => {
                  const product = products.find((p: Product) => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{product?.name}</div>
                        <div className="text-sm text-gray-600">Макс: {item.maxQuantity} шт.</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.maxQuantity}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-gray-500">×</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(item.productId, 'price', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-gray-500">=</span>
                        <span className="font-medium w-20 text-right">₽{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {/* Total */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Итого:</span>
                  <span className="text-xl font-bold text-blue-600">₽{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Примечания
            </label>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Дополнительная информация о продаже..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isLoading || selectedItems.length === 0}
              onClick={() => {
                console.log('Sale submit button clicked', { selectedItems, isLoading, formState: form.formState });
                const customerName = form.getValues('customerName');
                const customerPhone = form.getValues('customerPhone');
                const notes = form.getValues('notes');
                
                if (!customerName) {
                  console.log('Customer name is required');
                  return;
                }
                
                if (selectedItems.length === 0) {
                  console.log('No items selected for sale');
                  return;
                }
                
                const saleData = {
                  storeId: store.id,
                  customerName,
                  customerPhone: customerPhone || '',
                  notes: notes || '',
                  items: selectedItems
                };
                
                console.log('Submitting sale data:', saleData);
                onSubmit(saleData);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Оформить продажу (₽{totalAmount.toFixed(2)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sales History Modal Component
interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: StoreType;
  products: Product[];
}

const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  store,
  products
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'history' | 'analytics'>('history');
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<any>(null);

  // Get detailed sales transactions for this store
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['/api/transactions/detailed'],
    queryFn: () => apiRequest('/api/transactions/detailed')
  });

  // Filter sales transactions for this store
  const salesTransactions = allTransactions.filter((t: any) => 
    t.type === 'sale' && t.fromLocationId === store.id
  );

  // Apply date and product filters
  const filteredTransactions = salesTransactions.filter((transaction: any) => {
    let matches = true;
    
    if (dateFrom) {
      const transactionDate = new Date(transaction.createdAt || '').toISOString().split('T')[0];
      matches = matches && transactionDate >= dateFrom;
    }
    
    if (dateTo) {
      const transactionDate = new Date(transaction.createdAt || '').toISOString().split('T')[0];
      matches = matches && transactionDate <= dateTo;
    }
    
    if (selectedProduct) {
      // Filter by actual product in transaction items
      matches = matches && transaction.items?.some((item: any) => item.productName === selectedProduct);
    }
    
    return matches;
  });

  // Calculate analytics from transaction items
  const analytics = {
    totalSales: filteredTransactions.length,
    totalRevenue: filteredTransactions.reduce((sum: number, t: any) => {
      return sum + (t.totalAmount || 0);
    }, 0),
    averageTransaction: 0,
    topProducts: [] as any[]
  };

  analytics.averageTransaction = analytics.totalSales > 0 ? analytics.totalRevenue / analytics.totalSales : 0;

  // Product sales statistics from transaction items
  const productStats = products.map(product => {
    let productSales = 0;
    let productRevenue = 0;
    
    filteredTransactions.forEach((transaction: any) => {
      const productItems = transaction.items?.filter((item: any) => item.productName === product.name) || [];
      if (productItems.length > 0) {
        productSales += 1;
        productRevenue += productItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      }
    });
    
    return {
      product: product.name,
      sales: productSales,
      revenue: productRevenue
    };
  }).filter(stat => stat.sales > 0).sort((a, b) => b.revenue - a.revenue);

  analytics.topProducts = productStats.slice(0, 5);

  // Filtered products for autocomplete
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  ).slice(0, 10);

  const handleProductSelect = (productName: string) => {
    setSelectedProduct(productName);
    setProductSearchTerm(productName);
    setShowProductDropdown(false);
  };

  const clearProductFilter = () => {
    setSelectedProduct('');
    setProductSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">История продаж - {store.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            <Package size={16} />
            История транзакций
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'analytics' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            <BarChart size={16} />
            Аналитика продаж
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Дата от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Дата до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter size={16} className="inline mr-1" />
              Товар
            </label>
            <div className="relative">
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                placeholder="Начните печатать название товара..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
              />
              {selectedProduct && (
                <button
                  onClick={clearProductFilter}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
              {showProductDropdown && productSearchTerm && filteredProducts.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product.name)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {viewMode === 'history' && (
          <div>
            <h3 className="text-lg font-medium mb-4">
              Транзакции продаж ({filteredTransactions.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-2 opacity-50" />
                  Транзакции не найдены
                </div>
              ) : (
                filteredTransactions.map((transaction: Transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-green-600">
                          Продажа #{transaction.id}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(transaction.createdAt || '').toLocaleString('ru-RU')}
                        </div>
                        <div className="text-sm text-gray-700 mt-2">
                          {transaction.notes}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="font-bold text-green-600">
                          ₽{((transaction as any).totalAmount || 0).toFixed(2)}
                        </div>
                        {(transaction as any).items && (transaction as any).items.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {(transaction as any).items.length} товар(ов)
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedTransactionDetails(transaction)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        >
                          Просмотр чека
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {viewMode === 'analytics' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Аналитика продаж</h3>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-blue-600 text-sm font-medium">Всего продаж</div>
                <div className="text-2xl font-bold text-blue-700">{analytics.totalSales}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-green-600 text-sm font-medium">Общая выручка</div>
                <div className="text-2xl font-bold text-green-700">₽{analytics.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-purple-600 text-sm font-medium">Средний чек</div>
                <div className="text-2xl font-bold text-purple-700">₽{analytics.averageTransaction.toFixed(2)}</div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium mb-4">Топ товары по выручке</h4>
              {analytics.topProducts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Данные по товарам отсутствуют
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.topProducts.map((stat, index) => (
                    <div key={stat.product} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stat.product}</div>
                          <div className="text-sm text-gray-600">{stat.sales} продаж</div>
                        </div>
                      </div>
                      <div className="font-bold text-green-600">
                        ₽{stat.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Закрыть
          </button>
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransactionDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Чек продажи #{selectedTransactionDetails.id}</h3>
              
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Дата: {new Date(selectedTransactionDetails.createdAt || '').toLocaleDateString('ru-RU')}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  {selectedTransactionDetails.notes}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-gray-700">Товары:</h4>
                {(selectedTransactionDetails as any).items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">₽{item.price} × {item.quantity}</div>
                    </div>
                    <div className="font-medium">₽{item.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Итого:</span>
                  <span className="text-green-600">₽{((selectedTransactionDetails as any).totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedTransactionDetails(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Store Modal Component
interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StoreFormData) => void;
  warehouses: Warehouse[];
  isLoading?: boolean;
}

const AddStoreModal: React.FC<AddStoreModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  warehouses,
  isLoading = false
}) => {
  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      region: '',
      address: '',
      type: '',
      managerId: undefined,
      warehouseId: undefined
    }
  });

  const handleSubmit = (data: StoreFormData) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Добавить новый магазин</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название магазина *
              </label>
              <input
                {...form.register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите название магазина"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Регион *
              </label>
              <input
                {...form.register('region')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Москва, Санкт-Петербург, Казань"
              />
              {form.formState.errors.region && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.region.message}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Адрес *
            </label>
            <input
              {...form.register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите полный адрес магазина"
            />
            {form.formState.errors.address && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип магазина *
              </label>
              <select
                {...form.register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите тип</option>
                <option value="Флагман">Флагман</option>
                <option value="Стандарт">Стандарт</option>
                <option value="Премиум">Премиум</option>
              </select>
              {form.formState.errors.type && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Назначенный склад
              </label>
              <select
                {...form.register('warehouseId', { 
                  setValueAs: (value) => value === '' ? undefined : parseInt(value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите склад (опционально)</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Создать магазин
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Stores;