import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Aliment } from "./types"
import { Genre, ObjectifPhysique, NiveauActivite } from "@prisma/client";
import type { UserWithRelations } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CalculateurImpact = {
  
  calculerTotalCO2: (aliments: (Aliment | null | undefined)[]) => {
    return aliments
      .filter((a): a is Aliment => a != null) 
      .reduce((total, a) => total + (a.co2 || 0), 0);
  },

  calculerTotalCalories: (aliments: (Aliment | null | undefined)[]) => {
    return aliments
      .filter((a): a is Aliment => a != null)
      .reduce((total, a) => total + (a.cal || 0), 0);
  },

  calculerBesoinsNutritionnels: (user: UserWithRelations) => {
  if (!user) return null;

  // Equation Mifflin-St Jeor metabolisme de base
  const base = (10 * user.poids) + (6.25 * user.taille) - (5 * user.age);
  const mb = user.genre === Genre.HOMME ? base + 5 : base - 161;

  const coefActivite = {
    [NiveauActivite.SEDENTAIRE]: 1.2,
    [NiveauActivite.LEGER]: 1.375,
    [NiveauActivite.MODERE]: 1.55,
    [NiveauActivite.INTENSE]: 1.725,
    [NiveauActivite.EXTREME]: 1.9
  }[user.activite] || 1.2;

  const modifObjectif = {
    [ObjectifPhysique.PERTE_DE_GRAS]: -500,
    [ObjectifPhysique.MAINTIEN]: 0,
    [ObjectifPhysique.PRISE_DE_MASSE]: 300
  }[user.objectif] || 0;

  const calories = Math.round((mb * coefActivite) + modifObjectif);
  const ratios = {
  [ObjectifPhysique.PRISE_DE_MASSE]: { prot: 0.20, lip: 0.30, glu: 0.50 }, 
  [ObjectifPhysique.MAINTIEN]: { prot: 0.25, lip: 0.30, glu: 0.45 },
  [ObjectifPhysique.PERTE_DE_GRAS]: { prot: 0.35, lip: 0.25, glu: 0.40 }
}[user.objectif] || { prot: 0.25, lip: 0.30, glu: 0.45 };

return {
  calories,
  proteines: Math.round((calories * ratios.prot) / 4),
  lipides:   Math.round((calories * ratios.lip) / 9),
  glucides:  Math.round((calories * ratios.glu) / 4),
  limites: {
    sucre: Math.round((calories * 0.10) / 4), 
    ags:   Math.round((calories * 0.10) / 9)   
  }
}
  }

};