import { 
  BacAliment, 
  MomentRepas, 
  RegimeAlimentaire, 
  TemplateRepas, 
  type Aliment 
} from "@/lib/types";

import { SEUILS_SANTE, RATIOS_MOMENTS } from "../constants";
import { MODELES_REPAS } from "../constants";

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

  estLigneAutorisee: (indexLigne: number, template: TemplateRepas, alimentsDejaChoisis: Aliment[]): boolean => {
    const bacsChoisis = alimentsDejaChoisis.map(a => a.bac);

    if (template === TemplateRepas.PETIT_DEJ) {
      const aCereales = bacsChoisis.includes(BacAliment.CERE);
      const aBasePetitDej = aCereales || bacsChoisis.includes(BacAliment.PAIN) || bacsChoisis.includes(BacAliment.GAL_RIZ);

      if (indexLigne === 1) return aCereales; 

      if (indexLigne === 2) return bacsChoisis.includes(BacAliment.LAIT) && !bacsChoisis.includes(BacAliment.PROT_VEG); 
      if (indexLigne === 4) return aBasePetitDej;
    }

    if (template === TemplateRepas.COLLATION) {
      if (indexLigne === 3) return bacsChoisis.includes(BacAliment.LAIT) && !bacsChoisis.includes(BacAliment.PROT_VEG);
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

    if (template === TemplateRepas.HOT) {
      const aSemoule = bacsChoisis.includes(BacAliment.SEMOU);
      const aSauceIncompatible = bacsChoisis.includes(BacAliment.S_HOT_WHITE) || 
                                 bacsChoisis.includes(BacAliment.S_HOT_ASIA);

      if (aSemoule && indexLigne === 3) {
        compatibles = compatibles.filter(b => b === BacAliment.S_HOT_RED || !String(b).startsWith("S_HOT"));
      }

      if (aSauceIncompatible && indexLigne === 1) {
        compatibles = compatibles.filter(b => b !== BacAliment.SEMOU);
      }
    }


    if (template === TemplateRepas.PETIT_DEJ || template === TemplateRepas.COLLATION) {
        const aCereales = bacsChoisis.includes(BacAliment.CERE);
        const aTartine = bacsChoisis.includes(BacAliment.PAIN) || bacsChoisis.includes(BacAliment.GAL_RIZ);

        const indexProtPrincipal = template === TemplateRepas.PETIT_DEJ ? 1 : 2;

        if (indexLigne === indexProtPrincipal) {
            if (aCereales) return compatibles.filter(b => b === BacAliment.LAIT);
            if (aTartine) return compatibles.filter(b => b !== BacAliment.LAIT); 
        }

        const indexGras = template === TemplateRepas.PETIT_DEJ ? 4 : 1; 
        
        if (indexLigne === indexGras) {
            if (aCereales) return compatibles.filter(b => b === BacAliment.OLEAGINEUX);
            if (aTartine) return compatibles.filter(b => b === BacAliment.BC || b === BacAliment.LEG);
        }
    }

    const aFruit = bacsChoisis.includes(BacAliment.FRUIT_ENTIER) || bacsChoisis.includes(BacAliment.FRUIT_PULPE);
    const aSaleOuGras = bacsChoisis.includes(BacAliment.BC) || 
                        bacsChoisis.includes(BacAliment.LEG) || 
                        bacsChoisis.includes(BacAliment.FROMAGE);

    if (aFruit) {
      compatibles = compatibles.filter(b => 
        b !== BacAliment.BC && 
        b !== BacAliment.LEG && 
        b !== BacAliment.FROMAGE
      );
    }

    if (aSaleOuGras) {
      compatibles = compatibles.filter(b => 
        b !== BacAliment.FRUIT_ENTIER && 
        b !== BacAliment.FRUIT_PULPE
      );
    }
    
    return compatibles;
  },

  verifAcces: (item: Aliment, moment: MomentRepas, regime: RegimeAlimentaire = RegimeAlimentaire.STANDARD, besoins?: any): boolean => {
      const bacAliment = item.bac; 
      const basesNutritives: BacAliment[] = [BacAliment.RIZ, BacAliment.PATE, BacAliment.PAIN, BacAliment.SEMOU, BacAliment.NOUILLE];
      const estCollation = moment === MomentRepas.COLLATION;
      const estLeMatinOuCollation = moment === MomentRepas.PETIT_DEJEUNER || estCollation;
      
      const toleranceDynamique = besoins 
        ? (besoins.calories < 1200 ? 1.25 : besoins.calories > 3500 ? 2.5 : 1.0) 
        : 1.0;
      const ratioEffectif = estCollation ? 0.25 : (RATIOS_MOMENTS[moment] || 0.25);

      const sel = Number(item.sel) || 0;
      let margeSel = 1;
      if (bacAliment === BacAliment.PAIN || bacAliment === BacAliment.GAL_RIZ || bacAliment === BacAliment.CERE) margeSel = 1.5;

      const limiteSel = SEUILS_SANTE.SEL_MAX_JOUR * ratioEffectif * margeSel * toleranceDynamique;

      if (sel > 1.2 && !basesNutritives.includes(bacAliment)) {
          if (sel > (limiteSel / 2)) return false;
      }
      if (sel > limiteSel) return false;

      if (estCollation && bacAliment === BacAliment.PROT_VEG && item.nom.toLowerCase().includes('oeuf')) {
          return !!(besoins && besoins.calories > 3000);
      }

      if (regime === RegimeAlimentaire.SANS_VIANDE) {
          if (String(bacAliment).startsWith("PROT_") && bacAliment !== BacAliment.PROT_P && bacAliment !== BacAliment.PROT_VEG) return false;
          if (!item.estVege && bacAliment !== BacAliment.PROT_P) return false;
      }

      if (item.nom.toLowerCase().includes('thon') && Math.random() > 0.5) return false;
      if (regime === RegimeAlimentaire.SANS_PORC && bacAliment === BacAliment.PROT_PORC) return false;

      if (estLeMatinOuCollation) {
          const template = moment === MomentRepas.PETIT_DEJEUNER ? TemplateRepas.PETIT_DEJ : TemplateRepas.COLLATION;
          const bacsAutorises = MODELES_REPAS[template].flatMap(groupe => groupe.bacs);
          if (!item.estSnack || !bacsAutorises.includes(bacAliment)) return false;
      } else {
          if (!item.estPlat) return false;
      }

      const sucre = Number(item.sucre) || 0;
      const limiteSucre = (besoins ? besoins.limites.sucre * ratioEffectif : 15) * toleranceDynamique;
      if (sucre > limiteSucre) return false;

      const grasSat = Number(item.gras_sat) || 0;
      let facteurGrasSpecial = 1;
      if (bacAliment === BacAliment.BC) facteurGrasSpecial = estCollation ? 5.0 : 3.0;
      else if (bacAliment === BacAliment.OLEAGINEUX) facteurGrasSpecial = 4.0;

      let limiteGrasSat = (besoins ? besoins.limites.gras_sat * ratioEffectif : 10) * facteurGrasSpecial * toleranceDynamique;
      const estBaseNutritive = String(bacAliment).startsWith("PROT_") || basesNutritives.includes(bacAliment);
      const seuilFinalGras = estBaseNutritive ? (limiteGrasSat * 2.0) : limiteGrasSat;

      if (bacAliment === BacAliment.FROMAGE) {
          if (grasSat > 15 || sel > 1.5) return false;
      }

      return grasSat <= seuilFinalGras;
  },

  

obtenirMargesAdaptatives: (aliment: Aliment, moment: MomentRepas, besoins: any, alimentsDejaChoisis: any[] = []) => {
    const bac = aliment.bac;
    const estMatin = moment === MomentRepas.PETIT_DEJEUNER;
    const facteurEchelle = besoins ? besoins.calories / 2000 : 1;

    const scale = (min: number, max: number) => {
      const facteurMin = Math.max(0.4, facteurEchelle); 
      const facteurMax = Math.max(1.2, facteurEchelle * 1.8);

      return {
        min: Math.round(min * facteurMin),
        max: Math.round(max * facteurMax)
      };
    };

    const nomBas = aliment.nom.toLowerCase();
    const estSec = nomBas.includes('sec') || nomBas.includes('sèche') || aliment.cal > 250;

    if (bac === BacAliment.PROT_VEG) {
        if (moment === MomentRepas.COLLATION) {
            return { min: 50, max: 120 }; 
        }
        
        const baseMarges = estSec ? scale(40, 80) : (estMatin ? scale(50, 100) : scale(100, 180));
        
        return {
            min: baseMarges.min,
            max: 200 
        };
    }

    const feculentsSecs: BacAliment[] = [BacAliment.RIZ, BacAliment.PATE, BacAliment.NOUILLE, BacAliment.SEMOU, BacAliment.CERE_REPAS];
    if (feculentsSecs.includes(bac)) return scale(40, 150);

    if (bac === BacAliment.CERE) return scale(35, 120);

    if (bac === BacAliment.LAIT) {
      const cereale = alimentsDejaChoisis.find(a => a.aliment.bac === BacAliment.CERE);
      if (cereale) {
        return { 
          min: Math.round(cereale.poids * 2), 
          max: Math.round(cereale.poids * 3) 
        };
      }
      return scale(100, 200);
    }

    if (bac === BacAliment.OLEAGINEUX || bac === BacAliment.BC) return { min: 15, max: 30 };
    if (bac === BacAliment.PROT_VOLAILLE || bac === BacAliment.PROT_BLANCHE_AUTRE) return scale(100, 160);
    if (bac === BacAliment.PROT_VIANDE_ROUGE || bac === BacAliment.PROT_PORC) return scale(100, 150);
    if (bac === BacAliment.PROT_P) return scale(120, 250);
    if (bac === BacAliment.GNOCCHI || bac === BacAliment.POTATO) {
        const marges = scale(100, 180);
        return {
            min: marges.min,
            max: Math.min(marges.max, 450) 
        };
    }
    if (bac === BacAliment.PAIN) { 
        if (Number(aliment.sel) > 1.0) {
            return { min: 40, max: 70 }; 
        }
        return { min: 40, max: 90 }; 
    }
    if (bac === BacAliment.GAL_RIZ) return scale(20, 40);
    if (bac === BacAliment.WRAP) return scale(40, 100);
    if (bac === BacAliment.LEG && aliment.estSnack) { return scale(30, 60);}
    if (bac === BacAliment.LEG) return { min: 150, max: 300 };
    if (bac === BacAliment.LAITUE) return { min: 30, max: 100 };
    if (bac === BacAliment.FRUIT_ENTIER || bac === BacAliment.FRUIT_PULPE) return { min: scale(100, 150).min, max: 200 };
    if (bac === BacAliment.FROMAGE) return scale(20, 40);
    if (bac === BacAliment.HUILE) return scale(5, 30);
    if (bac === BacAliment.VINAIGRETTE) return scale(10, 25);
    

    const estSauce = ([BacAliment.S_HOT_RED, BacAliment.S_HOT_WHITE, BacAliment.S_HOT_ASIA, BacAliment.S_COLD] as BacAliment[]).includes(bac);
      if (estSauce) return scale(15, 30);

    return scale(50, 150);
  }
};