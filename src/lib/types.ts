import { z } from "zod";
import { 
  Prisma, 
  ObjectifPhysique,
  NiveauActivite,
  Genre,
  RegimeAlimentaire,
  MomentRepas,
  TemplateRepas,
  BacAliment
} from "@prisma/client";
import type { Aliment } from "@prisma/client";
import { getUtilisateurComplet } from "./queries";

export { 
  MomentRepas, 
  TemplateRepas, 
  BacAliment, 
  ObjectifPhysique, 
  NiveauActivite, 
  Genre, 
  RegimeAlimentaire 
};
export type { Aliment };

export type UserWithRelations = Prisma.PromiseReturnType<typeof getUtilisateurComplet>;
export type AlimentsGroupes = Partial<Record<BacAliment, Aliment[]>>;
export type Periode = 'JOUR' | 'SEMAINE' | 'MOIS';


export const formatEnum = (text: string) => 
  text.toLowerCase().split("_").map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(" ");


export const InscriptionFormSchema = z.object({
  nom: z.string().min(1, "Requis"),
  prenom: z.string().min(1, "Requis"),
  email: z.string().email("Format invalide"),
  password: z.string().min(4, "4 caractères min"),
  age: z.coerce.number().int().min(15),
  taille: z.coerce.number().int().min(50),
  poids: z.coerce.number().min(20),
});

export const ProfilFormSchema = z.object({
  poids: z.coerce.number().min(20),
  taille: z.coerce.number().int().min(50),
  age: z.coerce.number().int().min(15),
  objectif: z.nativeEnum(ObjectifPhysique),
  activite: z.nativeEnum(NiveauActivite),
  genre: z.nativeEnum(Genre),
  regime: z.nativeEnum(RegimeAlimentaire),
});

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InscriptionData = z.infer<typeof InscriptionFormSchema>;
export type LoginData = z.infer<typeof LoginFormSchema>;
export type ProfilData = z.infer<typeof ProfilFormSchema>;


export interface PanierItem { 
  aliment: Aliment; 
  poids: number; 
}

export interface Repartition {
  prot: number;
  lip: number;
  glu: number;
}

export interface RepasGenere {
  moment: MomentRepas;
  template: TemplateRepas;
  aliments: PanierItem[];
  stats: Record<'prot' | 'lip' | 'glu' | 'co2' | 'sucre' | 'sel' | 'gras_sat', number>;
  cibles: Repartition;
}

export interface JourneePlanning {
  jour: number;
  repas: RepasGenere[];
  bilan: BilanNutritionnel; 
}

export interface BilanNutritionnel {
  prot: { actuel: number; cible: number };
  lip: { actuel: number; cible: number };
  glu: { actuel: number; cible: number };
  co2Total: number;
}

export interface SavePlanningData {
  utilisateurId: number;
  nom: string;
  journal: JourneePlanning[]; 
}