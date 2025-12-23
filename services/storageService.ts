
import { supabase } from './supabaseClient';
import { Attachment } from '../types';

/**
 * ID du bucket (sensible à la casse).
 * Configuré pour correspondre exactement au nom manuel : 'Projets DNA'
 */
const BUCKET_ID = 'Projets DNA';

/**
 * Nettoie le chemin lors de l'upload pour éviter les caractères spéciaux.
 */
const sanitizePath = (path: string): string => {
  return path
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9./_-]/g, '_')
    .replace(/\/+/g, '/')
    .replace(/_{2,}/g, '_');
};

export const uploadFile = async (file: File, path: string): Promise<Attachment> => {
  const cleanPath = sanitizePath(path);
  
  console.log(`[Storage] Tentative d'upload : bucket="${BUCKET_ID}", chemin="${cleanPath}"`);
  
  const { data, error } = await supabase.storage
    .from(BUCKET_ID)
    .upload(cleanPath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("[Storage] Erreur upload détaillée:", error);
    
    // Détection spécifique du bucket manquant
    if (error.message?.includes("Bucket not found") || (error as any).status === 404) {
      const msg = `Le compartiment de stockage "${BUCKET_ID}" est introuvable. Vérifiez son nom dans Supabase ou utilisez le script SQL.`;
      window.dispatchEvent(new CustomEvent('supabase-storage-error', { 
        detail: { message: msg, type: 'missing_bucket' } 
      }));
      throw new Error(msg);
    }
    
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_ID)
    .getPublicUrl(data.path);

  return {
    name: file.name,
    url: urlData.publicUrl,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    path: data.path
  };
};

export const deleteFile = async (path: string): Promise<void> => {
  if (!path) return;

  console.log(`[Storage] Tentative de suppression : bucket="${BUCKET_ID}", chemin="${path}"`);

  const { data, error } = await supabase.storage
    .from(BUCKET_ID)
    .remove([path]);
  
  if (error) {
    console.error("[Storage] Erreur suppression détaillée:", error);
    throw new Error(`Erreur Supabase : ${error.message}`);
  }

  // Si data est vide, c'est que les droits RLS (Delete) sont manquants sur Supabase
  if (!data || data.length === 0) {
    const msg = `Suppression refusée. Vérifiez la politique SQL 'DELETE' sur le bucket '${BUCKET_ID}'.`;
    console.error(`[Storage] ${msg}`);
    throw new Error(msg);
  }

  console.log("[Storage] Fichier supprimé avec succès.");
};
