
import React, { useState } from 'react';
import { Project } from '../types';
import { FileDown, Download, CheckCircle2, Table, Briefcase, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportProceduresFull } from '../services/excelService';

interface Props {
  projects: Project[];
}

export const ExportPage: React.FC<Props> = ({ projects }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const totalProcedures = projects.reduce((acc, p) => acc + (p.procedures?.length || 0), 0);

  const handleExport = () => {
    setIsExporting(true);
    // Petit délai pour l'effet visuel
    setTimeout(() => {
      try {
        exportProceduresFull(projects);
        setLastExport(new Date().toLocaleTimeString('fr-FR'));
      } catch (e) {
        console.error("Erreur export:", e);
        alert("Une erreur est survenue lors de l'exportation.");
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-primary dark:bg-gray-700 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl">
               <FileDown size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-bold">Extraction Portefeuille</h2>
               <p className="text-white/70 text-sm italic">Format Excel (XLSX) enrichi et trié</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600">
                  <Briefcase size={24} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Projets en base</p>
                   <p className="text-2xl font-black text-gray-800 dark:text-white">{projects.length}</p>
                </div>
             </div>

             <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600">
                  <Table size={24} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Procédures</p>
                   <p className="text-2xl font-black text-gray-800 dark:text-white">{totalProcedures}</p>
                </div>
             </div>
          </div>

          <div className="bg-primary/5 dark:bg-white/5 p-8 rounded-3xl border-2 border-dashed border-primary/20 dark:border-white/10 text-center">
             <div className="max-w-md mx-auto space-y-6">
                <div className="flex justify-center">
                   <div className="relative">
                      <FileSpreadsheet size={64} className="text-primary/40 dark:text-secondary/40" />
                      {lastExport && (
                         <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white dark:border-gray-800">
                            <CheckCircle2 size={16} />
                         </div>
                      )}
                   </div>
                </div>

                <div className="space-y-2">
                   <h3 className="text-lg font-bold text-gray-800 dark:text-white">Générer le rapport consolidé</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">
                      L'extraction contiendra toutes les données des projets liées à chaque ligne de procédure, triées par le numéro Afpa officiel.
                   </p>
                </div>

                <button 
                  onClick={handleExport}
                  disabled={isExporting || projects.length === 0}
                  className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primaryLight text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                   {isExporting ? (
                      <>
                        <Loader2 size={22} className="animate-spin" />
                        Génération en cours...
                      </>
                   ) : (
                      <>
                        <Download size={22} />
                        Télécharger l'Excel complet
                      </>
                   )}
                </button>

                {lastExport && (
                   <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Dernier export réussi à {lastExport}
                   </p>
                )}

                {projects.length === 0 && (
                   <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                      Aucune donnée disponible pour l'export.
                   </p>
                )}
             </div>
          </div>

          <div className="text-center">
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                Format compatible Microsoft Excel, Google Sheets et LibreOffice
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
