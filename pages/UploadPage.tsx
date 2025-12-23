import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { parseExcel } from '../services/excelService';
import { Project } from '../types';

interface Props {
  onDataLoaded: (data: Project[], fileName: string) => void;
}

export const UploadPage: React.FC<Props> = ({ onDataLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcel(file);
      if (data.length === 0) {
        throw new Error("Le fichier semble vide ou mal formaté.");
      }
      onDataLoaded(data, file.name);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la lecture du fichier.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full">
        <div className="bg-green-100 dark:bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-6 h-6 text-primary dark:text-secondary" />
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Importer un Excel</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          Chargez vos données existantes pour remplir la base.
        </p>

        <div className="relative group cursor-pointer w-full">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 transition-all group-hover:border-primary group-hover:bg-green-50 dark:group-hover:bg-gray-700/50 flex flex-col items-center justify-center">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />
            
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-primary dark:text-secondary animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-secondary mb-2 transition-colors" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Choisir un fichier</span>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
    </div>
  );
};