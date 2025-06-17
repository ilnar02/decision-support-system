import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import './InTransit.css';

type TransactionItem = {
  id: number;
  productId: number;
  quantity: number;
  price?: number;
};

type InTransitTransaction = {
  id: number;
  type: 'transfer' | 'delivery';
  status: 'in_transit';
  fromLocationId?: number;
  fromLocationType?: string;
  toLocationId?: number;
  toLocationType?: string;
  notes?: string;
  createdAt: string;
  items: TransactionItem[];
};

export default function InTransit() {
  const queryClient = useQueryClient();

  const { data: inTransitTransactions = [], isLoading } = useQuery({
    queryKey: ['/api/transactions/in-transit'],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['/api/warehouses'],
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['/api/stores'],
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
    },
  });

  const getLocationName = (locationId: number, locationType: string) => {
    if (locationType === 'warehouse') {
      const warehouse = warehouses.find((w: any) => w.id === locationId);
      return warehouse?.name || `Склад #${locationId}`;
    } else {
      const store = stores.find((s: any) => s.id === locationId);
      return store?.name || `Магазин #${locationId}`;
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find((p: any) => p.id === productId);
    return product?.name || `Товар #${productId}`;
  };

  const handleConfirmDelivery = (transactionId: number) => {
    confirmDeliveryMutation.mutate(transactionId);
  };

  if (isLoading) {
    return (
      <div className="in-transit-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка транзитных операций...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="in-transit-container">
      <div className="page-header">
        <h1>Товары в пути</h1>
        <p className="page-description">
          Отслеживание и подтверждение доставки товаров между складами и магазинами
        </p>
      </div>

      {inTransitTransactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Нет товаров в пути</h3>
          <p>Все операции перемещения завершены</p>
        </div>
      ) : (
        <div className="transactions-grid">
          {inTransitTransactions.map((transaction: InTransitTransaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-type">
                  <span className={`type-badge ${transaction.type}`}>
                    {transaction.type === 'transfer' ? 'Перемещение' : 'Доставка'}
                  </span>
                  <span className="status-badge in-transit">В пути</span>
                </div>
                <div className="transaction-date">
                  {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="transaction-route">
                <div className="route-point">
                  <div className="route-label">Откуда:</div>
                  <div className="route-location">
                    {transaction.fromLocationId 
                      ? getLocationName(transaction.fromLocationId, transaction.fromLocationType || 'warehouse')
                      : 'Поставщик'
                    }
                  </div>
                </div>
                <div className="route-arrow">→</div>
                <div className="route-point">
                  <div className="route-label">Куда:</div>
                  <div className="route-location">
                    {transaction.toLocationId 
                      ? getLocationName(transaction.toLocationId, transaction.toLocationType || 'warehouse')
                      : 'Неизвестно'
                    }
                  </div>
                </div>
              </div>

              <div className="transaction-items">
                <h4>Товары:</h4>
                <div className="items-list">
                  {transaction.items.map((item) => (
                    <div key={item.id} className="item-row">
                      <span className="item-name">{getProductName(item.productId)}</span>
                      <span className="item-quantity">{item.quantity} шт.</span>
                    </div>
                  ))}
                </div>
              </div>

              {transaction.notes && (
                <div className="transaction-notes">
                  <strong>Примечания:</strong> {transaction.notes}
                </div>
              )}

              <div className="transaction-actions">
                <button
                  className="confirm-delivery-btn"
                  onClick={() => handleConfirmDelivery(transaction.id)}
                  disabled={confirmDeliveryMutation.isPending}
                >
                  {confirmDeliveryMutation.isPending ? 'Подтверждение...' : 'Подтвердить доставку'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}