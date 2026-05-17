import { RATIOS_MOMENTS } from "@/lib/constants-logic";
import { BacAliment, type Aliment } from "@/lib/types";
import { RuleHelpers } from "./ruleHelpers";

// petit dej
export const SectionPetitDej = {

    autoriserLigne: (indexLigne: number, bacsChoisis: BacAliment[], besoins: any): boolean => {
        // supplement proteine
        if (indexLigne === 2) {
            const aPrisDuLait = bacsChoisis.includes(BacAliment.LAIT);

            return aPrisDuLait;
        }
        return true;
    },

    filtrerCompatibles: (indexLigne: number, compatibles: BacAliment[], bacsChoisis: BacAliment[]): BacAliment[] => {
        const aCereales = bacsChoisis.includes(BacAliment.CERE);
        const aDuPain = bacsChoisis.includes(BacAliment.PAIN) || bacsChoisis.includes(BacAliment.GAL_RIZ);
        const aPrisOeufOuProt = bacsChoisis.includes(BacAliment.PROT_VEG);

        // feculent
        if (indexLigne === 0) {
            if (aPrisOeufOuProt) {
                return compatibles.filter(b => b !== BacAliment.CERE);
            }
            return compatibles;
        }

        // prot lait
        if (indexLigne === 1) {
            // si cereales forcement lait
            if (aCereales) return compatibles.filter(b => b === BacAliment.LAIT);
            // si autre on met tout
            return compatibles;
        }

        // gras
        if (indexLigne === 4) {
            // leg est choissisable seulement si il a pris pain ou gal riz
            if (aCereales) return compatibles.filter(b => b !== BacAliment.LEG);

            if (aDuPain) {
                return compatibles.filter(b => b === BacAliment.BC || b === BacAliment.LEG);
            }
        }

        return compatibles;
    },

    calculerMarges: (bac: BacAliment, aliment: Aliment, besoins: any) => {
        // portions matin
        if (bac === BacAliment.CERE) {
            return besoins && besoins.calories > 4000 ? { min: 150, max: 250 } : RuleHelpers.adapterGrammes(35, 120, besoins);
        }
        if (bac === BacAliment.PAIN) {
            return besoins && besoins.calories > 4000 ? { min: 150, max: 300 } : { min: 40, max: 90 };
        }
        if (bac === BacAliment.GAL_RIZ) {
            return besoins && besoins.calories > 4000 ? { min: 100, max: 200 } : RuleHelpers.adapterGrammes(20, 40, besoins);
        }
        if (bac === BacAliment.LAIT) {
            return besoins && besoins.calories > 4000 ? { min: 450, max: 700 } : RuleHelpers.adapterGrammes(100, 200, besoins);
        }
        if (bac === BacAliment.PROT_VEG) {
            return besoins && besoins.calories > 4000 ? { min: 150, max: 250 } : RuleHelpers.adapterGrammes(50, 100, besoins);
        }
        if (bac === BacAliment.FRUIT_ENTIER || bac === BacAliment.FRUIT_PULPE) return { min: 100, max: 200 };

        if (bac === BacAliment.OLEAGINEUX || bac === BacAliment.BC) return besoins && besoins.calories > 4000 ? { min: 50, max: 120 } : { min: 15, max: 30 };
        if (bac === BacAliment.FROMAGE) return RuleHelpers.adapterGrammes(20, 40, besoins);
        if (bac === BacAliment.LEG) return RuleHelpers.adapterGrammes(30, 60, besoins);

        return RuleHelpers.adapterGrammes(50, 100, besoins);
    },

    // sante
    validerSanteMatin: (item: Aliment, besoins: any): boolean => {
        const bac = item.bac as BacAliment;

        if ((bac as string) === "FRUIT_ENTIER" || (bac as string) === "FRUIT_PULPE" || (bac as string) === "GAL_RIZ" || (bac === BacAliment.PAIN && item.estSnack)) return true;

        const ratioRepas = RATIOS_MOMENTS.PETIT_DEJEUNER || 0.25;
        const tolerance = besoins ? (besoins.calories < 1200 ? 1.25 : besoins.calories > 3500 ? 2.5 : 1.0) : 1.0;

        // si les besoins ne sont pas passes on met des limites basiques
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