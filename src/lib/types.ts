import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getMail } from "./queries";


export type UserWithRelations = Awaited<ReturnType<typeof getMail>>;

export const InscriptionFormSchema = z.object({
  nom: z.string().min(1, "Le nom doit comporter au moins une lettre"),
  prenom: z.string().min(1, "Le prenom doit comporter au moins une lettre"),
  email: z.string().email("l'email doit etre au format standard"),
  password: z.string().min(4, "Le mot de passe doit comporter au moins 4 lettres"),
});

export type InscriptionData = z.infer<typeof InscriptionFormSchema>;