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
import { getPlanningsUtilisateur } from "./queries";
import { getProgrammesUtilisateur } from "./queries";

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

export type PlanningComplet = Prisma.PromiseReturnType<typeof getPlanningsUtilisateur>[number];

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
const _checkInscr: Prisma.UtilisateurCreateInput = {} as InscriptionData;

export type LoginData = z.infer<typeof LoginFormSchema>;
export type ProfilData = z.infer<typeof ProfilFormSchema>;
const _checkProfil: Prisma.UtilisateurUpdateInput = {} as ProfilData;


// repas schema
export const RepasGenereSchema = z.object({
  moment: z.nativeEnum(MomentRepas),
  template: z.nativeEnum(TemplateRepas),
  aliments: z.array(z.object({
    aliment: z.custom<Aliment>(),
    poids: z.number(),
  })),
  stats: z.record(z.string(), z.number()),
  cibles: z.object({
    prot: z.number(),
    lip: z.number(),
    glu: z.number(),
  }),
});

export type RepasGenere = z.infer<typeof RepasGenereSchema>;

// journée schema
export const JourneePlanningSchema = z.object({
  jour: z.number(),
  repas: z.array(RepasGenereSchema),
  bilan: z.object({
    prot: z.object({ actuel: z.number(), cible: z.number() }),
    lip: z.object({ actuel: z.number(), cible: z.number() }),
    glu: z.object({ actuel: z.number(), cible: z.number() }),
    co2Total: z.number(),
  }),
});

export type BilanNutritionnel = JourneePlanning['bilan'];

export type JourneePlanning = z.infer<typeof JourneePlanningSchema>;

// schema portion
export const PortionSchema = z.object({
  quantite: z.number(),
  alimentId: z.number(),
  repasId: z.number(),
});
const _checkPortion: Prisma.PortionUncheckedCreateInput = {} as z.infer<typeof PortionSchema>;

// schema repas
export const RepasSchema = z.object({
  dateConsom: z.coerce.date(),
  type: z.nativeEnum(MomentRepas),
  nomTemplate: z.nativeEnum(TemplateRepas),
  utilisateurId: z.number(),
  portions: z.array(PortionSchema), 
});
const _checkRepas: Omit<Prisma.RepasUncheckedCreateInput, 'portions'> = {} as z.infer<typeof RepasSchema>;

// schema sauvegarde
export const SavePlanningSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional(),
  estPublic: z.boolean().default(false),
  auteurId: z.number(),
  journal: z.array(JourneePlanningSchema), 
});

export type SavePlanningData = z.infer<typeof SavePlanningSchema>;
const _checkSave: Prisma.PlanningUncheckedCreateInput = {} as Omit<SavePlanningData, 'journal'>;


export const AssignerPlanningSchema = z.object({
  programmeId: z.coerce.number(),   
  planningId: z.coerce.number(),
  semaineDebut: z.coerce.date(),
  ordre: z.coerce.number().default(1),
});

export type AssignerPlanningData = z.infer<typeof AssignerPlanningSchema>;
const _checkCal: Prisma.CalendrierPlanningUncheckedCreateInput = {} as AssignerPlanningData;


export const CreateProgrammeSchema = z.object({
  nom: z.string().min(1, "Le nom du programme est requis"),
  description: z.string().optional(),
  auteurId: z.number(),
  semaines: z.array(z.object({
    planningId: z.number().nullable(),
    semaineDebut: z.coerce.date(),
    ordre: z.number(),
  })).min(1, "Ajoutez au moins une semaine au programme"),
});

export type CreateProgrammeData = z.infer<typeof CreateProgrammeSchema>;

export type ProgrammeComplet = Prisma.PromiseReturnType<typeof getProgrammesUtilisateur>[number];

const _checkProg: Prisma.ProgrammeUncheckedCreateInput = {} as Omit<CreateProgrammeData, 'semaines'>;

// interface
export interface PanierItem { 
  aliment: Aliment; 
  poids: number; 
}

export interface Repartition {
  prot: number;
  lip: number;
  glu: number;
}

