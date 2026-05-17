import { BacAliment, type Aliment } from "@/lib/types";
import { RATIOS_MOMENTS } from "@/lib/constants-logic";
import { RuleHelpers } from "./ruleHelpers";

// collation
export const SectionCollation = {

    autoriserLigne: (indexLigne: number, bacsChoisis: BacAliment[], besoins: any): boolean => {
        if (indexLigne === 1 && besoins && besoins.calories > 4000) {
            return true;
        }

        // prot vege optionnel
        if (indexLigne === 3) {
            const aPrisDuLait = bacsChoisis.includes(BacAliment.LAIT);
            return aPrisDuLait;
        }
        return true;
    },

    filtrerCompatibles: (indexLigne: number, compatibles: BacAliment[], bacsChoisis: BacAliment[], besoins?: any): BacAliment[] => {
        const aCereales = bacsChoisis.includes(BacAliment.CERE);
        const aDuPain = bacsChoisis.includes(BacAliment.PAIN) || bacsChoisis.includes(BacAliment.GAL_RIZ);
        const aPainOuGalette = bacsChoisis.includes(BacAliment.PAIN) || bacsChoisis.includes(BacAliment.GAL_RIZ);
        const aCerealeOuFruit = bacsChoisis.includes(BacAliment.CERE) || bacsChoisis.includes(BacAliment.FRUIT_ENTIER);


        if (indexLigne === 0) {
            const aFromageBcOuLeg = bacsChoisis.includes(BacAliment.FROMAGE) || bacsChoisis.includes(BacAliment.BC) || bacsChoisis.includes(BacAliment.LEG);
            const aPrisProtVeg = bacsChoisis.includes(BacAliment.PROT_VEG);

            if (aFromageBcOuLeg) {
                compatibles = compatibles.filter(b => b !== BacAliment.FRUIT_ENTIER && b !== BacAliment.CERE);
            }

            if (aPrisProtVeg) {
                compatibles = compatibles.filter(b => b !== BacAliment.CERE);
            }

            if (besoins && besoins.calories > 4000) {
                return compatibles.filter(b => b === BacAliment.PAIN || b === BacAliment.CERE);
            }
            return compatibles;
        }


        if (indexLigne === 1) {
            // gros gabarit 
            if (besoins && besoins.calories > 4000) {
                if (aCereales) {
                    return compatibles.filter(b => b === BacAliment.BC || b === BacAliment.OLEAGINEUX);
                }
                if (aDuPain) {
                    return compatibles.filter(b => b === BacAliment.BC || b === BacAliment.OLEAGINEUX || b === BacAliment.FROMAGE || b === BacAliment.LEG);
                }
            }

            if (aCereales) {
                return compatibles.filter(b => b === BacAliment.OLEAGINEUX);
            }
            if (aPainOuGalette) {
                return compatibles.filter(b => b === BacAliment.FROMAGE || b === BacAliment.LEG || b === BacAliment.BC);
            }
            if (aCerealeOuFruit) {
                return compatibles.filter(b => b === BacAliment.OLEAGINEUX);
            }
        }

        if (indexLigne === 2 && aCereales) {
            return compatibles.filter(b => b === BacAliment.LAIT);
        }

        return compatibles;
    },

    calculerMarges: (bac: BacAliment, aliment: Aliment, besoins: any) => {
        const estGrosGabarit = besoins && besoins.calories > 4000;

        if (bac === BacAliment.PROT_VEG) return estGrosGabarit ? { min: 80, max: 200 } : { min: 50, max: 120 };
        if (bac === BacAliment.CERE) {
            return estGrosGabarit ? { min: 150, max: 300 } : RuleHelpers.adapterGrammes(35, 120, besoins);
        }

        if (bac === BacAliment.PAIN) {
            return estGrosGabarit ? { min: 150, max: 300 } : { min: 40, max: 70 };
        }
        if (bac === BacAliment.GAL_RIZ) return RuleHelpers.adapterGrammes(20, 40, besoins);

        if (bac === BacAliment.LAIT) {
            return estGrosGabarit ? { min: 250, max: 600 } : RuleHelpers.adapterGrammes(100, 200, besoins);
        }

        if (bac === BacAliment.FRUIT_ENTIER || bac === BacAliment.FRUIT_PULPE) return { min: 100, max: 200 };
        if (bac === BacAliment.OLEAGINEUX || bac === BacAliment.BC) return estGrosGabarit ? { min: 50, max: 120 } : { min: 15, max: 30 };
        if (bac === BacAliment.FROMAGE) return RuleHelpers.adapterGrammes(20, 40, besoins);
        if (bac === BacAliment.LEG) return RuleHelpers.adapterGrammes(30, 60, besoins);

        return RuleHelpers.adapterGrammes(50, 100, besoins);
    },

    // sante
    validerSantePause: (item: Aliment, besoins: any): boolean => {
        const bac = item.bac as BacAliment;

        if ((bac as string) === "CERE" || (bac as string) === "FRUIT_ENTIER" || (bac as string) === "GAL_RIZ" || (bac === BacAliment.PAIN && item.estSnack)) return true;

        const ratioRepas = RATIOS_MOMENTS.COLLATION || 0.15;
        const tolerance = besoins ? (besoins.calories < 1200 ? 1.25 : besoins.calories > 3500 ? 2.5 : 1.0) : 1.0;
        const limitesProfil = besoins?.limites || { sucre: 50, gras_sat: 20, sel: 5 };

        // sel
        const sel = Number(item.sel) || 0;
        const margeSel = (bac === BacAliment.PAIN || bac === BacAliment.GAL_RIZ || bac === BacAliment.CERE) ? 1.5 : 1.0;
        const limiteSel = limitesProfil.sel * ratioRepas * margeSel * tolerance;
        if (sel > limiteSel) return false;

        // sucre
        const sucre = Number(item.sucre) || 0;
        const limiteSucre = limitesProfil.sucre * ratioRepas * tolerance;
        if (sucre > limiteSucre) return false;

        // gras
        const grasSat = Number(item.gras_sat) || 0;
        let facteurGras = 1.0;
        if (bac === BacAliment.BC) facteurGras = 3.0;
        else if (bac === BacAliment.OLEAGINEUX) facteurGras = 4.0;

        const limiteGrasSat = limitesProfil.gras_sat * ratioRepas * facteurGras * tolerance;
        if (grasSat > limiteGrasSat) return false;

        return true;
    }
};