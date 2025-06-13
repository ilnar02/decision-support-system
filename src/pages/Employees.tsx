import React from 'react';
import { Users } from 'lucide-react';

const Employees = () => {
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Управление сотрудниками</h1>
          <p>Управление учетными записями, ролями и правами сотрудников</p>
        </div>
        <button className="btn btn-primary">
          <Users size={16} />
          <span>Добавить сотрудника</span>
        </button>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">В разработке</h2>
        </div>
        <p>Модуль управления сотрудниками находится в разработке.</p>
      </div>
    </div>
  );
};

export default Employees;