import React, { useState } from 'react';
import { Store, MapPin, Search, Package, Truck, ShoppingCart, Edit, Plus, ArrowRight, TrendingUp } from 'lucide-react';
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

type DeliveryFormData = z.infer<typeof deliverySchema>;
type SaleFormData = z.infer<typeof saleSchema>;

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
      setShowDeliveryModal(false);
      toast({ title: 'Доставка выполнена успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при выполнении доставки', variant: 'destructive' });
    }
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
          items: data.items
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setShowSaleModal(false);
      toast({ title: 'Продажа зарегистрирована успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при регистрации продажи', variant: 'destructive' });
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
            {filteredStores.map((store: StoreWithStats) => (
              <div key={store.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log('Delivery button clicked for store:', store.name);
                        setSelectedStore(store);
                        setShowDeliveryModal(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Продажа
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Доставка в {selectedStore.name}</h2>
              <button 
                onClick={() => setShowDeliveryModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">Выберите склад из региона {selectedStore.region} для доставки товаров</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  // Create a test delivery transaction
                  deliveryMutation.mutate({
                    fromLocationId: 1,
                    toLocationId: selectedStore.id,
                    notes: 'Тестовая доставка',
                    items: [{ productId: 1, quantity: 5 }]
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Тестовая доставка
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Продажа в {selectedStore.name}</h2>
              <button 
                onClick={() => setShowSaleModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">Обработка продажи товаров из магазина</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaleModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  // Create a test sale transaction
                  saleMutation.mutate({
                    storeId: selectedStore.id,
                    customerName: 'Тестовый покупатель',
                    customerPhone: '+7 123 456 7890',
                    notes: 'Тестовая продажа',
                    items: [{ productId: 1, quantity: 2, price: 1500 }]
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Тестовая продажа
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default Stores;