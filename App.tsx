
// Import React to fix "Cannot find namespace 'React'" error
import React, { useState, useEffect } from 'react';
import { UploadPage } from './pages/UploadPage';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProcedureList } from './pages/ProcedureList';
import { ExportPage } from './pages/ExportPage';
import { Project } from './types';
import { RefreshCw, Sun, Moon, Sunset, Lock, FileDown } from 'lucide-react';
import { getAllProjects, saveProjectToDB, saveBulkProjects } from './services/dbService';

type ThemeMode = 'light' | 'dim' | 'dark';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [appState, setAppState] = useState<'loading' | 'empty' | 'dashboard' | 'detail' | 'procedures' | 'export' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'dim');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'dim') root.classList.add('dark', 'dim');
  }, [theme]);

  useEffect(() => {
    const handleStorageError = (e: any) => {
      setErrorMessage(e.detail?.message || "Erreur de stockage détectée.");
    };
    window.addEventListener('supabase-storage-error' as any, handleStorageError);
    return () => window.removeEventListener('supabase-storage-error' as any, handleStorageError);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setAppState('loading');
    setErrorMessage("");
    try {
      const storedProjects = await getAllProjects();
      setProjects(storedProjects);
      if (storedProjects.length > 0) {
        if (!silent) setAppState('dashboard');
      } else {
        if (!silent) setAppState('empty');
      }
    } catch (error: any) {
      console.error("Initial Load Error:", error);
      const msg = error.message || "Erreur de connexion à la base de données.";
      setErrorMessage(msg);
      if (!silent) setAppState('empty');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataLoaded = async (data: Project[]) => {
    try {
      await saveBulkProjects(data);
      setProjects(data);
      setAppState('dashboard');
    } catch (e: any) {
      setErrorMessage(e.message || "Erreur lors de la sauvegarde initiale.");
    }
  };

  const handleSaveProject = async (updatedProject: Project) => {
    try {
      await saveProjectToDB(updatedProject);
      setProjects(prev => prev.map(p => p.ID === updatedProject.ID ? updatedProject : p));
      setSelectedProject(updatedProject);
      loadData(true);
    } catch (e: any) {
      alert("Erreur de sauvegarde : " + e.message);
    }
  };

  const handleOpenProcedure = (projectId: string, procId: string) => {
    const project = projects.find(p => p.ID === projectId);
    if (project) {
      setSelectedProject(project);
      setSelectedProcedureId(procId);
      setAppState('detail');
    }
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-primary p-6 text-center">
         <RefreshCw className="animate-spin w-10 h-10 mb-4" />
         <p className="font-bold text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setAppState('dashboard'); setSelectedProcedureId(null); }}>
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4d/Logo_AFPA.svg" alt="AFPA" className="h-7 w-auto" />
              </div>
              <span className="text-xl font-bold text-primary dark:text-secondary">GestProjet</span>
            </div>
            {appState !== 'empty' && (
              <nav className="flex space-x-4">
                <button onClick={() => { setAppState('dashboard'); setSelectedProcedureId(null); }} className={`px-3 py-2 rounded text-sm font-bold ${appState === 'dashboard' ? 'text-primary' : 'text-gray-400'}`}>Dashboard</button>
                <button onClick={() => { setAppState('procedures'); setSelectedProcedureId(null); }} className={`px-3 py-2 rounded text-sm font-bold ${appState === 'procedures' ? 'text-primary' : 'text-gray-400'}`}>Procédures</button>
                <button onClick={() => { setAppState('export'); setSelectedProcedureId(null); }} className={`px-3 py-2 rounded text-sm font-bold flex items-center ${appState === 'export' ? 'text-primary' : 'text-gray-400'}`}>
                   <FileDown size={16} className="mr-1" /> Export
                </button>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'dim' : 'light')} className="text-gray-400 hover:text-primary">
              {theme === 'light' ? <Sun size={20}/> : theme === 'dim' ? <Sunset size={20}/> : <Moon size={20}/>}
            </button>
            <button onClick={() => loadData()} title="Recharger les données" className="text-gray-400 hover:text-primary"><RefreshCw size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {appState === 'empty' && (
          <div className="flex flex-col items-center justify-center space-y-8 mt-10">
            {errorMessage && (
              <div className="w-full max-w-2xl p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-xl flex items-start shadow-lg">
                 <Lock className="text-amber-500 mr-4 shrink-0 mt-1" size={24} />
                 <div className="overflow-hidden">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 text-base">Problème de configuration</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-mono mt-2 break-all bg-white/50 dark:bg-black/30 p-2 rounded">
                        {errorMessage}
                    </p>
                 </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
                <UploadPage onDataLoaded={handleDataLoaded} />
              </div>
              <div className="bg-primary p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center text-white">
                 <h3 className="text-xl font-bold mb-4">Initialiser manuellement</h3>
                 <button onClick={() => {
                   setSelectedProject({ ID: "1", "Titre du dossier": "Nouveau Projet", procedures: [] } as any);
                   setSelectedProcedureId(null);
                   setAppState('detail');
                 }} className="px-8 py-3 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-colors">Créer un projet</button>
              </div>
            </div>
          </div>
        )}

        {appState === 'dashboard' && <ProjectList projects={projects} onSelectProject={(p) => { setSelectedProject(p); setSelectedProcedureId(null); setAppState('detail'); }} onCreateProject={() => { setSelectedProject({ ID: String(projects.length + 1), "Titre du dossier": "Nouveau Projet", procedures: [] } as any); setSelectedProcedureId(null); setAppState('detail'); }} />}
        {appState === 'detail' && selectedProject && <ProjectDetail project={selectedProject} allProjects={projects} onBack={() => { setAppState('dashboard'); setSelectedProcedureId(null); }} onSave={handleSaveProject} initialProcedureId={selectedProcedureId} />}
        {appState === 'procedures' && <ProcedureList projects={projects} onSaveProject={handleSaveProject} onNavigateToProcedure={handleOpenProcedure} />}
        {appState === 'export' && <ExportPage projects={projects} />}
      </main>
    </div>
  );
};

export default App;
