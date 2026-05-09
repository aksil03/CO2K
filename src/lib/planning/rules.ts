import { 
  BacAliment, 
  MomentRepas, 
  RegimeAlimentaire, 
  TemplateRepas, 
  type Aliment 
} from "@/lib/types";

import { SEUILS_SANTE, RATIOS_MOMENTS } from "../constants";

export const ReglesRepas = {

  estLigneAutorisee: (
    indexLigne: number, 
    template: TemplateRepas, 
    alimentsDejaChoisis: Aliment[]
  ): boolean => {
    const bacsChoisis = alimentsDejaChoisis.map(a => a.bac);

    if (template === TemplateRepas.PETIT_DEJ) {
      const aCereales = bacsChoisis.includes(BacAliment.CERE);
      const aBasePetitDej = aCereales || bacsChoisis.includes(BacAliment.PAIN) || bacsChoisis.includes(BacAliment.GAL_RIZ);

      if (indexLigne === 1) return aCereales; 
      if (indexLigne === 3) return aBasePetitDej; 
    }
    return true;
  },

  getBacsCompatibles: (
    indexLigne: number, 
    template: TemplateRepas, 
    bacsDuGroupe: BacAliment[], 
    alimentsDejaChoisis: Aliment[],
    regime: RegimeAlimentaire = RegimeAlimentaire.STANDARD
  ): BacAliment[] => {
    const bacsChoisis = alimentsDejaChoisis.map(a => a.bac);
    let compatibles = [...bacsDuGroupe];

    if (regime === RegimeAlimentaire.SANS_PORC) {
      compatibles = compatibles.filter(b => b !== BacAliment.PROT_PORC);
    }

    if (regime === RegimeAlimentaire.SANS_VIANDE) {
      compatibles = compatibles.filter(b => {
        if (String(b).startsWith("PROT_")) {
          return b === BacAliment.PROT_P || b === BacAliment.PROT_VEG;
        }
        return true;
      });
    }

    if (template === TemplateRepas.PETIT_DEJ) {
      if (indexLigne === 1 && bacsChoisis.includes(BacAliment.CERE)) {
        return compatibles.filter(b => b === BacAliment.LAIT);
      }

      if (indexLigne === 3 && (bacsChoisis.includes(BacAliment.PAIN) || bacsChoisis.includes(BacAliment.GAL_RIZ))) {
        return compatibles.filter(b => b !== BacAliment.OLEAGINEUX);
      }
    }
    return compatibles;
  },

  verifAcces: (
    item: Aliment, 
    moment: MomentRepas, 
    regime: RegimeAlimentaire = RegimeAlimentaire.STANDARD,
    besoins?: any 
  ): boolean => {
    const bacAliment = item.bac; 
    const estLeMatinOuCollation = moment === MomentRepas.PETIT_DEJEUNER || moment === MomentRepas.COLLATION;

    if (regime === RegimeAlimentaire.SANS_VIANDE) {
      if (String(bacAliment).startsWith("PROT_") && bacAliment !== BacAliment.PROT_P && bacAliment !== BacAliment.PROT_VEG) {
        return false;
      }
      if (!item.estVege && bacAliment !== BacAliment.PROT_P) {
        return false;
      }
    }
    
    if (regime === RegimeAlimentaire.SANS_PORC && bacAliment === BacAliment.PROT_PORC) return false;
    
    if (estLeMatinOuCollation) {
      if (!item.estSnack) return false;
    } else {
      if (!item.estPlat) return false;
    }

    const sel = Number(item.sel) || 0;
    const sucre = Number(item.sucre) || 0;
    const grasSat = Number(item.gras_sat) || 0;
    const ratioMoment = RATIOS_MOMENTS[moment] || 0.25;

    const limiteSel = SEUILS_SANTE.SEL_MAX_JOUR * ratioMoment;
    const limiteSucre = besoins 
      ? besoins.limites.sucre * ratioMoment 
      : (estLeMatinOuCollation ? 15 : 10);

    if (sel > limiteSel) return false;
    if (sucre > limiteSucre) return false;

    let limiteGrasSat = besoins 
      ? besoins.limites.gras_sat * ratioMoment 
      : (estLeMatinOuCollation ? 5 : 7);

    if (bacAliment === BacAliment.BC) {
      limiteGrasSat *= 2.5; 
    }

    const estBaseNutritive = bacAliment.startsWith("PROT_") || 
      ([BacAliment.RIZ, BacAliment.PATE, BacAliment.PAIN] as BacAliment[]).includes(bacAliment as BacAliment);

    if (estBaseNutritive) {
      if (grasSat > (limiteGrasSat * 1.1)) return false;
    } else {
      if (grasSat > limiteGrasSat) return false;
    }

    return true;
  },

  obtenirMargesAdaptatives: (bac: BacAliment, moment?: MomentRepas) => {
    const estMatin = moment === MomentRepas.PETIT_DEJEUNER || moment === MomentRepas.COLLATION;

    if (bac === BacAliment.PROT_VOLAILLE || bac === BacAliment.PROT_BLANCHE_AUTRE) return { min: 100, max: 300 };
    if (bac === BacAliment.PROT_VIANDE_ROUGE || bac === BacAliment.PROT_PORC) return { min: 80, max: 220 };
    if (bac === BacAliment.PROT_P) return { min: 100, max: 280 };
    if (bac === BacAliment.PROT_VEG) return estMatin ? { min: 50, max: 150 } : { min: 100, max: 250 };

    const feculentsDenses = [
        BacAliment.RIZ, 
        BacAliment.PATE, 
        BacAliment.NOUILLE, 
        BacAliment.SEMOU, 
        BacAliment.CERE_REPAS
    ] as string[];

    if (feculentsDenses.includes(bac)) {
        return { min: 60, max: 200 }; 
    }

    if (bac === BacAliment.GNOCCHI || bac === BacAliment.POTATO) return { min: 100, max: 450 }; 
    if (bac === BacAliment.PAIN) return { min: 40, max: 150 };
    if (bac === BacAliment.GAL_RIZ) return { min: 30, max: 80 };
    if (bac === BacAliment.WRAP) return { min: 50, max: 150 };
    if (bac === BacAliment.LEG) return { min: 150, max: 400 };
    if (bac === BacAliment.LAITUE) return { min: 30, max: 120 };
    if (bac === BacAliment.FRUIT_ENTIER || bac === BacAliment.FRUIT_PULPE) return { min: 100, max: 250 };
    if (bac === BacAliment.LAIT) return { min: 100, max: 350 };
    if (bac === BacAliment.CERE) return { min: 40, max: 120 };
    if (bac === BacAliment.FROMAGE) return { min: 15, max: 60 }; 
    if (bac === BacAliment.HUILE) return { min: 5, max: 25 };
    if (bac === BacAliment.VINAIGRETTE || bac === BacAliment.BC || bac === BacAliment.OLEAGINEUX) return { min: 10, max: 50 };
    if (bac.startsWith("S_HOT_")) return { min: 20, max: 60 };
    if (bac === BacAliment.S_COLD) return { min: 15, max: 40 };

    return { min: 50, max: 200 };
  }
};