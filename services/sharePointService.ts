import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { Project } from "../types";

export interface SharePointConfig {
  clientId: string;
  tenantId: string;
  siteId: string; // Souvent sous la forme hostname,site-id,web-id ou simplement l'URL du site pour recherche
  listName: string;
}

let msalInstance: PublicClientApplication | null = null;

export const initializeMsal = async (clientId: string, tenantId: string) => {
  const msalConfig = {
    auth: {
      clientId: clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  };

  msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();
  return msalInstance;
};

export const fetchSharePointData = async (config: SharePointConfig): Promise<Project[]> => {
  if (!msalInstance) {
    throw new Error("MSAL non initialisé. Veuillez configurer la connexion.");
  }

  const request = {
    scopes: ["Sites.Read.All"],
  };

  try {
    // 1. Authentification
    let authResult;
    try {
      // Tente d'abord silencieusement
      authResult = await msalInstance.acquireTokenSilent({
        ...request,
        account: msalInstance.getAllAccounts()[0]
      });
    } catch (err) {
        // Sinon popup
       authResult = await msalInstance.loginPopup(request);
    }

    if (!authResult || !authResult.accessToken) {
      throw new Error("Échec de l'authentification.");
    }

    const accessToken = authResult.accessToken;

    // 2. Trouver le Site ID si l'utilisateur a donné une URL, sinon utiliser l'ID direct
    let targetSiteId = config.siteId;
    
    // Si l'entrée ressemble à une URL (ex: afpa.sharepoint.com), on cherche l'ID via Graph
    if (config.siteId.includes("sharepoint.com")) {
        const hostname = config.siteId.split('/')[2];
        const sitePath = config.siteId.split(hostname)[1] || "";
        const cleanPath = sitePath.replace(/\/$/, ""); // Enlever slash final
        
        const siteQueryUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${cleanPath}`;
        
        const siteRes = await fetch(siteQueryUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!siteRes.ok) throw new Error("Impossible de trouver le site SharePoint. Vérifiez l'URL/ID.");
        const siteData = await siteRes.json();
        targetSiteId = siteData.id;
    }

    // 3. Récupérer les items de la liste
    // Note: expand=fields(select=*) permet de récupérer toutes les colonnes personnalisées
    const listUrl = `https://graph.microsoft.com/v1.0/sites/${targetSiteId}/lists/${config.listName}/items?expand=fields`;
    
    const response = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Prefer": "HonorNonIndexedQueriesWarningMayFailRandomly"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur API Graph: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();

    // 4. Mapper les données SharePoint vers notre format Project
    // SharePoint met les données dans 'fields'. Les noms internes des colonnes peuvent varier.
    // Nous faisons un mapping "best effort" basé sur les noms exacts.
    
    const mappedProjects: Project[] = data.value.map((item: any) => {
      const fields = item.fields;
      
      // Création d'un objet propre
      const project: any = {};
      
      // On copie toutes les propriétés qui existent dans 'fields'
      Object.keys(fields).forEach(key => {
        project[key] = fields[key]?.toString() || "";
      });

      // Assurons-nous que l'ID existe (SharePoint a 'id' ou 'ID')
      project.ID = fields.ID || fields.id || item.id || "0";
      
      // Mapping spécifique si les noms de colonnes SharePoint diffèrent légèrement (normalisation simple)
      // Ici on suppose que les colonnes SharePoint ont les mêmes noms que le fichier Excel
      
      return project as Project;
    });

    return mappedProjects;

  } catch (error) {
    console.error(error);
    throw error;
  }
};