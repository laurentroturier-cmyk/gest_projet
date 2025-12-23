
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Project, PurchaseProcedure, Attachment } from '../types';
import { 
  ArrowLeft, Save, Plus, Trash2, Edit, Calendar, Euro, FileText, Search, X, 
  ChevronDown, Loader2, RefreshCw, AlertTriangle, User, Check, Tag, Calculator, 
  LogOut, Info, ClipboardList, Settings, Briefcase, Eye, ChevronRight, BarChart3, 
  ShieldCheck, FileCheck, MessageSquare, Gavel, CheckCircle, Upload, Paperclip, Download, ExternalLink, FileIcon, Files
} from 'lucide-react';
import { getUniqueValues, formatCurrency, formatDateFr, normalizeDateInput } from '../utils';
import { searchCPVCodes, searchFamilies, searchSubFamilies, getTrigramByBuyerName, getAllBuyers } from '../services/dbService';
import { uploadFile, deleteFile } from '../services/storageService';

interface Props {
  project: Project;
  allProjects: Project[];
  onBack: () => void;
  onSave: (updatedProject: Project) => Promise<void>;
  initialProcedureId?: string | null;
}

type TabType = 'general' | 'no' | 'procedures' | 'documents';

/* --- COMPOSANTS INTERNES --- */

const InputField = ({ label, value, onChange, type = "text", fullWidth = false, badge = null, customColorClass = "" }: { label: string, value: string, onChange: (val: string) => void, type?: string, fullWidth?: boolean, badge?: React.ReactNode, customColorClass?: string }) => (
  <div className={`flex flex-col ${fullWidth ? 'col-span-2' : ''}`}>
    <label className={`text-xs font-semibold mb-1 uppercase tracking-wide flex justify-between items-center ${customColorClass ? customColorClass : 'text-gray-500 dark:text-gray-400'}`}>
      {label}
      {badge}
    </label>
    <input
      type={type}
      className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-secondary focus:border-primary dark:focus:border-secondary text-sm bg-white dark:bg-gray-800 transition-colors ${customColorClass ? customColorClass : 'text-gray-900 dark:text-gray-100'}`}
      value={type === 'date' ? normalizeDateInput(value) : (value || "")}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, fullWidth = false }: { label: string, value: string, onChange: (val: string) => void, fullWidth?: boolean }) => (
  <div className={`flex flex-col ${fullWidth ? 'col-span-2' : ''}`}>
    <label className="text-xs font-semibold mb-1 uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </label>
    <textarea
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-secondary focus:border-primary dark:focus:border-secondary text-sm bg-white dark:bg-gray-800 transition-colors text-gray-900 dark:text-gray-100 min-h-[100px]"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, isLoading = false }: { label: string, value: string, onChange: (val: string) => void, options: string[], isLoading?: boolean }) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide flex justify-between items-center">
      {label}
      {isLoading && <Loader2 size={12} className="animate-spin text-primary ml-2" />}
    </label>
    <select
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-secondary focus:border-primary dark:focus:border-secondary text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
    >
      <option value="">{isLoading ? "Chargement..." : "Sélectionner..."}</option>
      {!isLoading && options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const FileRow: React.FC<{ att: Attachment }> = ({ att }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const openFile = (att: Attachment) => {
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const isOfficeFile = officeExtensions.some(ext => att.name.toLowerCase().endsWith(ext));
    if (isOfficeFile) {
      const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(att.url)}`;
      window.open(viewerUrl, '_blank');
    } else {
      window.open(att.url, '_blank');
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm hover:border-primary/40 transition-all group">
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="bg-primary/5 p-2 rounded text-primary shrink-0">
          <FileIcon size={18} />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold truncate dark:text-white" title={att.name}>{att.name}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
            {formatSize(att.size)} • {formatDateFr(att.uploadedAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-1 ml-4 shrink-0">
        <button onClick={() => openFile(att)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 transition-colors">
          <Eye size={14} /> Ouvrir
        </button>
        <a href={att.url} download={att.name} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-600 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 transition-colors">
          <Download size={14} /> Télécharger
        </a>
      </div>
    </div>
  );
};

const FileManager = ({ 
  label, 
  attachments = [], 
  onAdd, 
  pathPrefix 
}: { 
  label: string, 
  attachments: Attachment[], 
  onAdd: (a: Attachment) => void, 
  pathPrefix: string
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uniqueName = `${Date.now()}_${file.name}`;
      const path = `${pathPrefix}/${uniqueName}`;
      const attachment = await uploadFile(file, path);
      onAdd(attachment);
    } catch (error: any) {
      alert("Erreur chargement : " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="col-span-2 space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label} ({attachments.length})
        </label>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-[10px] bg-primary text-white px-3 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-primaryLight transition-all disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Ajouter
        </button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </div>
      
      <div className="space-y-2">
        {attachments.length === 0 ? (
          <div className="py-4 text-center border border-dashed dark:border-gray-700 rounded-lg text-xs text-gray-400 italic">
            Aucun document chargé.
          </div>
        ) : (
          attachments.map((att, idx) => (
            <FileRow key={idx} att={att} />
          ))
        )}
      </div>
    </div>
  );
};

const AsyncSearchableSelect = ({ label, value, onChange, onSearch, placeholder = "Rechercher..." }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearchTerm(value || ""); }, [value]);

  useEffect(() => {
    const fetchOptions = async () => {
        if (!isOpen) return;
        setIsLoading(true);
        try {
            const results = await onSearch(searchTerm);
            setOptions(results);
        } catch { setOptions([]); } finally { setIsLoading(false); }
    };
    const timer = setTimeout(fetchOptions, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, onSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col relative" ref={wrapperRef}>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide flex justify-between">
         {label}
         {isLoading && <Loader2 size={10} className="animate-spin"/>}
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-secondary text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pr-8"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); onChange(e.target.value); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <ChevronDown size={16} className="text-gray-400"/>
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto top-[calc(100%)]">
            {options.length > 0 ? (
                <ul className="py-1">
                    {options.map((opt, idx) => (
                        <li key={idx} onClick={() => { onChange(opt); setSearchTerm(opt); setIsOpen(false); }} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{opt}</li>
                    ))}
                </ul>
            ) : <div className="p-3 text-sm text-gray-500">Aucun résultat.</div>}
        </div>
      )}
    </div>
  );
};

/* --- COMPOSANT PRINCIPAL --- */

export const ProjectDetail: React.FC<Props> = ({ project, allProjects, onBack, onSave, initialProcedureId }) => {
  const [formData, setFormData] = useState<Project>(project);
  const [activeTab, setActiveTab] = useState<TabType>(initialProcedureId ? 'procedures' : 'general');
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(initialProcedureId || null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState<string | null>(null);
  const [isSavingOnly, setIsSavingOnly] = useState(false);
  const [refBuyers, setRefBuyers] = useState<string[]>([]);
  const [isBuyersLoading, setIsBuyersLoading] = useState(true);
  
  const editFormRef = useRef<HTMLDivElement>(null);
  const baselineDataRef = useRef<string>(JSON.stringify(project));

  const loadBuyers = useCallback(async () => {
    setIsBuyersLoading(true);
    try {
      const list = await getAllBuyers();
      setRefBuyers(list.length > 0 ? list : getUniqueValues(allProjects, "Acheteur"));
    } finally { setIsBuyersLoading(false); }
  }, [allProjects]);

  useEffect(() => { loadBuyers(); }, [loadBuyers]);

  useEffect(() => {
    if (initialProcedureId && activeTab === 'procedures') {
      setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [initialProcedureId, activeTab]);

  const statuses = getUniqueValues(allProjects, "Statut du Dossier");
  const noStatuses = ["À faire", "En cours", "Validé CODIR", "Signé", "Abandonné", "N/A"];
  const priorities = getUniqueValues(allProjects, "Priorité");
  const procedureTypes = getUniqueValues(allProjects.flatMap(p => p.procedures || []), "Type de procédure");
  const yesNoOptions = ["Oui", "Non", "N/A"];
  const attributionStatuses = ["Attribué", "Infructueux", "Sans suite", "En cours", "Abandonné"];

  const parseAmount = (val: any): number => {
    if (!val) return 0;
    const valStr = String(val).replace(/\s/g, '').replace(',', '.').replace('€', '');
    const num = parseFloat(valStr);
    return isNaN(num) ? 0 : num;
  };

  const getProceduresTotalAmount = () => {
    if (!formData.procedures || !Array.isArray(formData.procedures)) return 0;
    return formData.procedures.reduce((acc, proc) => acc + parseAmount(proc["Montant prévisionnel du marché (€ HT)"]), 0);
  };

  const buildProcedureNumberString = async (prefix: string, objet: string, acheteurNom: string) => {
     const trigramme = await getTrigramByBuyerName(acheteurNom);
     return `${prefix.substring(0, 5)} - ${(objet || "").trim()} - ${trigramme}`;
  };

  const getNextProcedurePrefix = useCallback(() => {
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    let maxSeq = 499; 
    [...allProjects, formData].forEach(p => {
        p.procedures?.forEach(proc => {
            const match = (proc["Numéro de procédure (Afpa)"] || "").match(new RegExp(`^${currentYearShort}(\\d{3,})`));
            if (match) {
                const seq = parseInt(match[1], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        });
    });
    return `${currentYearShort}${maxSeq + 1}`;
  }, [allProjects, formData]);

  const handleRegenerateNumAfpa = async (procId: string) => {
    setIsRegenerating(true);
    const proc = formData.procedures.find(p => p.id === procId);
    if (!proc) { setIsRegenerating(false); return; }

    try {
        const prefix = getNextProcedurePrefix();
        const num = await buildProcedureNumberString(prefix, proc["Objet court"] || "", proc.Acheteur || formData.Acheteur);
        setFormData(prev => ({
            ...prev,
            procedures: prev.procedures.map(p => p.id === procId ? { ...p, "Numéro de procédure (Afpa)": num } : p)
        }));
    } finally {
        setIsRegenerating(false);
    }
  };

  const handleProcedureSave = async (procId: string) => {
    setIsSavingLocal(procId);
    try { 
        await onSave(formData); 
        baselineDataRef.current = JSON.stringify(formData);
        setTimeout(() => setIsSavingLocal(null), 1000); 
    } catch { setIsSavingLocal(null); }
  };

  const handleProjectOnlySave = async () => {
    setIsSavingOnly(true);
    try { 
        await onSave(formData); 
        baselineDataRef.current = JSON.stringify(formData);
        setTimeout(() => setIsSavingOnly(null), 1500); 
    } catch { setIsSavingOnly(false); }
  };

  const handleAddProcedure = async () => {
    const newId = `${formData.ID}-P${(formData.procedures?.length || 0) + 1}`;
    const generatedNum = await buildProcedureNumberString(getNextProcedurePrefix(), "", formData.Acheteur);
    const newProcedure: PurchaseProcedure = {
      id: newId, "Numéro de procédure (Afpa)": generatedNum, Acheteur: formData.Acheteur,
      "Type de procédure": "", "Code CPV Principal": "", "Montant prévisionnel du marché (€ HT)": "",
      "Sur 12 mois économie achat prévisionnelle (€)": "", "Forme du marché": "", "Objet court": "",
      "Date de lancement de la consultation": "", "Date de remise des candidatures": "", "Date de remise des offres": "", "7 Exécution Date de début": "",
      "7 Exécution Date de fin": "", "Date de Notification": "", "Durée du marché (en mois)": "",
      "Sous-Familles": [],
      "Nombre de retraits": "", "Nombre de soumissionnaires": "", "Nombre de questions": "",
      "Dispo sociales": "", "Dispo environnementales": "", "Projet ouvert à l'acquisition de solutions innovantes": "",
      "Projet facilitant l'accès aux TPE/PME": "", "Date d'écriture du DCE": "", "Date d'ouverture des offres": "",
      "RP - Date validation MSA": "", "RP - Date envoi signature élec": "", "RP - Date de validation du document": "", "RP - Date validation CODIR": "", "RP - Commentaire": "",
      "Date des Rejets": "", "Avis d'attribution": "", "Données essentielles": "", "Finalité de la consultation": "", "Statut de la consultation": ""
    };
    setFormData(prev => ({ ...prev, procedures: [...(prev.procedures || []), newProcedure] }));
    setEditingProcedureId(newId);
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleUpdateProcedure = async (id: string, field: keyof PurchaseProcedure, value: any) => {
    setFormData(prev => ({
        ...prev,
        procedures: prev.procedures.map(proc => proc.id === id ? { ...proc, [field]: value } : proc)
    }));
  };

  const handleSelectProcedure = (id: string) => {
    setEditingProcedureId(id);
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const activeProcedure = formData.procedures?.find(p => p.id === editingProcedureId);

  const globalTtcAmount = parseAmount(formData["Montant prévisionnel du marché (€ TTC)"]);
  const procedureSum = getProceduresTotalAmount();
  const isBudgetIssue = globalTtcAmount < procedureSum;
  const statusColorClass = isBudgetIssue ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== baselineDataRef.current;
  }, [formData]);

  const handleExitClick = () => {
    if (isDirty) {
      setShowExitConfirmModal(true);
    } else {
      onBack();
    }
  };

  const handleSaveAndExit = async () => {
    setIsSavingOnly(true);
    try {
      await onSave(formData);
      onBack();
    } catch (err) {
      alert("Erreur enregistrement.");
      setIsSavingOnly(false);
    }
  };

  const allAttachments = useMemo(() => {
    const list: { att: Attachment, source: string, sourceId: string }[] = [];
    formData.no_attachments?.forEach(a => list.push({ att: a, source: "Opportunité", sourceId: "NO" }));
    formData.procedures?.forEach(proc => {
        proc.rp_attachments?.forEach(a => list.push({ 
            att: a, 
            source: `Procédure ${proc.id}`, 
            sourceId: proc.id 
        }));
    });
    return list;
  }, [formData]);

  return (
    <div className="max-w-5xl mx-auto relative animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={handleExitClick} className="flex items-center text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Retour
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-10 border dark:border-gray-700">
        <div className="bg-primary dark:bg-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
             <div className="bg-white/20 p-1.5 rounded-lg">
                <Briefcase size={20} />
             </div>
             Projet {formData.ID}
          </h2>
          <div className="flex gap-2">
              <button type="button" onClick={handleProjectOnlySave} disabled={isSavingOnly} className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50">
                {isSavingOnly ? <Check size={18} className="mr-2 animate-bounce" /> : <Save size={18} />} Enregistrer
              </button>
              <button onClick={(e) => { e.preventDefault(); handleExitClick(); }} className="flex items-center bg-white text-primary px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-gray-50 transition-all">
                Quitter
              </button>
          </div>
        </div>

        <div className="flex border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 overflow-x-auto">
           <button 
             onClick={() => setActiveTab('general')}
             className={`px-6 py-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 shrink-0 ${activeTab === 'general' ? 'border-primary text-primary bg-white dark:bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
           >
              <Info size={16} /> Général
           </button>
           <button 
             onClick={() => setActiveTab('no')}
             className={`px-6 py-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 shrink-0 ${activeTab === 'no' ? 'border-primary text-primary bg-white dark:bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
           >
              <ClipboardList size={16} /> Opportunité
           </button>
           <button 
             onClick={() => setActiveTab('procedures')}
             className={`px-6 py-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 shrink-0 ${activeTab === 'procedures' ? 'border-primary text-primary bg-white dark:bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
           >
              <Settings size={16} /> Procédures
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md text-[9px] ml-1">
                 {formData.procedures?.length || 0}
              </span>
           </button>
           <button 
             onClick={() => setActiveTab('documents')}
             className={`px-6 py-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 shrink-0 ${activeTab === 'documents' ? 'border-primary text-primary bg-white dark:bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
           >
              <Files size={16} /> Documents
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[9px] ml-1">
                 {allAttachments.length}
              </span>
           </button>
        </div>

        <div className="p-8">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <h3 className="text-lg font-semibold dark:text-white mb-6 flex items-center gap-2">
                 <div className="w-1 h-6 bg-primary rounded-full" />
                 Informations Générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Titre du dossier" value={formData["Titre du dossier"]} onChange={(v) => setFormData(p => ({...p, "Titre du dossier": v}))} fullWidth />
                <SelectField label="Statut du Dossier" value={formData["Statut du Dossier"]} onChange={(v) => setFormData(p => ({...p, "Statut du Dossier": v}))} options={statuses} />
                <SelectField label="Priorité" value={formData["Priorité"]} onChange={(v) => setFormData(p => ({...p, "Priorité": v}))} options={priorities} />
                <SelectField label="Acheteur" value={formData["Acheteur"]} onChange={(v) => setFormData(p => ({...p, "Acheteur": v}))} options={refBuyers} isLoading={isBuyersLoading} />
                <AsyncSearchableSelect label="Famille Achat" value={formData["Famille Achat Principale"]} onChange={(v: string) => setFormData(p => ({...p, "Famille Achat Principale": v}))} onSearch={searchFamilies} />
                <InputField 
                  label="Montant prévisionnel global (€ TTC)" 
                  value={formData["Montant prévisionnel du marché (€ TTC)"]} 
                  onChange={(v) => setFormData(p => ({...p, "Montant prévisionnel du marché (€ TTC)": v}))} 
                  customColorClass={statusColorClass}
                  badge={
                    <span className={`flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${isBudgetIssue ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'}`}>
                      <Calculator size={10} className="mr-1" /> Procédures €TTC: {formatCurrency(procedureSum)}
                    </span>
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'no' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-lg font-semibold dark:text-white mb-6 flex items-center gap-2">
                 <div className="w-1 h-6 bg-secondary rounded-full" />
                 Note d'Opportunité (NO)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-2xl border dark:border-gray-700">
                  <InputField type="date" label="Date prévisionnelle" value={formData["NO - Date prévisionnelle"]} onChange={(v) => setFormData(p => ({...p, "NO - Date prévisionnelle": v}))} />
                  <SelectField label="Statut NO" value={formData["NO - Statut"]} onChange={(v) => setFormData(p => ({...p, "NO - Statut": v}))} options={noStatuses} />
                  
                  <InputField type="date" label="Date validation CODIR" value={formData["NO - Date validation CODIR"]} onChange={(v) => setFormData(p => ({...p, "NO - Date validation CODIR": v}))} />
                  <InputField type="date" label="Date envoi signature" value={formData["NO - Date envoi signature"]} onChange={(v) => setFormData(p => ({...p, "NO - Date envoi signature": v}))} />
                  
                  <InputField type="date" label="Date de validation du document" value={formData["NO - Date de validation du document"]} onChange={(v) => setFormData(p => ({...p, "NO - Date de validation du document": v}))} />
                  <InputField label="Nom des valideurs" value={formData["NO - Nom des valideurs"]} onChange={(v) => setFormData(p => ({...p, "NO - Nom des valideurs": v}))} />
                  
                  <TextAreaField label="Commentaire Note d'Opportunité" value={formData["NO - Commentaire"]} onChange={(v) => setFormData(p => ({...p, "NO - Commentaire": v}))} fullWidth />
                  
                  <div className="col-span-2 pt-4 border-t dark:border-gray-700 mt-2">
                     <FileManager 
                        label="Pièces Jointes Opportunité" 
                        attachments={formData.no_attachments || []} 
                        pathPrefix={`project_${formData.ID}/no`}
                        onAdd={(att) => setFormData(p => ({...p, no_attachments: [...(p.no_attachments || []), att]}))}
                     />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-semibold dark:text-white mb-6 flex items-center gap-2">
                 <div className="w-1 h-6 bg-blue-500 rounded-full" />
                 Tous les documents du dossier
              </h3>
              
              <div className="space-y-6">
                {allAttachments.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-gray-900/50">
                     <Files size={48} className="mx-auto text-gray-300 mb-4" />
                     <p className="text-gray-500 font-medium">Aucun document n'a encore été chargé pour ce projet.</p>
                     <p className="text-xs text-gray-400 mt-1">Vous pouvez ajouter des documents dans les onglets 'Opportunité' ou 'Procédures'.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                       <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase tracking-wider border-b dark:border-gray-700">
                          <tr>
                             <th className="py-3 px-4">Fichier</th>
                             <th className="py-3 px-4">Source</th>
                             <th className="py-3 px-4 text-center">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y dark:divide-gray-700">
                          {allAttachments.map((item, idx) => (
                             <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                <td className="py-3 px-4">
                                   <div className="flex items-center gap-2">
                                      <FileIcon size={14} className="text-primary" />
                                      <span className="font-bold text-gray-700 dark:text-gray-200 truncate max-w-xs">{item.att.name}</span>
                                   </div>
                                </td>
                                <td className="py-3 px-4">
                                   <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-[10px] font-bold text-gray-500">
                                      {item.source}
                                   </span>
                                </td>
                                <td className="py-3 px-4">
                                   <div className="flex justify-center gap-1">
                                      <button 
                                        onClick={() => {
                                          const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
                                          if (officeExtensions.some(ext => item.att.name.toLowerCase().endsWith(ext))) {
                                            window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(item.att.url)}`, '_blank');
                                          } else {
                                            window.open(item.att.url, '_blank');
                                          }
                                        }} 
                                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" 
                                        title="Ouvrir"
                                      >
                                         <Eye size={16} />
                                      </button>
                                      <a href={item.att.url} download={item.att.name} className="p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded" title="Télécharger">
                                         <Download size={16} />
                                      </a>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'procedures' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                   <div className="w-1 h-6 bg-primary rounded-full" />
                   Procédures du projet
                </h3>
                <button type="button" onClick={handleAddProcedure} className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/20 transition-all">
                  <Plus size={16} /> Ajouter une procédure
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {formData.procedures?.map((proc) => {
                  const isActive = editingProcedureId === proc.id;
                  const attachmentsCount = (proc.rp_attachments?.length || 0);
                  return (
                    <div 
                      key={proc.id} 
                      onClick={() => handleSelectProcedure(proc.id)} 
                      className={`cursor-pointer border-2 rounded-2xl p-5 transition-all relative group flex flex-col justify-between h-44 ${isActive ? 'border-primary ring-4 ring-primary/5 bg-primary/5' : 'border-gray-100 dark:border-gray-700 hover:border-primary/50 bg-white dark:bg-gray-800 shadow-sm'}`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider ${isActive ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                {proc.id}
                            </span>
                            {attachmentsCount > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                                    <Paperclip size={10} /> {attachmentsCount}
                                </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[9px] text-gray-400 font-mono mb-2 truncate">{proc["Numéro de procédure (Afpa)"]}</div>
                        <div className="text-xs font-bold line-clamp-2 dark:text-white leading-relaxed">{proc["Objet court"] || "Sans objet"}</div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-xs font-black text-primary dark:text-secondary">{formatCurrency(proc["Montant prévisionnel du marché (€ HT)"])} <span className="text-[10px] font-normal text-gray-400">HT</span></div>
                        <button className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}>
                          Modifier <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeProcedure && (
                <div 
                  ref={editFormRef} 
                  className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border-2 border-primary/20 dark:border-gray-700 shadow-inner animate-in slide-in-from-top-4 duration-500"
                >
                   <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary text-white rounded-xl">
                          <Edit size={20}/>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold dark:text-white">Détails de la procédure</h4>
                          <p className="text-xs text-gray-400 font-medium">{activeProcedure.id}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setEditingProcedureId(null)} className="p-2 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-full shadow-sm transition-colors border dark:border-gray-700">
                         <X size={20} />
                      </button>
                   </div>
                   
                   <div className="space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <SelectField label="Acheteur" value={activeProcedure.Acheteur} onChange={(v: string) => handleUpdateProcedure(activeProcedure.id, "Acheteur", v)} options={refBuyers} />
                          <SelectField label="Type" value={activeProcedure["Type de procédure"]} onChange={(v: string) => handleUpdateProcedure(activeProcedure.id, "Type de procédure", v)} options={procedureTypes} />
                          
                          <div className="flex flex-col">
                              <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">N° Afpa</label>
                              <div className="flex gap-2">
                                <input type="text" readOnly className="flex-1 px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 font-mono font-bold" value={activeProcedure["Numéro de procédure (Afpa)"] || ""} />
                                <button type="button" onClick={() => handleRegenerateNumAfpa(activeProcedure.id)} disabled={isRegenerating} className="px-4 bg-primary text-white rounded-lg hover:bg-primaryLight transition-all disabled:opacity-50">
                                  {isRegenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                </button>
                              </div>
                          </div>

                          <AsyncSearchableSelect label="Code CPV" value={activeProcedure["Code CPV Principal"]} onChange={(v: string) => handleUpdateProcedure(activeProcedure.id, "Code CPV Principal", v)} onSearch={searchCPVCodes} />
                          <InputField label="Objet court" value={activeProcedure["Objet court"]} onChange={(v: string) => handleUpdateProcedure(activeProcedure.id, "Objet court", v)} fullWidth />
                          
                          <InputField label="Montant (€ HT)" value={activeProcedure["Montant prévisionnel du marché (€ HT)"]} onChange={(v: string) => handleUpdateProcedure(activeProcedure.id, "Montant prévisionnel du marché (€ HT)", v)} />
                          <InputField label="Économie (€)" value={activeProcedure["Sur 12 mois économie achat prévisionnelle (€)"]} onChange={(v: string) => handleUpdateProcedure(activeProcedure.id, "Sur 12 mois économie achat prévisionnelle (€)", v)} />
                       </div>

                       <div className="bg-white/50 dark:bg-gray-800/30 p-6 rounded-2xl border dark:border-gray-700">
                          <h5 className="text-sm font-bold text-primary dark:text-secondary mb-4 flex items-center gap-2"><BarChart3 size={16} /> Indicateurs</h5>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                             <InputField label="Retraits" value={activeProcedure["Nombre de retraits"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Nombre de retraits", v)} />
                             <InputField label="Offres reçues" value={activeProcedure["Nombre de soumissionnaires"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Nombre de soumissionnaires", v)} />
                             <InputField type="date" label="DCE" value={activeProcedure["Date d'écriture du DCE"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Date d'écriture du DCE", v)} />
                             <InputField type="date" label="Remise Candidatures" value={activeProcedure["Date de remise des candidatures"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Date de remise des candidatures", v)} />
                             <InputField type="date" label="Remise Offres" value={activeProcedure["Date de remise des offres"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Date de remise des offres", v)} />
                             <InputField type="date" label="Ouverture Offres" value={activeProcedure["Date d'ouverture des offres"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Date d'ouverture des offres", v)} />
                          </div>
                       </div>

                       <div className="bg-white/50 dark:bg-gray-800/30 p-6 rounded-2xl border dark:border-gray-700">
                          <h5 className="text-sm font-bold text-primary dark:text-secondary mb-4 flex items-center gap-2"><ShieldCheck size={16} /> Informations DAE</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <SelectField label="Sociales" value={activeProcedure["Dispo sociales"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Dispo sociales", v)} options={yesNoOptions} />
                             <SelectField label="Environnement" value={activeProcedure["Dispo environnementales"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Dispo environnementales", v)} options={yesNoOptions} />
                             <SelectField label="Innovation" value={activeProcedure["Projet ouvert à l'acquisition de solutions innovantes"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Projet ouvert à l'acquisition de solutions innovantes", v)} options={yesNoOptions} />
                             <SelectField label="Accès TPE/PME" value={activeProcedure["Projet facilitant l'accès aux TPE/PME"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Projet facilitant l'accès aux TPE/PME", v)} options={yesNoOptions} />
                          </div>
                       </div>

                       <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                          <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                             <FileCheck size={16} /> Rapport de Présentation (RP)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <InputField type="date" label="Validation MSA" value={activeProcedure["RP - Date validation MSA"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "RP - Date validation MSA", v)} />
                             <InputField type="date" label="Envoi signature élec" value={activeProcedure["RP - Date envoi signature élec"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "RP - Date envoi signature élec", v)} />
                             <InputField type="date" label="Validation document" value={activeProcedure["RP - Date de validation du document"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "RP - Date de validation du document", v)} />
                             <InputField type="date" label="Validation CODIR" value={activeProcedure["RP - Date validation CODIR"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "RP - Date validation CODIR", v)} />
                             <TextAreaField label="Commentaire RP" value={activeProcedure["RP - Commentaire"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "RP - Commentaire", v)} fullWidth />
                             
                             <div className="col-span-2 pt-4 border-t border-blue-100 dark:border-blue-800/50 mt-2">
                                <FileManager 
                                    label="Documents du Rapport de Présentation" 
                                    attachments={activeProcedure.rp_attachments || []} 
                                    pathPrefix={`project_${formData.ID}/procedure_${activeProcedure.id}/rp`}
                                    onAdd={(att) => handleUpdateProcedure(activeProcedure.id, "rp_attachments", [...(activeProcedure.rp_attachments || []), att])}
                                />
                             </div>
                          </div>
                       </div>

                       <div className="bg-green-50/50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-800">
                          <h5 className="text-sm font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                             <CheckCircle size={16} /> Attribution
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <InputField type="date" label="Date des Rejets" value={activeProcedure["Date des Rejets"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Date des Rejets", v)} />
                             <InputField type="date" label="Avis d'attribution" value={activeProcedure["Avis d'attribution"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Avis d'attribution", v)} />
                             <InputField type="date" label="Données essentielles" value={activeProcedure["Données essentielles"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Données essentielles", v)} />
                             <SelectField label="Statut de la consultation" value={activeProcedure["Statut de la consultation"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Statut de la consultation", v)} options={attributionStatuses} />
                             <TextAreaField label="Finalité de la consultation" value={activeProcedure["Finalité de la consultation"]} onChange={(v) => handleUpdateProcedure(activeProcedure.id, "Finalité de la consultation", v)} fullWidth />
                          </div>
                       </div>
                   </div>

                   <div className="flex justify-end items-center pt-8 mt-10 border-t dark:border-gray-700">
                      <button type="button" onClick={() => handleProcedureSave(activeProcedure.id)} className="flex items-center gap-3 bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-xl transition-all">
                        {isSavingLocal === activeProcedure.id ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Sauvegarder
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showExitConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-md w-full border dark:border-gray-700 shadow-2xl">
              <h3 className="text-xl font-bold dark:text-white mb-2">Modifications non enregistrées</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Voulez-vous enregistrer avant de quitter ?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleSaveAndExit} className="w-full py-3 bg-primary text-white rounded-xl font-bold">Enregistrer et quitter</button>
                 <button onClick={onBack} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold">Ignorer</button>
                 <button onClick={() => setShowExitConfirmModal(false)} className="w-full py-3 text-gray-500 font-medium">Annuler</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
