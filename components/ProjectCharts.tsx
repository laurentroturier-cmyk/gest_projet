import React from 'react';
import { Project } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

interface Props {
  projects: Project[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const ProjectCharts: React.FC<Props> = ({ projects }) => {
  
  // Prepare Status Data
  const statusCounts: Record<string, number> = {};
  projects.forEach(p => {
    const status = p["Statut du Dossier"] || "Non défini";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  const statusData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  })).sort((a, b) => b.value - a.value).slice(0, 6); // Top 6

  // Prepare Priority Data
  const priorityCounts: Record<string, number> = {};
  projects.forEach(p => {
    const prio = p["Priorité"] || "Non défini";
    priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
  });

  const priorityData = Object.keys(priorityCounts).map(key => ({
    name: key,
    value: priorityCounts[key]
  }));

  // Style partagé pour les tooltips (force le texte clair sur fond sombre)
  const tooltipContentStyle = {
    backgroundColor: '#1f2937', // dark:bg-gray-800
    border: '1px solid #374151', // dark:border-gray-700
    borderRadius: '0.5rem',
    color: '#f3f4f6', // text-gray-100
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };
  
  const tooltipItemStyle = {
    color: '#e5e7eb' // text-gray-200
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Répartition par Statut</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 10, fill: '#9ca3af'}} 
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} />
              <Tooltip 
                 contentStyle={tooltipContentStyle} 
                 itemStyle={tooltipItemStyle}
                 cursor={{fill: '#374151', opacity: 0.1}} 
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  className="fill-gray-600 dark:fill-gray-300 font-bold" 
                  fontSize={12}
                />
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Projets par Priorité</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <Tooltip 
                 contentStyle={tooltipContentStyle} 
                 itemStyle={tooltipItemStyle}
                 cursor={{fill: '#374151', opacity: 0.4}} 
              />
              <Bar dataKey="value" fill="#00553d" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};