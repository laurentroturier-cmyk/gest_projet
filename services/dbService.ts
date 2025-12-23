
import { supabase } from './supabaseClient';
import { Project } from '../types';

const TABLE_NAME = 'Projets_DNA';
const CPV_TABLE_NAME = 'codes_cpv_long';
const REF_SEGMENTATION_TABLE = 'Referentiel_segmentation';
const REF_BUYERS_TABLE = 'Referentiel_acheteurs';

export const getAllBuyers = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from(REF_BUYERS_TABLE)
      .select('*')
      .limit(1000);
    if (error) return [];
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    const personKey = Object.keys(firstRow).find(k => k.toLowerCase() === 'personne') || Object.keys(firstRow)[0];
    const buyers: string[] = data
      .map((item: any) => item[personKey])
      .filter(val => val !== null && val !== undefined && val !== "")
      .map(val => String(val).trim());
    return Array.from(new Set(buyers)).sort((a, b) => a.localeCompare(b));
  } catch { return []; }
};

export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('data').order('updated_at', { ascending: false });
    if (error) throw error;
    if (!data) return [];
    return data.map((row: any) => row.data).filter((p: any) => p && typeof p === 'object' && p.ID);
  } catch (err: any) { throw err; }
};

export const saveProjectToDB = async (project: Project): Promise<string> => {
  if (!project.ID) throw new Error("ID de projet manquant");
  const { error } = await supabase.from(TABLE_NAME).upsert({ id: String(project.ID), data: project, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
  return project.ID;
};

export const saveBulkProjects = async (projects: Project[]): Promise<void> => {
  const rows = projects.filter(p => p && p.ID).map(p => ({ id: String(p.ID), data: p, updated_at: new Date().toISOString() }));
  if (rows.length === 0) return;
  const { error } = await supabase.from(TABLE_NAME).upsert(rows, { onConflict: 'id' });
  if (error) throw error;
};

export const getTrigramByBuyerName = async (name: string): Promise<string> => {
  if (!name) return "ZZZ";
  try {
    const { data } = await supabase.from(REF_BUYERS_TABLE).select('*');
    if (!data) return "ZZZ";
    const personKey = Object.keys(data[0]).find(k => k.toLowerCase() === 'personne') || 'Personne';
    const trigramKey = Object.keys(data[0]).find(k => k.toLowerCase() === 'trigramme') || 'Trigramme';
    const match = data.find((row: any) => String(row[personKey] || "").toLowerCase().trim() === name.toLowerCase().trim());
    return match ? String(match[trigramKey] || "ZZZ").toUpperCase() : "ZZZ";
  } catch { return "ZZZ"; }
};

export const clearDB = async (): Promise<void> => {
  await supabase.from(TABLE_NAME).delete().neq('id', 'null_id');
};

/**
 * Recherche des familles uniques dans dna_famille.
 */
export const searchFamilies = async (term: string): Promise<string[]> => {
  try {
    let query = supabase.from(REF_SEGMENTATION_TABLE).select('dna_famille').not('dna_famille', 'is', null);
    if (term) query = query.ilike('dna_famille', `%${term}%`);
    const { data } = await query.order('dna_famille', { ascending: true }).limit(2000);
    if (!data) return [];
    return Array.from(new Set(data.map(d => String(d.dna_famille).trim()))).filter((val): val is string => !!val);
  } catch { return []; }
};

/**
 * Recherche des SOUS-FAMILLES uniques dans dna_sousfamille.
 */
export const searchSubFamilies = async (term: string): Promise<string[]> => {
  try {
    let query = supabase.from(REF_SEGMENTATION_TABLE)
      .select('dna_sousfamille')
      .not('dna_sousfamille', 'is', null);
    
    if (term) {
      query = query.ilike('dna_sousfamille', `%${term}%`);
    }

    const { data } = await query.order('dna_sousfamille', { ascending: true }).limit(2000);
    if (!data) return [];
    
    return Array.from(new Set(data.map(d => String(d.dna_sousfamille).trim())))
      .filter((val): val is string => !!val && val !== "null" && val !== "undefined");
  } catch (err) { 
    console.error("Erreur searchSubFamilies:", err);
    return []; 
  }
};

/**
 * Recherche des codes CPV.
 * Recherche effectuée via .textSearch() car 'titre_searchable' est de type tsvector.
 */
export const searchCPVCodes = async (term: string): Promise<string[]> => {
  if (!term || term.trim().length < 2) return [];
  
  const cleanTerm = term.trim();

  try {
    // Note: On utilise textSearch car la colonne est un tsvector (confirmé par l'erreur operator does not exist)
    const { data, error } = await supabase
      .from(CPV_TABLE_NAME)
      .select('*')
      .textSearch('titre_searchable', cleanTerm, {
        config: 'french',
        type: 'websearch' // Permet une recherche plus flexible de type moteur de recherche
      })
      .limit(30);
    
    if (error) {
      // Fallback si la colonne n'est pas tsvector mais text (ou erreur de config french)
      if (error.message.includes('textSearch')) {
          const { data: fallbackData } = await supabase
            .from(CPV_TABLE_NAME)
            .select('*')
            .ilike('titre_searchable', `%${cleanTerm}%`)
            .limit(30);
          if (fallbackData) return formatCPVResults(fallbackData);
      }
      console.error("Supabase Error searchCPVCodes:", error.message);
      return [];
    }

    return formatCPVResults(data || []);
  } catch (err) { 
    console.error("Fetch Error searchCPVCodes:", err);
    return []; 
  }
};

// Helper pour formater les résultats CPV
const formatCPVResults = (data: any[]): string[] => {
    return data.map((d: any) => {
        const keys = Object.keys(d);
        const codeKey = keys.find(k => k.toLowerCase() === 'code' || k.toLowerCase() === 'cpv') || keys[0];
        const titleKey = keys.find(k => k.toLowerCase() === 'titrelong') || 'titre_searchable';
        
        const codeValue = d[codeKey] || "";
        const descValue = d[titleKey] && typeof d[titleKey] === 'string' ? d[titleKey] : "";
        
        return `${codeValue} - ${descValue}`.trim();
    });
};
