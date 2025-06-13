import React from 'react';
import { BarChart3 } from 'lucide-react';

const Reports = () => {
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Отчеты и аналитика</h1>
          <p>Анализ данных вашего бизнеса</p>
        </div>
        <button className="btn btn-primary">
          <BarChart3 size={16} />
          <span>Создать отчет</span>
        </button>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">В разработке</h2>
        </div>
        <p>Модуль отчетов и аналитики находится в разработке.</p>
      </div>
    </div>
  );
};

export default Reports;