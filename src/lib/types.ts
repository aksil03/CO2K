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
import type { getUtilisateurComplet } from "./queries/utilisateur.queries";
import type { getPlanningsUtilisateur } from "./queries/planning.queries";
import type { getProgrammesUtilisateur } from "./queries/programmes.queries";

import type { CalculateurImpact } from "./planning/impact";
import type { getPostsByUserId } from "./queries/communaute.queries";

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
  password: z.string().min(8, "8 caractères min"),
  age: z.number().int().min(15).max(100),
  taille: z.number().int().min(100).max(220),
  poids: z.number().min(30).max(120),
});


export const ProfilFormSchema = z.object({
  poids: z.coerce.number().min(30).max(120),
  taille: z.coerce.number().int().min(100).max(220),
  age: z.coerce.number().int().min(15).max(100),
  objectif: z.nativeEnum(ObjectifPhysique),
  activite: z.nativeEnum(NiveauActivite),
  genre: z.nativeEnum(Genre),
  regime: z.nativeEnum(RegimeAlimentaire),
});

export const LoginFormSchema = z.object({
  email: z.string().min(1, "Écrivez un email").email("Format d'email invalide"),
  password: z.string().min(1, "Écrivez un mot de passe"),
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
  numJour: z.number().optional(),
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
  numJour: z.number().optional(),
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
  auteurId: z.number(),
  repas: z.array(RepasGenereSchema),
});

export type SavePlanningData = z.infer<typeof SavePlanningSchema>;
const _checkSave: Prisma.PlanningUncheckedCreateInput = {} as Omit<SavePlanningData, 'repas'>;


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


// Schema pour la création d'un Post
export const CreatePostSchema = z.object({
  titre: z.string().min(3, "Le titre doit comporter plus de 3 caractères"),
  contenu: z.string().min(10, "La description doit comporter plus de 10 caractères"),
  auteurId: z.number(),
  programmeId: z.number().nullable().optional(),
  planningId: z.number().nullable().optional(),
  repasId: z.number().nullable().optional(),
});

export type CreatePostData = z.infer<typeof CreatePostSchema>;
export type PostComplet = Prisma.PromiseReturnType<typeof getPostsByUserId>[number];
const _checkPost: Prisma.PostUncheckedCreateInput = {} as CreatePostData;

export type BesoinsNutritionnels = NonNullable<ReturnType<typeof CalculateurImpact.calculerBesoinsNutritionnels>>;

export type CommentaireComplet = PostComplet['commentaires'][number];

export type SemaineProgramme = ProgrammeComplet['semaines'][number];

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

