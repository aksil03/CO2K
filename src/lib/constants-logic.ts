import { BacAliment, MomentRepas, NiveauActivite, ObjectifPhysique } from "@prisma/client";
import { TemplateRepas, type Repartition } from "./types";

export const heureRepas = {
  PETIT_DEJEUNER: 8,
  DEJEUNER: 12,
  COLLATION: 16,
  DINER: 20
};

export interface GroupeStructure {
  bacs: BacAliment[];
  isOptional?: (selectedBacs: BacAliment[]) => boolean;
}

export const REPARTITION_MACROS: Partial<Record<MomentRepas, Repartition>> = {
  [MomentRepas.PETIT_DEJEUNER]: { prot: 0.20, lip: 0.25, glu: 0.25 },
  [MomentRepas.DEJEUNER]: { prot: 0.30, lip: 0.30, glu: 0.30 },
  [MomentRepas.COLLATION]: { prot: 0.15, lip: 0.20, glu: 0.20 },
  [MomentRepas.DINER]: { prot: 0.35, lip: 0.25, glu: 0.25 }
};

export const MODELES_REPAS: Record<TemplateRepas, GroupeStructure[]> = {
  [TemplateRepas.PETIT_DEJ]: [
    { bacs: [BacAliment.CERE, BacAliment.PAIN, BacAliment.GAL_RIZ] },
    { bacs: [BacAliment.LAIT, BacAliment.PROT_VEG] },
    {
      bacs: [BacAliment.PROT_VEG],
      isOptional: () => true
    },
    { bacs: [BacAliment.FRUIT_ENTIER, BacAliment.FRUIT_PULPE] },
    {
      bacs: [BacAliment.BC, BacAliment.LEG, BacAliment.OLEAGINEUX, BacAliment.FROMAGE],
      isOptional: (selected) => selected.includes(BacAliment.CERE)
    }
  ],

  [TemplateRepas.HOT]: [
    { bacs: [BacAliment.PROT_VOLAILLE, BacAliment.PROT_VIANDE_ROUGE, BacAliment.PROT_P, BacAliment.PROT_VEG, BacAliment.PROT_PORC, BacAliment.PROT_BLANCHE_AUTRE] },
    { bacs: [BacAliment.RIZ, BacAliment.PATE, BacAliment.GNOCCHI, BacAliment.SEMOU, BacAliment.POTATO, BacAliment.CERE_REPAS, BacAliment.NOUILLE] },
    { bacs: [BacAliment.LEG] },
    { bacs: [BacAliment.S_HOT_RED, BacAliment.S_HOT_WHITE, BacAliment.S_HOT_ASIA], isOptional: () => true },
    { bacs: [BacAliment.HUILE], isOptional: () => true }
  ],

  [TemplateRepas.SANDWICH]: [
    { bacs: [BacAliment.PAIN] },
    { bacs: [BacAliment.PROT_VOLAILLE, BacAliment.PROT_VIANDE_ROUGE, BacAliment.PROT_P, BacAliment.PROT_PORC, BacAliment.PROT_BLANCHE_AUTRE] },
    { bacs: [BacAliment.FROMAGE], isOptional: () => true },
    { bacs: [BacAliment.LAITUE, BacAliment.LEG] },
    { bacs: [BacAliment.S_COLD], isOptional: () => true }
  ],

  [TemplateRepas.WRAP]: [
    { bacs: [BacAliment.WRAP] },
    { bacs: [BacAliment.PROT_VOLAILLE, BacAliment.PROT_VIANDE_ROUGE, BacAliment.PROT_P, BacAliment.PROT_VEG, BacAliment.PROT_PORC, BacAliment.PROT_BLANCHE_AUTRE] },
    { bacs: [BacAliment.LAITUE, BacAliment.LEG] },
    { bacs: [BacAliment.FROMAGE], isOptional: () => true },
    { bacs: [BacAliment.S_COLD], isOptional: () => true }
  ],

  [TemplateRepas.SALADE]: [
    { bacs: [BacAliment.LAITUE, BacAliment.LEG] },
    { bacs: [BacAliment.PROT_P, BacAliment.PROT_VEG, BacAliment.PROT_VOLAILLE, BacAliment.PROT_VIANDE_ROUGE, BacAliment.PROT_PORC, BacAliment.PROT_BLANCHE_AUTRE, BacAliment.FROMAGE] },
    { bacs: [BacAliment.RIZ, BacAliment.PATE, BacAliment.POTATO, BacAliment.CERE_REPAS, BacAliment.NOUILLE] },
    { bacs: [BacAliment.OLEAGINEUX], isOptional: () => true },
    { bacs: [BacAliment.VINAIGRETTE, BacAliment.HUILE, BacAliment.S_HOT_ASIA], isOptional: () => true }
  ],

  [TemplateRepas.COLLATION]: [
    { bacs: [BacAliment.PAIN, BacAliment.CERE, BacAliment.GAL_RIZ, BacAliment.FRUIT_ENTIER] },
    {
      bacs: [BacAliment.OLEAGINEUX, BacAliment.BC, BacAliment.LEG, BacAliment.FROMAGE],
      isOptional: (selected) => selected.includes(BacAliment.CERE) || selected.includes(BacAliment.FRUIT_ENTIER)
    },
    { bacs: [BacAliment.LAIT, BacAliment.PROT_VEG] },
    {
      bacs: [BacAliment.PROT_VEG],
      isOptional: () => true
    }
  ],
};

export const RATIOS_MOMENTS = {
  [MomentRepas.PETIT_DEJEUNER]: 0.25,
  [MomentRepas.DEJEUNER]: 0.30,
  [MomentRepas.COLLATION]: 0.15,
  [MomentRepas.DINER]: 0.30
};

export const COEFS_ACTIVITE: Record<NiveauActivite, number> = {
  [NiveauActivite.SEDENTAIRE]: 1.2,
  [NiveauActivite.LEGER]: 1.375,
  [NiveauActivite.MODERE]: 1.55,
  [NiveauActivite.INTENSE]: 1.725,
  [NiveauActivite.EXTREME]: 1.9
};

export const AJUSTEMENT_OBJECTIF: Record<ObjectifPhysique, number> = {
  [ObjectifPhysique.PERTE_DE_GRAS]: -500,
  [ObjectifPhysique.MAINTIEN]: 0,
  [ObjectifPhysique.PRISE_DE_MASSE]: 300
};

export const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];


export const LABELS_BACS: Record<string, string> = {
  "PROT_P": "POISSON",
  "PROT_VEG": "VEGETARIEN",
  "PROT_VOLAILLE": "VOLAILLE",
  "PROT_VIANDE_ROUGE": "VIANDE ROUGE",
  "PROT_PORC": "PORC",
  "PROT_BLANCHE_AUTRE": "VIANDEBLANCHE",
  "FRUIT_ENTIER": "FRUIT ENTIER",
  "FRUIT_PULPE": "FRUIT PULPE",
  "BC": "beurre de cacahuete",
  "CERE": "CEREALE",
  "GAL_RIZ": "GALETTE",
  "LEG": "LEGUME",
  "SEMOU": "SEMOULE",
  "S_COLD": "SAUCE FROIDE",
  "S_HOT_RED": "SAUCE CHAUDE",
  "S_HOT_ASIA": "SAUCE ASIATIQUE",
  "S_HOT_WHITE": "SAUCE BLANCHE",
};  
