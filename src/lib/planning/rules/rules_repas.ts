import { BacAliment, MomentRepas, type Aliment } from "@/lib/types";
import { RATIOS_MOMENTS } from "@/lib/constants-logic";
import { RuleHelpers } from "./ruleHelpers";

export const SectionRepas = {

    autoriserLigne: (indexLigne: number, bacsChoisis: BacAliment[], besoins: any, alimentsDejaChoisis: Aliment[], moment: MomentRepas): boolean => {
        // lignes obligatoire
        if (indexLigne < 3) return true;

        const ratioRepas = RATIOS_MOMENTS[moment] || 0.30;
        const limitesProfil = besoins?.limites || { sucre: 50, gras_sat: 20, sel: 5 };

        // sauce si gras est large
        if (indexLigne === 3) {
            const grasSatActuel = alimentsDejaChoisis.reduce((acc, curr) => acc + (Number(curr.gras_sat) || 0), 0);
            const limiteGrasSatRepas = limitesProfil.gras_sat * ratioRepas;
            return grasSatActuel < limiteGrasSatRepas;
        }

        // huile pour lipides
        if (indexLigne === 4) {
            return true;
        }

        return true;
    },

    filtrerCompatibles: (indexLigne: number, compatibles: BacAliment[], bacsChoisis: BacAliment[]): BacAliment[] => {
        const aNouilles = bacsChoisis.includes(BacAliment.NOUILLE);
        const aSemoule = bacsChoisis.includes(BacAliment.SEMOU);

        const aSauceAsia = bacsChoisis.includes(BacAliment.S_HOT_ASIA);
        const aSauceRed = bacsChoisis.includes(BacAliment.S_HOT_RED);
        const aSauceWhite = bacsChoisis.includes(BacAliment.S_HOT_WHITE);

        if (indexLigne === 1) {
            if (aSauceAsia) {
                return compatibles.filter(b => b === BacAliment.NOUILLE);
            }
            if (aSauceRed) {
                return compatibles.filter(b => b !== BacAliment.NOUILLE);
            }
            if (aSauceWhite) {
                return compatibles.filter(b => b !== BacAliment.SEMOU && b !== BacAliment.NOUILLE);
            }
        }

        if (indexLigne === 3) {
            if (aNouilles) return compatibles.filter(b => b === BacAliment.S_HOT_ASIA);
            if (aSemoule) return compatibles.filter(b => b === BacAliment.S_HOT_RED);
        }

        return compatibles;
    },


    calculerMarges: (bac: BacAliment, aliment: Aliment, besoins: any) => {
        if (bac === BacAliment.OLEAGINEUX) return { min: 10, max: 30 };
        const estSec = aliment.cal > 250;

        if (bac === BacAliment.PROT_VEG) return estSec ? RuleHelpers.adapterGrammes(40, 80, besoins) : RuleHelpers.adapterGrammes(100, 180, besoins);
        if (bac === BacAliment.PROT_VOLAILLE || bac === BacAliment.PROT_BLANCHE_AUTRE) return RuleHelpers.adapterGrammes(100, 160, besoins);
        if (bac === BacAliment.PROT_VIANDE_ROUGE || bac === BacAliment.PROT_PORC) return RuleHelpers.adapterGrammes(100, 150, besoins);
        if (bac === BacAliment.PROT_P) return RuleHelpers.adapterGrammes(120, 250, besoins);

        const FECULENTS_SECS: BacAliment[] = [BacAliment.RIZ, BacAliment.PATE, BacAliment.NOUILLE, BacAliment.SEMOU, BacAliment.CERE_REPAS];
        if (FECULENTS_SECS.includes(bac)) {
            const deBase = RuleHelpers.adapterGrammes(40, 150, besoins);
            return besoins && besoins.calories > 4000 ? { min: deBase.min, max: 400 } : deBase;
        }

        if (bac === BacAliment.GNOCCHI || bac === BacAliment.POTATO) {
            const marges = RuleHelpers.adapterGrammes(100, 180, besoins);
            return { min: marges.min, max: Math.min(marges.max, 450) };
        }

        if (bac === BacAliment.LEG) return { min: 150, max: 300 };

        if (bac === BacAliment.HUILE) {
            const deBase = RuleHelpers.adapterGrammes(3, 20, besoins);
            return besoins && besoins.calories > 4000 ? { min: deBase.min, max: 60 } : deBase;
        }

        const SAUCES_CHAUDES: BacAliment[] = [BacAliment.S_HOT_RED, BacAliment.S_HOT_WHITE, BacAliment.S_HOT_ASIA];
        if (SAUCES_CHAUDES.includes(bac)) return RuleHelpers.adapterGrammes(15, 30, besoins);

        return RuleHelpers.adapterGrammes(50, 150, besoins);
    },

    validerSanteRepas: (item: Aliment, momentOuBesoins: any, besoinsOptionnels?: any): boolean => {
        if (item.bac === "OLEAGINEUX" || item.bac === "HUILE" || item.bac === "VINAIGRETTE" || item.bac === "PROT_VEG" || item.bac === "PAIN") {
            return true;
        }

        const besoins = besoinsOptionnels || (momentOuBesoins && typeof momentOuBesoins === 'object' && 'calories' in momentOuBesoins ? momentOuBesoins : null);
        const moment = (typeof momentOuBesoins === 'string' ? momentOuBesoins : MomentRepas.DEJEUNER) as MomentRepas;

        const ratioRepas = RATIOS_MOMENTS[moment] || 0.30;
        const tolerance = besoins ? (besoins.calories < 1200 ? 1.25 : besoins.calories > 3500 ? 2.5 : 1.0) : 1.0;
        const limitesProfil = besoins?.limites || { sucre: 50, gras_sat: 20, sel: 5 };
        const estUnFromage = item.bac === "FROMAGE";

        // sel
        const selBrut = Number(item.sel) || 0;
        const selEvalue = estUnFromage ? (selBrut * 30) / 100 : selBrut;

        const limiteSel = limitesProfil.sel * ratioRepas * tolerance;
        if (selEvalue > limiteSel) return false;

        // sucre
        const sucre = Number(item.sucre) || 0;
        const limiteSucre = limitesProfil.sucre * ratioRepas * tolerance;
        if (sucre > limiteSucre) return false;

        // gras
        const grasSatBrut = Number(item.gras_sat) || 0;
        const grasSatEvalue = estUnFromage ? (grasSatBrut * 30) / 100 : grasSatBrut;

        const limiteGrasSat = limitesProfil.gras_sat * ratioRepas * tolerance;
        if (grasSatEvalue > limiteGrasSat) return false;

        return true;
    }
};

// sandwich
export const SectionSandwich = {

    autoriserLigne: (indexLigne: number, besoins: any, alimentsDejaChoisis: Aliment[], moment: MomentRepas): boolean => {
        // lignes obligatoires
        if (indexLigne === 0 || indexLigne === 1 || indexLigne === 3) return true;

        const ratioRepas = RATIOS_MOMENTS[moment] || 0.30;
        const limitesProfil = besoins?.limites || { sucre: 50, gras_sat: 20, sel: 5 };
        const limiteGrasSatRepas = limitesProfil.gras_sat * ratioRepas;
        const grasSatActuel = alimentsDejaChoisis.reduce((acc, curr) => acc + (Number(curr.gras_sat) || 0), 0);

        // si marge de gras
        if (indexLigne === 2 || indexLigne === 4) {
            return grasSatActuel < limiteGrasSatRepas;
        }

        return true;
    },

    calculerMarges: (bac: BacAliment, aliment: Aliment, besoins: any) => {
        const estGrosGabarit = besoins && besoins.calories > 4000;

        if (bac === BacAliment.PAIN) {
            return estGrosGabarit ? { min: 200, max: 400 } : { min: 60, max: 120 };
        }
        if (bac === BacAliment.PROT_VOLAILLE || bac === BacAliment.PROT_BLANCHE_AUTRE) {
            return estGrosGabarit ? { min: 150, max: 350 } : RuleHelpers.adapterGrammes(80, 140, besoins);
        }
        if (bac === BacAliment.PROT_VIANDE_ROUGE || bac === BacAliment.PROT_PORC) {
            return estGrosGabarit ? { min: 120, max: 300 } : RuleHelpers.adapterGrammes(80, 130, besoins);
        }
        if (bac === BacAliment.PROT_P) {
            return estGrosGabarit ? { min: 150, max: 400 } : RuleHelpers.adapterGrammes(100, 180, besoins);
        }
        if (bac === BacAliment.FROMAGE) {
            return RuleHelpers.adapterGrammes(15, 30, besoins);
        }
        if (bac === BacAliment.LAITUE || bac === BacAliment.LEG) {
            return { min: 30, max: 80 };
        }
        if (bac === BacAliment.S_COLD) {
            return estGrosGabarit ? { min: 15, max: 70 } : RuleHelpers.adapterGrammes(10, 25, besoins);
        }

        return RuleHelpers.adapterGrammes(50, 120, besoins);
    }
};

// wrap
export const SectionWrap = {

    autoriserLigne: (indexLigne: number, besoins: any, alimentsDejaChoisis: Aliment[], moment: MomentRepas): boolean => {
        // obligatoire
        if (indexLigne === 0 || indexLigne === 1 || indexLigne === 2) return true;

        // gros gabarit 
        if (besoins && besoins.calories > 4000) return true;

        const ratioRepas = RATIOS_MOMENTS[moment] || 0.30;
        const limitesProfil = besoins?.limites || { sucre: 50, gras_sat: 20, sel: 5 };
        const limiteGrasSatRepas = limitesProfil.gras_sat * ratioRepas;
        const grasSatActuel = alimentsDejaChoisis.reduce((acc, curr) => acc + (Number(curr.gras_sat) || 0), 0);

        if (indexLigne === 3 || indexLigne === 4) {
            return grasSatActuel < limiteGrasSatRepas;
        }

        return true;
    },

    calculerMarges: (bac: BacAliment, aliment: Aliment, besoins: any) => {
        const estGrosGabarit = besoins && besoins.calories > 4000;

        if (bac === BacAliment.WRAP) {
            return estGrosGabarit ? { min: 200, max: 400 } : { min: 40, max: 90 };
        }
        if (bac === BacAliment.PROT_VOLAILLE || bac === BacAliment.PROT_BLANCHE_AUTRE) {
            return estGrosGabarit ? { min: 150, max: 350 } : RuleHelpers.adapterGrammes(80, 140, besoins);
        }
        if (bac === BacAliment.PROT_VIANDE_ROUGE || bac === BacAliment.PROT_PORC) {
            return estGrosGabarit ? { min: 120, max: 300 } : RuleHelpers.adapterGrammes(80, 130, besoins);
        }
        if (bac === BacAliment.PROT_P) {
            return estGrosGabarit ? { min: 150, max: 400 } : RuleHelpers.adapterGrammes(100, 180, besoins);
        }
        if (bac === BacAliment.PROT_VEG) {
            return estGrosGabarit ? { min: 120, max: 300 } : RuleHelpers.adapterGrammes(60, 120, besoins);
        }
        if (bac === BacAliment.FROMAGE) {
            return estGrosGabarit ? { min: 30, max: 80 } : RuleHelpers.adapterGrammes(15, 30, besoins);
        }
        if (bac === BacAliment.LAITUE || bac === BacAliment.LEG) {
            return { min: 30, max: 80 };
        }
        if (bac === BacAliment.S_COLD) {
            return estGrosGabarit ? { min: 30, max: 80 } : RuleHelpers.adapterGrammes(10, 25, besoins);
        }

        return estGrosGabarit ? { min: 100, max: 300 } : RuleHelpers.adapterGrammes(50, 120, besoins);
    }
};

//salade 
export const SectionSalade = {

    autoriserLigne: (indexLigne: number, bacsChoisis: BacAliment[], besoins: any, alimentsDejaChoisis?: Aliment[], moment?: MomentRepas): boolean => {
        if (indexLigne === 1 && besoins && besoins.calories > 4000) {
            return true;
        }

        if (indexLigne === 3) {
            const aPrisDuLait = bacsChoisis.includes(BacAliment.LAIT);

            return aPrisDuLait;
        }
        return true;
    },

    filtrerCompatibles: (indexLigne: number, compatibles: BacAliment[], bacsChoisis: BacAliment[]): BacAliment[] => {
        if (compatibles.includes(BacAliment.OLEAGINEUX)) {
            return compatibles;
        }

        const aNouilles = bacsChoisis.includes(BacAliment.NOUILLE);

        // sauce asia nouille
        if (indexLigne === 4) {
            if (!aNouilles) {
                return compatibles.filter(b => b !== BacAliment.S_HOT_ASIA);
            }
        }

        return compatibles;
    },

    calculerMarges: (bac: BacAliment, aliment: Aliment, besoins: any) => {
        if (bac === BacAliment.LAITUE || bac === BacAliment.LEG) return { min: 100, max: 250 };
        if (bac === BacAliment.FROMAGE) return RuleHelpers.adapterGrammes(15, 30, besoins);
        if (bac === BacAliment.PROT_VOLAILLE || bac === BacAliment.PROT_BLANCHE_AUTRE) return RuleHelpers.adapterGrammes(80, 150, besoins);
        if (bac === BacAliment.PROT_VIANDE_ROUGE || bac === BacAliment.PROT_PORC) return RuleHelpers.adapterGrammes(80, 130, besoins);
        if (bac === BacAliment.PROT_P) return RuleHelpers.adapterGrammes(100, 200, besoins);
        if (bac === BacAliment.PROT_VEG) return RuleHelpers.adapterGrammes(80, 160, besoins);

        const FECULENTS_SALADE: BacAliment[] = [BacAliment.RIZ, BacAliment.PATE, BacAliment.POTATO, BacAliment.CERE_REPAS, BacAliment.NOUILLE];
        if (FECULENTS_SALADE.includes(bac)) {
            const deBase = RuleHelpers.adapterGrammes(40, 140, besoins);
            return besoins && besoins.calories > 4000 ? { min: deBase.min, max: 400 } : deBase;
        }

        if (bac === BacAliment.OLEAGINEUX) return { min: 10, max: 40 };

        if (bac === BacAliment.VINAIGRETTE || bac === BacAliment.HUILE) {
            const deBase = RuleHelpers.adapterGrammes(5, 15, besoins);
            return besoins && besoins.calories > 4000 ? { min: deBase.min, max: 60 } : deBase;
        }

        if (bac === BacAliment.S_HOT_ASIA) return RuleHelpers.adapterGrammes(15, 30, besoins);

        return RuleHelpers.adapterGrammes(50, 120, besoins);
    }
};