
import React from 'react';

export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  path: string; // Chemin interne dans le bucket
}

export interface PurchaseProcedure {
  id: string;
  "Numéro de procédure (Afpa)": string;
  Acheteur: string;
  "Type de procédure": string;
  "Code CPV Principal": string;
  "Montant prévisionnel du marché (€ HT)": string;
  "Sur 12 mois économie achat prévisionnelle (€)": string;
  "Forme du marché": string;
  "Objet court": string;
  "Date de lancement de la consultation": string;
  "Date de remise des candidatures": string;
  "Date de remise des offres": string;
  "7 Exécution Date de début": string;
  "7 Exécution Date de fin": string;
  "Date de Notification": string;
  "Durée du marché (en mois)": string;
  "Sous-Familles": string[];

  // Indicateurs & DAE
  "Nombre de retraits": string;
  "Nombre de soumissionnaires": string;
  "Nombre de questions": string;
  "Dispo sociales": string;
  "Dispo environnementales": string;
  "Projet ouvert à l'acquisition de solutions innovantes": string;
  "Projet facilitant l'accès aux TPE/PME": string;
  "Date d'écriture du DCE": string;
  "Date d'ouverture des offres": string;

  // Rapport de Présentation (RP)
  "RP - Date validation MSA": string;
  "RP - Date envoi signature élec": string;
  "RP - Date de validation du document": string;
  "RP - Date validation CODIR": string;
  "RP - Commentaire": string;
  rp_attachments?: Attachment[]; // Pièces jointes RP

  // Attribution
  "Date des Rejets": string;
  "Avis d'attribution": string;
  "Données essentielles": string;
  "Finalité de la consultation": string;
  "Statut de la consultation": string;
}

export interface Project {
  ID: string;
  Acheteur: string;
  "Famille Achat Principale": string;
  "Titre du dossier": string;
  "Montant prévisionnel du marché (€ TTC)": string;
  Prescripteur: string;
  "Client Interne": string;
  "Statut du Dossier": string;
  Programme: string;
  Opération: string;
  "Date limite étude stratégie avec client interne": string;
  "Levier Achat": string;
  "Renouvellement de marché": string;
  "Perf achat prévisionnelle (en %)": string;
  "Origine du montant pour le calcul de l'économie": string;
  Priorité: string;
  "Commission Achat": string;
  
  // Note d'Opportunité (NO)
  "NO - Date prévisionnelle": string;
  "NO - Date validation CODIR": string;
  "NO - Date envoi signature": string;
  "NO - Date de validation du document": string;
  "NO - Nom des valideurs": string;
  "NO - Statut": string;
  "NO - Commentaire": string;
  no_attachments?: Attachment[]; // Pièces jointes NO

  // Compatibilité
  "Nom des valideurs": string;
  "Commentaire général sur le projet": string;
  
  procedures: PurchaseProcedure[];

  [key: string]: any;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}
