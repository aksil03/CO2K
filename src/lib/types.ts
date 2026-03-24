import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getUtilisateurComplet } from "./queries";
import type { Aliment as PrismaAliment } from "@prisma/client";

// type de recuperation d'attributs associée a un utilisateur via sont mail
export type UserWithRelations = Awaited<ReturnType<typeof getUtilisateurComplet>>;

// type de recuperation d'aliments
export type Aliment = PrismaAliment;

// schema d'inscription pour respecter la structure d'utilisateur voulu avant insertion en bdd
export const InscriptionFormSchema = z.object({
  nom: z.string().min(1, "Le nom doit comporter au moins une lettre"),
  prenom: z.string().min(1, "Le prenom doit comporter au moins une lettre"),
  email: z.string().email("l'email doit etre au format standard"),
  password: z.string().min(4, "Le mot de passe doit comporter au moins 4 lettres"),
  age: z.preprocess((val) => Number(val), z.number().int("L'âge doit être un nombre entier").min(15, "Vous devez avoir au minimum 15 ans")),
  taille: z.preprocess((val) => Number(val), z.number().int("La taille doit être un nombre entier").min(50, "La taille minimum requise est de 50 cm")),
  poids: z.preprocess((val) => Number(val), z.number().min(20, "Le poids minimum requis est de 20 kilos")),
});


export type InscriptionData = z.infer<typeof InscriptionFormSchema>;


// schema de structure d'une identification
export const LoginFormSchema = z.object({
  email: z.string().email("L'email doit être au format standard"),
  password: z.string().min(1, "Le mot de passe est requis"), 
});

export type LoginData = z.infer<typeof LoginFormSchema>;


// schema d'un profil utilisateur
export const ProfilFormSchema = z.object({
  poids: z.preprocess((val) => Number(val), z.number().min(20)),
  taille: z.preprocess((val) => Number(val), z.number().min(50)),
  objectif: z.enum(["PRISE_DE_MASSE", "PERTE_DE_GRAS", "MAINTIEN"]),
  activite: z.enum(["SEDENTAIRE", "LEGER", "MODERE", "INTENSE", "EXTREME"]),
  genre: z.enum(["HOMME", "FEMME"]),
});

export type ProfilData = z.infer<typeof ProfilFormSchema>;