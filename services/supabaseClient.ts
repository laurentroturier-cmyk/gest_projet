import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'gestprojet_sb_url';
const STORAGE_KEY_KEY = 'gestprojet_sb_key';

// Valeurs fournies par l'utilisateur
const DEFAULT_URL = 'https://kktxzgumcpumxaldxsim.supabase.co';
const DEFAULT_KEY = 'sb_publishable_wdPm1l0vH2NUYpUNkwmvXw_opLO_dwG';

// Récupération du stockage local ou utilisation des valeurs par défaut
const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
const storedKey = localStorage.getItem(STORAGE_KEY_KEY);

// Si l'utilisateur a configuré une autre clé via l'interface, on l'utilise, sinon on prend celle fournie ici
const supabaseUrl = storedUrl && storedUrl.trim() !== '' ? storedUrl : DEFAULT_URL;
const supabaseKey = storedKey && storedKey.trim() !== '' ? storedKey : DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helpers pour l'interface utilisateur

export const isConfigured = () => {
  // On considère que c'est configuré car les valeurs par défaut sont maintenant valides
  return supabaseUrl && supabaseUrl.length > 0 && supabaseKey && supabaseKey.length > 0;
};

export const updateSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  window.location.reload(); 
};

export const resetSupabaseConfig = () => {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    window.location.reload();
}
