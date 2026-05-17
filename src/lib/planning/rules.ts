import { BacAliment, MomentRepas, TemplateRepas, type Aliment } from "@/lib/types";
import { SectionPetitDej } from "./rules/rules_matin";
import { SectionCollation } from "./rules/rules_coll";
import { SectionRepas, SectionSalade, SectionSandwich, SectionWrap } from "./rules/rules_repas";
import { RuleHelpers } from "./rules/ruleHelpers";

// routeur
const getSectionByTemplate = (template: TemplateRepas) => {
  switch (template) {
    case TemplateRepas.PETIT_DEJ:
      return SectionPetitDej;
    case TemplateRepas.COLLATION:
      return SectionCollation;
    case TemplateRepas.SANDWICH:
      return SectionSandwich;
    case TemplateRepas.WRAP:
      return SectionWrap;
    case TemplateRepas.SALADE:
      return SectionSalade;
    case TemplateRepas.HOT:
    default:
      return SectionRepas;
  }
};

export const ReglesRepas = {
  // lignes autorisées
  estLigneAutorisee: (indexLigne: number, template: TemplateRepas, alimentsDejaChoisis: Aliment[], besoins?: any): boolean => {
    const bacsChoisis = alimentsDejaChoisis.map(a => a.bac as BacAliment);
    const section = getSectionByTemplate(template);

    if (template === TemplateRepas.PETIT_DEJ) {
      return SectionPetitDej.autoriserLigne(indexLigne, bacsChoisis, besoins);
    }

    if (template === TemplateRepas.COLLATION) {
      return SectionCollation.autoriserLigne(indexLigne, bacsChoisis, besoins);
    }

    if (template === TemplateRepas.HOT) {
      return SectionRepas.autoriserLigne(indexLigne, bacsChoisis, besoins, alimentsDejaChoisis, MomentRepas.DEJEUNER);
    }

    if (template === TemplateRepas.SANDWICH) {
      return SectionSandwich.autoriserLigne(indexLigne, besoins, alimentsDejaChoisis, MomentRepas.DEJEUNER);
    }

    if (template === TemplateRepas.WRAP) {
      return SectionWrap.autoriserLigne(indexLigne, besoins, alimentsDejaChoisis, MomentRepas.DEJEUNER);
    }

    if (template === TemplateRepas.SALADE) {
      return SectionSalade.autoriserLigne(indexLigne, bacsChoisis, besoins, alimentsDejaChoisis, MomentRepas.DEJEUNER);
    }

    return true;
  },

  // compatibles avec les choix precedents
  getBacsCompatibles: (indexLigne: number, template: TemplateRepas, bDuGroupe: BacAliment[], alimentsDejaChoisis: Aliment[], regime: any = "STANDARD"): BacAliment[] => {
    const bacsChoisis = alimentsDejaChoisis.map(a => a.bac as BacAliment);
    let compatibles = [...bDuGroupe];

    // Filtres de régimes
    if (regime === "SANS_PORC") compatibles = compatibles.filter(b => b !== BacAliment.PROT_PORC);
    if (regime === "SANS_VIANDE") {
      compatibles = compatibles.filter(b => b === BacAliment.PROT_P || b === BacAliment.PROT_VEG || !b.startsWith("PROT_"));
    }

    const section = getSectionByTemplate(template);

    if ("filtrerCompatibles" in section && typeof (section as any).filtrerCompatibles === "function") {
      return (section as any).filtrerCompatibles(indexLigne, compatibles, bacsChoisis);
    }

    return compatibles;
  },

  // grammage
  obtenirMargesAdaptatives: (aliment: Aliment, moment: MomentRepas, besoins: any, alimentsDejaChoisis: any[] = []) => {
    const bac = aliment.bac as BacAliment;

    if (moment === MomentRepas.PETIT_DEJEUNER) return SectionPetitDej.calculerMarges(bac, aliment, besoins);
    if (moment === MomentRepas.COLLATION) return SectionCollation.calculerMarges(bac, aliment, besoins);

    // style template
    const estSandwich = alimentsDejaChoisis.some(a => a.bac === BacAliment.PAIN && !alimentsDejaChoisis.some(x => ([BacAliment.RIZ, BacAliment.PATE] as BacAliment[]).includes(x.bac as BacAliment)));
    const estWrap = alimentsDejaChoisis.some(a => a.bac === BacAliment.WRAP);
    const estSalade = alimentsDejaChoisis.some(a => a.bac === BacAliment.LAITUE);

    if (estSandwich || bac === BacAliment.S_COLD) return SectionSandwich.calculerMarges(bac, aliment, besoins);
    if (estWrap) return SectionWrap.calculerMarges(bac, aliment, besoins);
    if (estSalade) return SectionSalade.calculerMarges(bac, aliment, besoins);

    if (moment === MomentRepas.DEJEUNER || moment === MomentRepas.DINER) return SectionRepas.calculerMarges(bac, aliment, besoins);

    return RuleHelpers.adapterGrammes(50, 150, besoins);
  },

  // sante
  verifAcces: (item: Aliment, moment: MomentRepas, regime: any = "STANDARD", besoins?: any): boolean => {
    const bacAliment = item.bac as BacAliment;

    // regime
    if (regime === "SANS_PORC" && bacAliment === BacAliment.PROT_PORC) return false;
    if (regime === "SANS_VIANDE" && bacAliment.startsWith("PROT_") && bacAliment !== BacAliment.PROT_P && bacAliment !== BacAliment.PROT_VEG) return false;

    // petit dej
    if (moment === MomentRepas.PETIT_DEJEUNER) {
      if (!item.estSnack) return false;
      if (!SectionPetitDej.validerSanteMatin(item, besoins)) return false;
    }

    // collation
    if (moment === MomentRepas.COLLATION) {
      if (!item.estSnack) return false;
      if (!SectionCollation.validerSantePause(item, besoins)) return false;
    }

    // repas
    if (moment === MomentRepas.DEJEUNER || moment === MomentRepas.DINER) {
      const estIngredientBrut =
        bacAliment === BacAliment.OLEAGINEUX ||
        bacAliment === BacAliment.HUILE ||
        bacAliment === BacAliment.VINAIGRETTE;

      if (!estIngredientBrut && !item.estPlat && !item.estSandwich) {
        return false;
      }

      if (!SectionRepas.validerSanteRepas(item, moment, besoins)) return false;
    }

    return true;
  }
};