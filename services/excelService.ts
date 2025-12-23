
import * as XLSX from 'xlsx';
import { Project, PurchaseProcedure } from '../types';
import { normalizeDateInput } from '../utils';

const processDate = (rawVal: any): string => {
    if (!rawVal) return "";
    if (rawVal instanceof Date) return rawVal.toISOString().split('T')[0];
    return normalizeDateInput(rawVal);
};

export const parseExcel = (file: File): Promise<Project[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
        const projectMap = new Map<string, Project>();

        rawData.forEach((row) => {
            const id = row.ID ? String(row.ID).trim() : "";
            if (!id) return; 

            const sfRaw = row["Sous-Familles"] || "";
            const sousFamilles = String(sfRaw).split(',').map(s => s.trim()).filter(Boolean);

            const procedure: PurchaseProcedure = {
                id: row["Procedure_ID_Interne"] || "", 
                "Numéro de procédure (Afpa)": row["Numéro de procédure (Afpa)"] || "",
                Acheteur: row["Proc_Acheteur"] || row["Acheteur"] || "",
                "Type de procédure": row["Type de procédure"] || "",
                "Code CPV Principal": row["Code CPV Principal"] || "",
                "Montant prévisionnel du marché (€ HT)": row["Montant prévisionnel du marché (€ HT)"] || "",
                "Sur 12 mois économie achat prévisionnelle (€)": row["Sur 12 mois économie achat prévisionnelle (€)"] || "",
                "Forme du marché": row["Forme du marché"] || "",
                "Objet court": row["Objet court"] || "",
                "Date de lancement de la consultation": processDate(row["Date de lancement de la consultation"]),
                "Date de remise des candidatures": processDate(row["Date de remise des candidatures"]),
                "Date de remise des offres": processDate(row["Date de remise des offres"]),
                "7 Exécution Date de début": processDate(row["7 Exécution Date de début"]),
                "7 Exécution Date de fin": processDate(row["7 Exécution Date de fin"]),
                "Date de Notification": processDate(row["Date de Notification"]),
                "Durée du marché (en mois)": row["Durée du marché (en mois)"] || "",
                "Sous-Familles": sousFamilles,
                
                "Nombre de retraits": row["Nombre de retraits"] || "",
                "Nombre de soumissionnaires": row["Nombre de soumissionnaires"] || "",
                "Nombre de questions": row["Nombre de questions"] || "",
                "Dispo sociales": row["Dispo sociales"] || "",
                "Dispo environnementales": row["Dispo environnementales"] || "",
                "Projet ouvert à l'acquisition de solutions innovantes": row["Projet ouvert à l'acquisition de solutions innovantes"] || "",
                "Projet facilitant l'accès aux TPE/PME": row["Projet facilitant l'accès aux TPE/PME"] || "",
                "Date d'écriture du DCE": processDate(row["Date d'écriture du DCE"]),
                "Date d'ouverture des offres": processDate(row["Date d'ouverture des offres"]),

                // RP
                "RP - Date validation MSA": processDate(row["RP - Date validation MSA"]),
                "RP - Date envoi signature élec": processDate(row["RP - Date envoi signature élec"]),
                "RP - Date de validation du document": processDate(row["RP - Date de validation du document"]),
                "RP - Date validation CODIR": processDate(row["RP - Date validation CODIR"]),
                "RP - Commentaire": row["RP - Commentaire"] || "",

                // Attribution
                "Date des Rejets": processDate(row["Date des Rejets"]),
                "Avis d'attribution": processDate(row["Avis d'attribution"]),
                "Données essentielles": processDate(row["Données essentielles"]),
                "Finalité de la consultation": row["Finalité de la consultation"] || "",
                "Statut de la consultation": row["Statut de la consultation"] || ""
            };

            if (projectMap.has(id)) {
                projectMap.get(id)!.procedures.push(procedure);
            } else {
                projectMap.set(id, {
                    ID: id, 
                    Acheteur: row.Acheteur, 
                    "Famille Achat Principale": row["Famille Achat Principale"],
                    "Titre du dossier": row["Titre du dossier"], 
                    "Montant prévisionnel du marché (€ TTC)": row["Montant prévisionnel du marché (€ TTC)"] || row["Montant prévisionnel du marché (€ HT)"] || "",
                    Prescripteur: row.Prescripteur,
                    "Client Interne": row["Client Interne"], "Statut du Dossier": row["Statut du Dossier"],
                    Programme: row.Programme, Opération: row.Opération,
                    "Date limite étude stratégie avec client interne": processDate(row["Date limite étude stratégie avec client interne"]),
                    "Levier Achat": row["Levier Achat"], "Renouvellement de marché": row["Renouvellement de marché"],
                    "Perf achat prévisionnelle (en %)": row["Perf achat prévisionnelle (en %)"],
                    "Origine du montant pour le calcul de l'économie": row["Origine du montant pour le calcul de l'économie"],
                    Priorité: row.Priorité, "Commission Achat": row["Commission Achat"],
                    
                    "NO - Date prévisionnelle": processDate(row["NO - Date prévisionnelle"]),
                    "NO - Date validation CODIR": processDate(row["NO - Date validation CODIR"]),
                    "NO - Date envoi signature": processDate(row["NO - Date envoi signature"]),
                    "NO - Date de validation du document": processDate(row["NO - Date de validation du document"]),
                    "NO - Nom des valideurs": row["NO - Nom des valideurs"] || row["Nom des valideurs"] || "",
                    "NO - Statut": row["NO - Statut"] || "",
                    "NO - Commentaire": row["NO - Commentaire"] || row["Commentaire général sur le projet"] || "",

                    "Nom des valideurs": row["Nom des valideurs"] || "",
                    "Commentaire général sur le projet": row["Commentaire général sur le projet"] || "",
                    
                    procedures: [procedure]
                });
            }
        });

        const projects = Array.from(projectMap.values()).map(p => {
            p.procedures = p.procedures.map((proc, index) => {
                if (!proc.id) proc.id = `${p.ID}-P${index + 1}`;
                return proc;
            });
            return p;
        });
        resolve(projects);
      } catch (error) { reject(error); }
    };
    reader.readAsBinaryString(file);
  });
};

export const exportProceduresFull = (projects: Project[], fileName: string = 'Portefeuille_Procedures_Afpa.xlsx') => {
    const flatList: any[] = [];

    projects.forEach(p => {
        p.procedures?.forEach(proc => {
            flatList.push({
                "Numéro de procédure (Afpa)": proc["Numéro de procédure (Afpa)"] || "",
                "ID Procédure": proc.id,
                "Objet de la procédure": proc["Objet court"] || "",
                "Acheteur Procédure": proc.Acheteur || "",
                "Type de procédure": proc["Type de procédure"] || "",
                "Montant Procédure (€ HT)": proc["Montant prévisionnel du marché (€ HT)"] || "",
                "Date Lancement": proc["Date de lancement de la consultation"] || "",
                
                // Attribution
                "Date des Rejets": proc["Date des Rejets"] || "",
                "Avis d'attribution": proc["Avis d'attribution"] || "",
                "Données essentielles": proc["Données essentielles"] || "",
                "Statut de la consultation": proc["Statut de la consultation"] || "",
                
                "ID Projet": p.ID,
                "Projet": p["Titre du dossier"] || "",
                "Statut Projet": p["Statut du Dossier"] || ""
            });
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(flatList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Procédures Afpa");
    XLSX.writeFile(workbook, fileName);
};
