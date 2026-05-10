import { 
  BacAliment, 
  MomentRepas, 
  RegimeAlimentaire, 
  TemplateRepas, 
  type Aliment 
} from "@/lib/types";

import { SEUILS_SANTE, RATIOS_MOMENTS } from "../constants";

const RATIOS_STRUCTURE = {
  [TemplateRepas.PETIT_DEJ]: {
    [BacAliment.LAIT]: { ref: BacAliment.CERE, maxRatio: 4, minRatio: 1.5 },
    [BacAliment.OLEAGINEUX]: { minAbsolu: 15, maxAbsolu: 40 }
  },
  [TemplateRepas.HOT]: {
    [BacAliment.LEG]: { ref: BacAliment.RIZ, minRatio: 0.5 }
  }
};

export const ReglesRepas = {
  ratios: RATIOS_STRUCTURE,

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
      const estCollation = moment === MomentRepas.COLLATION;
      const estLeMatinOuCollation = moment === MomentRepas.PETIT_DEJEUNER || estCollation;
      
      const toleranceDynamique = besoins 
        ? (besoins.calories < 1200 ? 1.25 : besoins.calories > 3500 ? 1.8 : 1.0) 
        : 1.0;

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
          if (!item.estSnack && bacAliment !== BacAliment.LEG && bacAliment !== BacAliment.OLEAGINEUX) return false;
      } else {
          if (!item.estPlat) return false;
      }

      const sel = Number(item.sel) || 0;
      const sucre = Number(item.sucre) || 0;
      const grasSat = Number(item.gras_sat) || 0;

      const ratioEffectif = estCollation ? 0.25 : (RATIOS_MOMENTS[moment] || 0.25);

      let margeSel = 1;
      if (bacAliment === BacAliment.PAIN || bacAliment === BacAliment.GAL_RIZ || bacAliment === BacAliment.CERE) {
          margeSel = 2.5; 
      }

      const limiteSel = SEUILS_SANTE.SEL_MAX_JOUR * ratioEffectif * margeSel * toleranceDynamique;
      const limiteSucre = (besoins 
          ? besoins.limites.sucre * ratioEffectif 
          : (estLeMatinOuCollation ? 30 : 10)) * toleranceDynamique;

      if (sel > limiteSel) return false;
      if (sucre > limiteSucre) return false;

      let facteurGrasSpecial = 1;
      if (bacAliment === BacAliment.BC) {
          facteurGrasSpecial = estCollation ? 5.0 : 3.0;
      } else if (bacAliment === BacAliment.OLEAGINEUX) {
          facteurGrasSpecial = 4.0;
      }

      let limiteGrasSat = (besoins 
        ? besoins.limites.gras_sat * ratioEffectif 
        : (estLeMatinOuCollation ? 10 : 7)) * facteurGrasSpecial * toleranceDynamique;

      const basesNutritives: BacAliment[] = [BacAliment.RIZ, BacAliment.PATE, BacAliment.PAIN, BacAliment.SEMOU, BacAliment.NOUILLE];
      const estBaseNutritive = String(bacAliment).startsWith("PROT_") || basesNutritives.includes(bacAliment);

      const seuilFinal = estBaseNutritive ? (limiteGrasSat * 2.0) : limiteGrasSat;

      if (grasSat > seuilFinal) return false;

      return true;
  },

  

obtenirMargesAdaptatives: (bac: BacAliment, moment: MomentRepas, besoins: any, alimentsDejaChoisis: any[] = []) => {
    const estMatin = moment === MomentRepas.PETIT_DEJEUNER;
    const facteurEchelle = besoins ? besoins.calories / 2000 : 1;

    const scale = (min: number, max: number) => ({
        min: Math.round(min * Math.max(0.15, facteurEchelle)),
        max: Math.round(max * Math.max(1, facteurEchelle * 1.5))
    });

    if (bac === BacAliment.CERE) return scale(35, 55); 

    if (bac === BacAliment.LAIT) {
        const cereale = alimentsDejaChoisis.find(a => a.aliment.bac === BacAliment.CERE);
        if (cereale) {
            const poidsCereales = cereale.poids;
            return { 
                min: Math.round(poidsCereales * 2), 
                max: Math.round(poidsCereales * 3) 
            };
        }
        return scale(100, 200);
    }

    if (bac === BacAliment.OLEAGINEUX || bac === BacAliment.BC) return { min: 15, max: 30 }; 

    if (bac === BacAliment.PROT_VOLAILLE || bac === BacAliment.PROT_BLANCHE_AUTRE) return scale(100, 200);
    if (bac === BacAliment.PROT_VIANDE_ROUGE || bac === BacAliment.PROT_PORC) return scale(80, 180);
    if (bac === BacAliment.PROT_P) return scale(100, 220);
    if (bac === BacAliment.PROT_VEG) return estMatin ? scale(30, 120) : scale(80, 200);

    const feculentsDenses: BacAliment[] = [BacAliment.RIZ, BacAliment.PATE, BacAliment.NOUILLE, BacAliment.SEMOU, BacAliment.CERE_REPAS];
    if (feculentsDenses.includes(bac)) return scale(40, 120); 

    if (bac === BacAliment.GNOCCHI || bac === BacAliment.POTATO) return scale(100, 350); 
    if (bac === BacAliment.PAIN) return scale(30, 100);
    if (bac === BacAliment.GAL_RIZ) return scale(20, 60);
    if (bac === BacAliment.WRAP) return scale(40, 150);
    if (bac === BacAliment.LEG) return { min: 150, max: 400 }; 
    if (bac === BacAliment.LAITUE) return { min: 30, max: 150 }; 
    if (bac === BacAliment.FRUIT_ENTIER || bac === BacAliment.FRUIT_PULPE) return scale(80, 200);
    if (bac === BacAliment.FROMAGE) return scale(20, 50); 
    if (bac === BacAliment.HUILE) return scale(5, 20);
    if (bac === BacAliment.VINAIGRETTE) return scale(10, 40);
    
    return scale(50, 200);
  }
};