import React from 'react';
import { StatCardProps } from '../types';

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-gray-100 dark:border-gray-700 transition-colors" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 dark:bg-opacity-10`} style={{ backgroundColor: `${color}20`, color: color }}>
          {icon}
        </div>
      </div>
    </div>
  );
};