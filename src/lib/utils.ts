import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Aliment } from "./types"

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
  }
}