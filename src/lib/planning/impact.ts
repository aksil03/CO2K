import { Genre, type UserWithRelations } from "../types";
import { COEFS_ACTIVITE, AJUSTEMENT_OBJECTIF } from "../constants";

export const CalculateurImpact = {
  calculerBesoinsNutritionnels: (user: UserWithRelations) => {
    if (!user) return null;

    // Formule Mifflin-St Jeor
    const base = (10 * user.poids) + (6.25 * user.taille) - (5 * user.age);
    const mb = user.genre === Genre.HOMME ? base + 5 : base - 161;
    const coef = COEFS_ACTIVITE[user.activite] || 1.2; 
    const maintenance = mb * coef;
    const calories = Math.round(maintenance + AJUSTEMENT_OBJECTIF[user.objectif]);

    return {
      calories,
      proteines: Math.round((calories * 0.25) / 4), 
      lipides:   Math.round((calories * 0.30) / 9), 
      glucides:  Math.round((calories * 0.45) / 4), 
      
      limites: {
        sucre: Math.round((calories * 0.10) / 4),    
        gras_sat: Math.round((calories * 0.10) / 9), 
        sel: 5                                      
      }
    };
  }
};