import { 
    type Aliment, 
    type PanierItem, 
    MomentRepas,
    BacAliment 
} from "@/lib/types"; 

import { ReglesRepas } from "./rules";

export const NutritionSolver = {

    getSum: (p: PanierItem[], macro: keyof Aliment): number => {
        return p.reduce((acc, curr) => {
            const valeur100g = Number(curr.aliment[macro]) || 0;
            const poids = Number(curr.poids) || 0;
            return acc + (valeur100g * (poids / 100));
        }, 0);
    },

    resoudreMenu: (
        panierInitial: PanierItem[], 
        cibles: { prot: number, lip: number, glu: number },
        moment: MomentRepas,
        seuils: { gras_sat: number, sucre: number, sel: number } 
    ): PanierItem[] => {
        
        let result = panierInitial.map(item => ({
            ...item,
            poids: ReglesRepas.obtenirMargesAdaptatives(item.aliment.bac, moment).min
        }));
        
        const getBacStr = (p: PanierItem) => String(p.aliment.bac).toUpperCase().trim();

        // CONVERGENCE 
        for (let iter = 0; iter < 25; iter++) {
            
        result.forEach(item => {
            const b = getBacStr(item);
            if (moment === MomentRepas.DEJEUNER || moment === MomentRepas.DINER) {
                if (b === BacAliment.LEG || b === BacAliment.LAITUE) {
                    const m = ReglesRepas.obtenirMargesAdaptatives(item.aliment.bac, moment);                
                    item.poids = Math.max(50, m.min); 
                }
            }
        });

            const feculents = result.filter(p => [
                BacAliment.RIZ, BacAliment.PATE, BacAliment.NOUILLE, BacAliment.SEMOU, 
                BacAliment.GNOCCHI, BacAliment.POTATO, BacAliment.CERE_REPAS, BacAliment.WRAP,
                BacAliment.CERE, BacAliment.PAIN, BacAliment.GAL_RIZ,
                BacAliment.FRUIT_ENTIER, BacAliment.FRUIT_PULPE
            ].map(String).includes(getBacStr(p)));

            feculents.forEach(fec => {
                const m = ReglesRepas.obtenirMargesAdaptatives(fec.aliment.bac, moment);
                const dejaLa = NutritionSolver.getSum(result.filter(x => x.aliment.id !== fec.aliment.id), 'glu');
                const valeurMacro = Number(fec.aliment.glu) || 1;
                
                let poidsG = ((cibles.glu - dejaLa) / valeurMacro) * 100;

                const poidsMaxG = ((cibles.glu * 1.02 - dejaLa) / valeurMacro) * 100;
                poidsG = Math.min(poidsG, poidsMaxG);

                const sel100g = Number(fec.aliment.sel) || 0;
                if (sel100g > 0.1) {
                    const dejaLaSel = NutritionSolver.getSum(result.filter(x => x.aliment.id !== fec.aliment.id), 'sel');
                    const restePossibleSel = Math.max(0, seuils.sel - dejaLaSel);
                    poidsG = Math.min(poidsG, (restePossibleSel / sel100g) * 100);
                }

                const sat100g = Number(fec.aliment.gras_sat) || 0;
                if (sat100g > 0.3) {
                    const dejaLaSat = NutritionSolver.getSum(result.filter(x => x.aliment.id !== fec.aliment.id), 'gras_sat');
                    const restePossibleSat = Math.max(0, seuils.gras_sat - dejaLaSat);
                    poidsG = Math.min(poidsG, (restePossibleSat / sat100g) * 100);
                }
                
                fec.poids = Math.max(m.min, Math.min(poidsG, m.max));
            });

            const proteines = result.filter(p => {
                const b = getBacStr(p);
                return b === BacAliment.LAIT || b === BacAliment.PROT_VEG || b.startsWith("PROT_");
            });

            proteines.forEach(prot => {
                const m = ReglesRepas.obtenirMargesAdaptatives(prot.aliment.bac, moment);
                const dejaLa = NutritionSolver.getSum(result.filter(x => x.aliment.id !== prot.aliment.id), 'prot');
                const valeurMacro = Number(prot.aliment.prot) || 1;
                
                let poidsP = ((cibles.prot - dejaLa) / valeurMacro) * 100;

                const sel100g = Number(prot.aliment.sel) || 0;
                if (sel100g > 0.1) {
                    const dejaLaSel = NutritionSolver.getSum(result.filter(x => x.aliment.id !== prot.aliment.id), 'sel');
                    const restePossibleSel = Math.max(0, seuils.sel - dejaLaSel);
                    poidsP = Math.min(poidsP, (restePossibleSel / sel100g) * 100);
                }

                const sat100g = Number(prot.aliment.gras_sat) || 0;
                if (sat100g > 0.5) { 
                    const dejaLaSat = NutritionSolver.getSum(result.filter(x => x.aliment.id !== prot.aliment.id), 'gras_sat');
                    const restePossibleSat = Math.max(0, seuils.gras_sat - dejaLaSat);
                    poidsP = Math.min(poidsP, (restePossibleSat / sat100g) * 100);
                }
                
                prot.poids = Math.max(m.min, Math.min(poidsP, m.max));
            });

     
            const sourcesGras = result.filter(p => [
                BacAliment.BC, BacAliment.OLEAGINEUX, BacAliment.FROMAGE, BacAliment.HUILE, 
                BacAliment.S_HOT_WHITE, BacAliment.VINAIGRETTE, BacAliment.S_COLD
            ].map(String).includes(getBacStr(p)));

            sourcesGras.forEach(gras => {
                const m = ReglesRepas.obtenirMargesAdaptatives(gras.aliment.bac, moment);
                const dejaLa = NutritionSolver.getSum(result.filter(x => x.aliment.id !== gras.aliment.id), 'lip');
                const valeurMacro = Number(gras.aliment.lip) || 1;
                
                let poidsFinalL = ((cibles.lip - dejaLa) / valeurMacro) * 100;

                const sel100g = Number(gras.aliment.sel) || 0;
                if (sel100g > 0.1) {
                    const dejaLaSel = NutritionSolver.getSum(result.filter(x => x.aliment.id !== gras.aliment.id), 'sel');
                    const restePossibleSel = Math.max(0, seuils.sel - dejaLaSel);
                    poidsFinalL = Math.min(poidsFinalL, (restePossibleSel / sel100g) * 100);
                }

          
                const sat100g = Number(gras.aliment.gras_sat) || 0;
                if (sat100g > 0.5) { 
                    const dejaLaSat = NutritionSolver.getSum(result.filter(x => x.aliment.id !== gras.aliment.id), 'gras_sat');
                    const restePossibleSat = Math.max(0, seuils.gras_sat - dejaLaSat);
                    poidsFinalL = Math.min(poidsFinalL, (restePossibleSat / sat100g) * 100);
                }

                gras.poids = Math.max(m.min, Math.min(poidsFinalL, m.max));
            });
        }


        return result.map(item => ({ 
            ...item, 
            poids: Math.round(Number(item.poids)) 
        }));
    }
};