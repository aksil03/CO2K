import bowl from '../assets/bowl.png';
import homme from '../assets/homme.png';
import co2 from '../assets/CO2.png';
import { 
  BacAliment, 
  MomentRepas, 
  TemplateRepas, 
  NiveauActivite, 
  ObjectifPhysique, 
  type Repartition 
} from "@/lib/types";

export const Accueil_assets = [
  {
    id: '01',
    titre: "L'ALIMENTATION",
    badge: "MODULE 01",
    description: "Une multitude de recettes saines et protéinées respectant vos besoins énergétiques selon vos objectifs",
    image: bowl,
    titreCouleur: "text-black dark:text-white",
    descCouleur: "text-gray-700 dark:text-gray-300",
    chiffreCouleur: "text-green-300 dark:text-green-500/20",
    chiffrePosition: "-top-10 -right-10",
    badgeCouleur: "bg-green-600",
    inverserPosition: false,
    estCentre: false,
    animation: { rotate: 360 },
    transition: { duration: 40, repeat: Infinity, ease: "linear" }
  },
  {
    id: '02',
    titre: "LE SPORT",
    badge: "MODULE 02",
    description: "Notre programme s’adapte aussi bien aux sportifs du dimanche qu’aux plus assidus.",
    image: homme,
    titreCouleur: "text-black dark:text-white",
    descCouleur: "text-gray-700 dark:text-gray-300",
    chiffreCouleur: "text-gray-200 dark:text-white/10",
    chiffrePosition: "-bottom-10 -left-10",
    badgeCouleur: "bg-gray-800 dark:bg-zinc-700",
    inverserPosition: true,
    estCentre: false,
    animation: { y: [0, -30, 0] },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
  },
  {
    id: '03',
    titre: "LE CARBONE",
    badge: "MODULE 03",
    description: "Cuisiner en prenant en compte l'empreinte carbone de vos aliments",
    image: co2,
    titreCouleur: "text-black dark:text-white",
    descCouleur: "text-gray-700 dark:text-gray-300",
    chiffreCouleur: "text-emerald-100 dark:text-emerald-500/20",
    chiffrePosition: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    badgeCouleur: "bg-emerald-600",
    inverserPosition: false,
    estCentre: true,
    animation: { scale: [1, 1.1, 1] },
    transition: { duration: 5, repeat: Infinity }
  }
];


export const REPARTITION_MACROS: Partial<Record<MomentRepas, Repartition>> = {
  [MomentRepas.PETIT_DEJEUNER]: { prot: 0.20, lip: 0.25, glu: 0.25 },
  [MomentRepas.DEJEUNER]: { prot: 0.30, lip: 0.30, glu: 0.30 },
  [MomentRepas.COLLATION]: { prot: 0.15, lip: 0.20, glu: 0.20 }, 
  [MomentRepas.DINER]: { prot: 0.35, lip: 0.25, glu: 0.25 }
};

export const MODELES_REPAS: Record<TemplateRepas, BacAliment[][]> = {
  [TemplateRepas.PETIT_DEJ]: [
    [BacAliment.CERE, BacAliment.PAIN, BacAliment.GAL_RIZ], 
    [BacAliment.LAIT, BacAliment.PROT_VEG], 
    [BacAliment.FRUIT_ENTIER, BacAliment.FRUIT_PULPE], 
    [BacAliment.BC, BacAliment.LEG, BacAliment.OLEAGINEUX] 
  ],
  
  [TemplateRepas.HOT]: [
    [BacAliment.PROT_VOLAILLE, BacAliment.PROT_VIANDE_ROUGE, BacAliment.PROT_P, BacAliment.PROT_VEG, BacAliment.PROT_PORC, BacAliment.PROT_BLANCHE_AUTRE],
    [BacAliment.RIZ, BacAliment.PATE, BacAliment.GNOCCHI, BacAliment.SEMOU, BacAliment.POTATO, BacAliment.CERE_REPAS, BacAliment.NOUILLE],
    [BacAliment.LEG], 
    [BacAliment.S_HOT_RED, BacAliment.S_HOT_WHITE, BacAliment.S_HOT_ASIA],
    [BacAliment.HUILE] 
  ],

  [TemplateRepas.SANDWICH]: [
    [BacAliment.PAIN],
    [BacAliment.PROT_BLANCHE_AUTRE, BacAliment.PROT_VOLAILLE, BacAliment.PROT_VIANDE_ROUGE, BacAliment.PROT_VEG, BacAliment.PROT_PORC],
    [BacAliment.FROMAGE],
    [BacAliment.LAITUE, BacAliment.LEG],
    [BacAliment.S_COLD]
  ],

  [TemplateRepas.WRAP]: [
    [BacAliment.WRAP],
    [BacAliment.PROT_BLANCHE_AUTRE, BacAliment.PROT_VOLAILLE, BacAliment.PROT_VEG, BacAliment.PROT_P],
    [BacAliment.LAITUE, BacAliment.LEG],
    [BacAliment.S_COLD, BacAliment.S_HOT_ASIA]
  ],

  [TemplateRepas.SALADE]: [
    [BacAliment.LAITUE, BacAliment.LEG],
    [BacAliment.PROT_P, BacAliment.PROT_VEG, BacAliment.PROT_VOLAILLE, BacAliment.FROMAGE],
    [BacAliment.RIZ, BacAliment.PATE, BacAliment.SEMOU, BacAliment.POTATO, BacAliment.CERE_REPAS], 
    [BacAliment.OLEAGINEUX], 
    [BacAliment.VINAIGRETTE, BacAliment.HUILE] 
  ],

  [TemplateRepas.COLLATION]: [
      [BacAliment.FRUIT_ENTIER, BacAliment.GAL_RIZ, BacAliment.CERE, BacAliment.PAIN], 
      [BacAliment.OLEAGINEUX, BacAliment.BC, BacAliment.LEG],
      [BacAliment.LAIT, BacAliment.PROT_VEG]
  ]
};

export const SEUILS_SANTE = {
  SEL_MAX_JOUR: 5,
  CO2_MAX_REPAS: 2.0
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