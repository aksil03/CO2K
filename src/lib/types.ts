import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getMail } from "./queries";

// type de recuperation d'attributs associée a un utilisateur via sont mail
export type UserWithRelations = Awaited<ReturnType<typeof getMail>>;

// schema d'inscription pour respecter la structure d'utilisateur voulu avant insertion en bdd
export const InscriptionFormSchema = z.object({
  nom: z.string().min(1, "Le nom doit comporter au moins une lettre"),
  prenom: z.string().min(1, "Le prenom doit comporter au moins une lettre"),
  email: z.string().email("l'email doit etre au format standard"),
  password: z.string().min(4, "Le mot de passe doit comporter au moins 4 lettres"),
});


export type InscriptionData = z.infer<typeof InscriptionFormSchema>;


// schema de structure d'une identification
export const LoginFormSchema = z.object({
  email: z.string().email("L'email doit être au format standard"),
  password: z.string().min(1, "Le mot de passe est requis"), 
});

export type LoginData = z.infer<typeof LoginFormSchema>;