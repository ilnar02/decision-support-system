import React from 'react';
import { ShoppingCart } from 'lucide-react';

const Transactions = () => {
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Управление транзакциями</h1>
          <p>Управление перемещением товаров между локациями</p>
        </div>
        <button className="btn btn-primary">
          <ShoppingCart size={16} />
          <span>Новая транзакция</span>
        </button>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">В разработке</h2>
        </div>
        <p>Модуль управления транзакциями находится в разработке.</p>
      </div>
    </div>
  );
};

export default Transactions;