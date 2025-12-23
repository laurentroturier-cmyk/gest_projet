
import React, { useState, useMemo, useEffect } from 'react';
import { Project, PurchaseProcedure } from '../types';
import { Search, Plus, Filter, Briefcase, Euro, Calendar, Edit2, Trash2, X, Save, AlertTriangle, User, Tag, Eye, BarChart3, PieChart as PieIcon, Calculator, TrendingUp } from 'lucide-react';
import { formatCurrency, getUniqueValues } from '../utils';
import { getAllBuyers } from '../services/dbService';
import { StatCard } from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface Props {
  projects: Project[];
  onSaveProject: (updatedProject: Project) => void;
  onNavigateToProcedure: (projectId: string, procId: string) => void;
}

const COLORS = ['#00553d', '#8bc53f', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ProcedureList: React.FC<Props> = ({ projects, onSaveProject, onNavigateToProcedure }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [buyerFilter, setBuyerFilter] = useState("All"); 
  const [refBuyers, setRefBuyers] = useState<string[]>([]);

  useEffect(() => {
    getAllBuyers().then(list => setRefBuyers(list));
  }, []);

  const allProcedures = useMemo(() => {
    const flatList: any[] = [];
    projects.forEach(proj => {
        proj.procedures?.forEach(proc => {
            flatList.push({
                procedure: proc,
                projectId: proj.ID,
                projectTitle: proj["Titre du dossier"],
                projectBuyer: proj.Acheteur
            });
        });
    });
    return flatList;
  }, [projects]);

  const parseAmount = (val: any): number => {
    if (!val) return 0;
    const valStr = String(val).replace(/\s/g, '').replace(',', '.').replace('€', '');
    const num = parseFloat(valStr);
    return isNaN(num) ? 0 : num;
  };

  const filteredProcedures = useMemo(() => {
    return allProcedures.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const matchSearch = item.procedure.id.toLowerCase().includes(searchLower) ||
            (item.procedure["Numéro de procédure (Afpa)"] || "").toLowerCase().includes(searchLower) ||
            item.projectTitle.toLowerCase().includes(searchLower) ||
            (item.procedure["Objet court"] || "").toLowerCase().includes(searchLower);

        const matchType = typeFilter === "All" || item.procedure["Type de procédure"] === typeFilter;
        const matchBuyer = buyerFilter === "All" || item.procedure.Acheteur === buyerFilter;

        return matchSearch && matchType && matchBuyer;
    }).sort((a, b) => String(b.procedure.id).localeCompare(String(a.procedure.id), undefined, { numeric: true }));
  }, [allProcedures, searchTerm, typeFilter, buyerFilter]);

  // Statistiques
  const stats = useMemo(() => {
    const count = filteredProcedures.length;
    const total = filteredProcedures.reduce((acc, curr) => acc + parseAmount(curr.procedure["Montant prévisionnel du marché (€ HT)"]), 0);
    const average = count > 0 ? total / count : 0;
    return { count, total, average };
  }, [filteredProcedures]);

  // Données Graphiques
  const chartData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const buyerCounts: Record<string, number> = {};

    filteredProcedures.forEach(item => {
      const type = item.procedure["Type de procédure"] || "Non défini";
      const buyer = item.procedure.Acheteur || "Non assigné";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      buyerCounts[buyer] = (buyerCounts[buyer] || 0) + 1;
    });

    const types = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const buyers = Object.entries(buyerCounts).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);

    return { types, buyers };
  }, [filteredProcedures]);

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    color: '#f3f4f6'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
           <div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                   <Briefcase className="mr-2 text-primary" /> Suivi des Procédures
               </h2>
               <p className="text-gray-500 text-sm">Vue consolidée du portefeuille</p>
           </div>
       </div>

       {/* KPI CARDS */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Nombre de procédures" 
            value={stats.count} 
            icon={<TrendingUp size={24} />} 
            color="#3b82f6" 
          />
          <StatCard 
            title="Montant total cumulé (€)" 
            value={formatCurrency(stats.total)} 
            icon={<Euro size={24} />} 
            color="#00553d" 
          />
          <StatCard 
            title="Montant moyen / Procédure" 
            value={formatCurrency(stats.average)} 
            icon={<Calculator size={24} />} 
            color="#8bc53f" 
          />
       </div>

       {/* CHARTS SECTION */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <PieIcon size={16} className="text-primary" /> Répartition par Type
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.types} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="value" position="right" style={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                    {chartData.types.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <User size={16} className="text-primary" /> Top Acheteurs (Volume)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.buyers} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" tick={{fontSize: 9, fill: '#9ca3af'}} interval={0} height={40} />
                  <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#00553d" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" style={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
       </div>

       {/* FILTERS */}
       <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                type="text" 
                placeholder="Rechercher une procédure, un titre ou un ID..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
               />
           </div>
           <div className="flex gap-2 w-full md:w-auto">
               <select className="flex-1 md:flex-none px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                   <option value="All">Tous les types</option>
                   {getUniqueValues(allProcedures.map(p => p.procedure), "Type de procédure").map(t => <option key={t} value={t}>{t}</option>)}
               </select>
               <select className="flex-1 md:flex-none px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)}>
                   <option value="All">Tous les acheteurs</option>
                   {refBuyers.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
           </div>
       </div>

       {/* TABLE */}
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 border-b dark:border-gray-700">
                       <tr>
                           <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider">Procédure</th>
                           <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider">Objet</th>
                           <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider">Projet Parent</th>
                           <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider">Montant (€)</th>
                           <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y dark:divide-gray-700">
                       {filteredProcedures.map(({ procedure, projectId, projectTitle }, idx) => (
                           <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                               <td className="py-3 px-4">
                                   <div className="font-bold text-primary dark:text-secondary">{procedure.id}</div>
                                   <div className="text-[10px] text-gray-400 font-mono">{procedure["Numéro de procédure (Afpa)"]}</div>
                               </td>
                               <td className="py-3 px-4">
                                   <div className="font-semibold line-clamp-1 text-gray-800 dark:text-gray-200">{procedure["Objet court"] || "Sans objet"}</div>
                               </td>
                               <td className="py-3 px-4">
                                   <div className="text-xs font-bold line-clamp-1 text-gray-600 dark:text-gray-400">{projectTitle}</div>
                                   <div className="text-[10px] text-gray-400">ID: {projectId}</div>
                               </td>
                               <td className="py-3 px-4 text-right font-bold text-primary dark:text-secondary font-mono">
                                  {formatCurrency(procedure["Montant prévisionnel du marché (€ HT)"])}
                               </td>
                               <td className="py-3 px-4 text-center">
                                   <button 
                                     onClick={() => onNavigateToProcedure(projectId, procedure.id)}
                                     className="p-2 text-gray-400 hover:text-primary dark:hover:text-secondary hover:bg-primary/5 dark:hover:bg-white/5 rounded-full transition-all"
                                     title="Ouvrir la procédure"
                                   >
                                       <Eye size={18} />
                                   </button>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
               {filteredProcedures.length === 0 && (
                   <div className="py-16 text-center text-gray-400 italic">
                      Aucune procédure ne correspond à vos critères de recherche.
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};
