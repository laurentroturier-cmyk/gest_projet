
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project } from '../types';
import { Search, Edit2, Wallet, Briefcase, AlertCircle, CheckCircle2, Plus, X, Calculator, Filter, ChevronDown, CheckSquare, Square, BarChart3 } from 'lucide-react';
import { formatCurrency, getUniqueValues } from '../utils';
import { StatCard } from '../components/StatCard';
import { ProjectCharts } from '../components/ProjectCharts';

interface Props {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
}

export const ProjectList: React.FC<Props> = ({ projects = [], onSelectProject, onCreateProject }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [buyerFilter, setBuyerFilter] = useState("All");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const availableStatuses = useMemo(() => getUniqueValues(projects, "Statut du Dossier"), [projects]);
  const buyers = useMemo(() => getUniqueValues(projects, "Acheteur"), [projects]);

  // Initialisation des statuts sélectionnés au démarrage ou lors du chargement de données
  useEffect(() => {
    if (availableStatuses.length > 0 && selectedStatuses.length === 0) {
      const defaultSelection = availableStatuses.filter(s => {
        const lower = s.toLowerCase();
        // Exclure "Terminé" et "Abandonné" (et variantes)
        return !lower.includes("terminé") && !lower.includes("abandonné");
      });
      setSelectedStatuses(defaultSelection);
    }
  }, [availableStatuses]);

  // Gestion du clic extérieur pour fermer le menu des statuts
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredProjects = useMemo(() => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    const filtered = safeProjects.filter(p => {
      if (!p) return false;
      const searchLower = searchTerm.toLowerCase().trim();
      const title = String(p["Titre du dossier"] || "").toLowerCase();
      const id = String(p["ID"] || "").toLowerCase();
      
      const matchesSearch = !searchLower || title.includes(searchLower) || id.includes(searchLower);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(p["Statut du Dossier"]);
      const matchesBuyer = buyerFilter === "All" || p["Acheteur"] === buyerFilter;
      
      return matchesSearch && matchesStatus && matchesBuyer;
    });

    return filtered.sort((a, b) => String(b.ID).localeCompare(String(a.ID), undefined, { numeric: true }));
  }, [projects, searchTerm, selectedStatuses, buyerFilter]);

  const parseAmount = (val: any): number => {
    if (!val) return 0;
    const valStr = String(val).replace(/\s/g, '').replace(',', '.').replace('€', '');
    const num = parseFloat(valStr);
    return isNaN(num) ? 0 : num;
  };

  const getProjectGlobalAmount = (project: Project): number => {
    return parseAmount(project["Montant prévisionnel du marché (€ TTC)"]);
  };

  const getProceduresTotalAmount = (project: Project): number => {
    if (!project.procedures || !Array.isArray(project.procedures)) return 0;
    return project.procedures.reduce((acc, proc) => acc + parseAmount(proc["Montant prévisionnel du marché (€ HT)"]), 0);
  };

  const globalTotalAmount = useMemo(() => {
    return filteredProjects.reduce((acc, curr) => acc + getProjectGlobalAmount(curr), 0);
  }, [filteredProjects]);

  const globalProceduresAmount = useMemo(() => {
    return filteredProjects.reduce((acc, curr) => acc + getProceduresTotalAmount(curr), 0);
  }, [filteredProjects]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Projets affichés" value={filteredProjects.length} icon={<Briefcase size={20} />} color="#3b82f6" />
        <StatCard title="Total Projets (€)" value={formatCurrency(globalTotalAmount)} icon={<Wallet size={20} />} color="#10b981" />
        <StatCard title="Total Procédures (€)" value={formatCurrency(globalProceduresAmount)} icon={<BarChart3 size={20} />} color="#00553d" />
        <StatCard title="Priorité P1" value={filteredProjects.filter(p => String(p["Priorité"] || "").includes("P1")).length} icon={<AlertCircle size={20} />} color="#ef4444" />
        <StatCard title="Terminés (Total)" value={projects.filter(p => String(p["Statut du Dossier"] || "").toLowerCase().includes("terminé")).length} icon={<CheckCircle2 size={20} />} color="#8bc53f" />
      </div>

      <ProjectCharts projects={filteredProjects} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center mb-6">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par ID ou Titre..." 
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
            {/* Multi-Sélecteur de Statuts */}
            <div className="relative" ref={statusMenuRef}>
              <button 
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className={`flex items-center gap-2 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium transition-all ${selectedStatuses.length !== availableStatuses.length ? 'border-primary text-primary ring-2 ring-primary/10' : 'text-gray-700 dark:text-gray-300'}`}
              >
                <Filter size={16} />
                Statuts ({selectedStatuses.length}/{availableStatuses.length})
                <ChevronDown size={14} className={`transition-transform duration-200 ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="flex justify-between items-center px-3 py-2 border-b dark:border-gray-700 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtrer les dossiers</span>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedStatuses(availableStatuses)} className="text-[10px] text-primary font-bold hover:underline">Tout</button>
                        <button onClick={() => setSelectedStatuses([])} className="text-[10px] text-red-500 font-bold hover:underline">Aucun</button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    {availableStatuses.map(status => {
                      const isSelected = selectedStatuses.includes(status);
                      return (
                        <div 
                          key={status} 
                          onClick={() => toggleStatus(status)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors group"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-primary shrink-0" />
                          ) : (
                            <Square size={18} className="text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-primary/50" />
                          )}
                          <span className={`text-sm truncate ${isSelected ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <select 
              className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary/20" 
              value={buyerFilter} 
              onChange={(e) => setBuyerFilter(e.target.value)}
            >
              <option value="All">Tous les acheteurs</option>
              {buyers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <button onClick={onCreateProject} className="bg-primary hover:bg-primaryLight text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-primary/10 flex items-center transition-all active:scale-95">
              <Plus size={18} className="mr-1" /> Nouveau Projet
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-gray-700 text-gray-400 text-[10px] uppercase tracking-wider font-bold">
                <th className="py-4 px-4">ID</th>
                <th className="py-4 px-4">Titre du dossier</th>
                <th className="py-4 px-4">Acheteur</th>
                <th className="py-4 px-4">Statut</th>
                <th className="py-4 px-4 text-right">Procédures (€)</th>
                <th className="py-4 px-4 text-right">Global (€)</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y dark:divide-gray-700">
              {filteredProjects.map((p) => {
                const globalAmount = getProjectGlobalAmount(p);
                const procAmount = getProceduresTotalAmount(p);
                const isUnderbudget = globalAmount < procAmount;
                const isCompleted = p["Statut du Dossier"].toLowerCase().includes("terminé");
                
                return (
                  <tr key={p.ID} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isCompleted ? 'opacity-70' : ''}`}>
                    <td className="py-4 px-4 font-bold text-primary dark:text-secondary">{p.ID}</td>
                    <td className="py-4 px-4 font-medium max-w-xs truncate" title={p["Titre du dossier"]}>{p["Titre du dossier"]}</td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{p.Acheteur || "-"}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                        p["Statut du Dossier"].toLowerCase().includes("abandonné") ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {p["Statut du Dossier"]}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {formatCurrency(procAmount)}
                    </td>
                    <td className={`py-4 px-4 text-right font-bold font-mono ${isUnderbudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(globalAmount)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => onSelectProject(p)} 
                        className="p-2 text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors"
                        title="Éditer le projet"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
                <Search size={32} />
              </div>
              <p className="text-gray-500 italic">Aucun projet ne correspond à vos filtres actuels</p>
              <button 
                onClick={() => { setSearchTerm(""); setSelectedStatuses(availableStatuses); setBuyerFilter("All"); }}
                className="text-xs text-primary font-bold hover:underline"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
