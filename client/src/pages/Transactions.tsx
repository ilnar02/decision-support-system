import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Calendar, Package, Truck, ArrowRightLeft, ShoppingCart, Building, Warehouse, Store, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

// Transaction type configurations
const TRANSACTION_TYPES = {
  delivery: {
    label: 'Поставка от поставщика',
    icon: Truck,
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-green-200'
  },
  transfer: {
    label: 'Перемещение между складами',
    icon: ArrowRightLeft,
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-200'
  },
  sale: {
    label: 'Продажа в магазине',
    icon: ShoppingCart,
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-200'
  },
  incoming: {
    label: 'Поступление на склад (начальное)',
    icon: Package,
    color: 'bg-yellow-100 text-yellow-700',
    borderColor: 'border-yellow-200'
  }
};

interface Transaction {
  id: number;
  type: string;
  fromLocationId?: number;
  fromLocationType?: string;
  toLocationId?: number;
  toLocationType?: string;
  createdAt: string;
  items?: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: number;
    productName?: string;
    productSku?: string;
  }>;
  fromLocationName?: string;
  toLocationName?: string;
  totalAmount?: number;
  totalItems?: number;
}

const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Fetch data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions/detailed'],
    queryFn: () => apiRequest('/api/transactions/detailed')
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products')
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiRequest('/api/warehouses')
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['/api/stores'],
    queryFn: () => apiRequest('/api/stores')
  });

  // Enhanced transactions with calculated totals
  const enhancedTransactions = useMemo(() => {
    return transactions.map((transaction: Transaction) => {
      const totalAmount = transaction.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
      const totalItems = transaction.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      
      return {
        ...transaction,
        totalAmount,
        totalItems
      };
    });
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = enhancedTransactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((transaction: Transaction) =>
        transaction.fromLocationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.toLocationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.items?.some(item => 
          item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.productSku?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by transaction type
    if (selectedType) {
      filtered = filtered.filter((transaction: Transaction) => transaction.type === selectedType);
    }

    // Filter by warehouse
    if (selectedWarehouse) {
      const warehouseId = Number(selectedWarehouse);
      filtered = filtered.filter((transaction: Transaction) => 
        transaction.fromLocationId === warehouseId || transaction.toLocationId === warehouseId
      );
    }

    // Filter by store
    if (selectedStore) {
      const storeId = Number(selectedStore);
      filtered = filtered.filter((transaction: Transaction) => 
        (transaction.fromLocationId === storeId && transaction.fromLocationType === 'store') ||
        (transaction.toLocationId === storeId && transaction.toLocationType === 'store')
      );
    }

    // Filter by product
    if (selectedProduct) {
      const productId = Number(selectedProduct);
      filtered = filtered.filter((transaction: Transaction) =>
        transaction.items?.some(item => item.productId === productId)
      );
    }

    // Filter by date range
    if (startDate) {
      const start = startOfDay(new Date(startDate));
      filtered = filtered.filter((transaction: Transaction) => 
        isAfter(new Date(transaction.createdAt), start) || 
        new Date(transaction.createdAt).toDateString() === start.toDateString()
      );
    }

    if (endDate) {
      const end = endOfDay(new Date(endDate));
      filtered = filtered.filter((transaction: Transaction) => 
        isBefore(new Date(transaction.createdAt), end) ||
        new Date(transaction.createdAt).toDateString() === end.toDateString()
      );
    }

    return filtered.sort((a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [enhancedTransactions, searchTerm, selectedType, selectedWarehouse, selectedStore, selectedProduct, startDate, endDate]);

  // Statistics
  const statistics = useMemo(() => {
    const stats = {
      total: filteredTransactions.length,
      delivery: 0,
      transfer: 0,
      sale: 0,
      incoming: 0,
      totalValue: 0,
      totalItems: 0,
      avgTransactionValue: 0
    };

    filteredTransactions.forEach((transaction: Transaction) => {
      stats[transaction.type as keyof typeof stats] = (stats[transaction.type as keyof typeof stats] as number) + 1;
      stats.totalValue += transaction.totalAmount || 0;
      stats.totalItems += transaction.totalItems || 0;
    });

    stats.avgTransactionValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

    return stats;
  }, [filteredTransactions]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedWarehouse('');
    setSelectedStore('');
    setSelectedProduct('');
    setStartDate('');
    setEndDate('');
  };

  const getTransactionConfig = (type: string) => {
    return TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES] || {
      label: type,
      icon: Package,
      color: 'bg-gray-100 text-gray-700',
      borderColor: 'border-gray-200'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">История транзакций</h1>
          <p className="text-gray-600">Отслеживание всех перемещений товаров в системе</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего транзакций</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Общая стоимость</p>
              <p className="text-2xl font-bold text-gray-900">₽{statistics.totalValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Общее количество</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Средняя сумма</p>
              <p className="text-2xl font-bold text-gray-900">₽{statistics.avgTransactionValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Type Statistics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Статистика по типам транзакций</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(TRANSACTION_TYPES).map(([type, config]) => {
            const count = statistics[type as keyof typeof statistics] as number;
            const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0;
            const Icon = config.icon;
            
            return (
              <div key={type} className="text-center">
                <div className={`w-16 h-16 ${config.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={24} />
                </div>
                <p className="text-sm text-gray-600">{config.label}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} />
          <h3 className="text-lg font-semibold">Фильтры</h3>
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Очистить все
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Transaction Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все типы</option>
            {Object.entries(TRANSACTION_TYPES).map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>

          {/* Warehouse */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все склады</option>
            {warehouses.map((warehouse: any) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} - {warehouse.city}
              </option>
            ))}
          </select>

          {/* Store */}
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все магазины</option>
            {stores.map((store: any) => (
              <option key={store.id} value={store.id}>
                {store.name} - {store.city}
              </option>
            ))}
          </select>

          {/* Product */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все товары</option>
            {products.map((product: any) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Дата начала"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Дата окончания"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            Транзакции ({filteredTransactions.length})
          </h3>
        </div>

        {transactionsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Загрузка транзакций...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Транзакции не найдены
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction: Transaction) => {
              const config = getTransactionConfig(transaction.type);
              const Icon = config.icon;
              
              return (
                <div
                  key={transaction.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer border-l-4 ${config.borderColor}`}
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center`}>
                        <Icon size={20} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {config.label}
                          </h4>
                          <span className="text-xs text-gray-500">
                            #{transaction.id}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          {transaction.fromLocationName && (
                            <>
                              <span>{transaction.fromLocationName}</span>
                              <ArrowRightLeft size={14} />
                            </>
                          )}
                          {transaction.toLocationName && (
                            <span>{transaction.toLocationName}</span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(transaction.createdAt), 'dd.MM.yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ₽{(transaction.totalAmount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.totalItems} ед. товара
                      </p>
                      <button className="text-blue-600 hover:text-blue-800 text-xs mt-1 flex items-center gap-1">
                        <Eye size={12} />
                        Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Детали транзакции #{selectedTransaction.id}
              </h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Основная информация</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-600">Тип:</span> {getTransactionConfig(selectedTransaction.type).label}</div>
                  <div><span className="text-gray-600">Дата:</span> {format(new Date(selectedTransaction.createdAt), 'dd.MM.yyyy HH:mm')}</div>
                  {selectedTransaction.fromLocationName && (
                    <div><span className="text-gray-600">Откуда:</span> {selectedTransaction.fromLocationName}</div>
                  )}
                  {selectedTransaction.toLocationName && (
                    <div><span className="text-gray-600">Куда:</span> {selectedTransaction.toLocationName}</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Сводка</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-600">Общая стоимость:</span> ₽{(selectedTransaction.totalAmount || 0).toFixed(2)}</div>
                  <div><span className="text-gray-600">Количество товаров:</span> {selectedTransaction.totalItems}</div>
                  <div><span className="text-gray-600">Позиций в транзакции:</span> {selectedTransaction.items?.length || 0}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Товары в транзакции</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Товар</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Код</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Количество</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена за ед.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTransaction.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.productSku}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₽{item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₽{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;