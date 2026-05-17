import { BacAliment, MomentRepas, TemplateRepas, RegimeAlimentaire, type Aliment, type PanierItem, type RepasGenere, type JourneePlanning } from "@/lib/types";
import { ReglesRepas } from "./rules";
import { RepasSolver } from "./solver";
import { MODELES_REPAS } from "../constants-logic";
import { CalculateurImpact } from "./impact";

// shuffle
const melanger = <T>(array: T[]): T[] => { return [...array].sort(() => Math.random() - 0.5); };

const Cuisine = {
    // aliment aleatoire
    preparerPlateau: (aliments: Aliment[], moment: MomentRepas, template: TemplateRepas, regime: RegimeAlimentaire, besoins: any): Aliment[] => {
        const modele = MODELES_REPAS[template];
        const plateau: Aliment[] = [];

        modele.forEach((groupe, index) => {
            if (!ReglesRepas.estLigneAutorisee(index, template, plateau, besoins)) return;
            if (groupe.isOptional && groupe.isOptional(plateau.map(a => a.bac as BacAliment))) {
                if (besoins && besoins.calories > 4000) {
                } else if (Math.random() > 0.5) {
                    return;
                }
            }
            const bacsCompatibles = ReglesRepas.getBacsCompatibles(index, template, groupe.bacs, plateau, regime);
            let options = aliments.filter(a => {
                if (!bacsCompatibles.includes(a.bac as BacAliment)) return false;
                if (!ReglesRepas.verifAcces(a, moment, regime, besoins)) return false;
                return true;
            });

            if (template === TemplateRepas.COLLATION && index === 0 && besoins && besoins.calories > 4000) {
                const optionsDenses = options.filter(a => a.bac === BacAliment.PAIN || a.bac === BacAliment.CERE);
                if (optionsDenses.length > 0) options = optionsDenses;
            }

            if (besoins && besoins.calories > 4000) {
                const optionsMaigres = options.filter(a => {
                    if (a.bac.startsWith("PROT_") || a.bac === "FROMAGE") {
                        const lip = Number((a as any).lipides) || Number((a as any).lip) || 0;
                        return lip <= 6;
                    }
                    return true;
                });
                if (optionsMaigres.length > 0) options = optionsMaigres;

                const FECULENTS_LÉGERS: BacAliment[] = [BacAliment.POTATO, BacAliment.GNOCCHI];
                const optionsGlucidesDenses = options.filter(a => {
                    if (FECULENTS_LÉGERS.includes(a.bac as BacAliment)) {
                        return false;
                    }
                    if (a.bac === BacAliment.RIZ || a.bac === BacAliment.PATE || a.bac === BacAliment.CERE || a.bac === BacAliment.SEMOU) {
                        const glu = Number((a as any).glucides) || Number((a as any).glu) || 0;
                        return glu >= 60;
                    }
                    return true;
                });
                if (optionsGlucidesDenses.length > 0) options = optionsGlucidesDenses;

                const optionsLipidesPropres = options.filter(a => {
                    if (a.bac === BacAliment.HUILE || a.bac === BacAliment.VINAIGRETTE || a.bac === BacAliment.OLEAGINEUX) {
                        const grasSat = Number((a as any).gras_sat) || 0;
                        const nomAliment = a.nom.toLowerCase();
                        if (nomAliment.includes("coco") || nomAliment.includes("palme") || nomAliment.includes("beurre")) {
                            return false;
                        }
                        return grasSat <= 15;
                    }
                    return true;
                });
                if (optionsLipidesPropres.length > 0) options = optionsLipidesPropres;
            }

            if (options.length > 0) {
                plateau.push(melanger(options)[0]);
            }
        });

        return plateau;
    },

    // envoie le plateau au solver 
    peserEtCalculer: (alimentsChoisis: Aliment[], moment: MomentRepas, template_repas: TemplateRepas, besoins: any, numJour?: number): RepasGenere => {
        return RepasSolver.resoudreRepas(template_repas, moment, alimentsChoisis, besoins, numJour);
    }
};

// petit dej
const GenerateurMatin = {
    creer: (aliments: Aliment[], regime: RegimeAlimentaire, besoins: any, numJour: number): RepasGenere => {
        const moment = MomentRepas.PETIT_DEJEUNER;
        const template = TemplateRepas.PETIT_DEJ;

        const plateau = Cuisine.preparerPlateau(aliments, moment, template, regime, besoins);
        return Cuisine.peserEtCalculer(plateau, moment, template, besoins, numJour);
    }
};

// collation
const GenerateurPause = {
    creer: (aliments: Aliment[], regime: RegimeAlimentaire, besoins: any, numJour: number): RepasGenere => {
        const moment = MomentRepas.COLLATION;
        const template = TemplateRepas.COLLATION;

        const plateau = Cuisine.preparerPlateau(aliments, moment, template, regime, besoins);
        return Cuisine.peserEtCalculer(plateau, moment, template, besoins, numJour);
    }
};

// repas
const GenerateurPlats = {
    creer: (aliments: Aliment[], moment: MomentRepas, regime: RegimeAlimentaire, besoins: any, numJour: number, templateForce?: TemplateRepas): RepasGenere => {
        let template = templateForce;

        if (!template) {
            const choixPossibles = [TemplateRepas.HOT, TemplateRepas.SANDWICH, TemplateRepas.WRAP, TemplateRepas.SALADE];
            template = melanger(choixPossibles)[0];
        }

        const plateau = Cuisine.preparerPlateau(aliments, moment, template, regime, besoins);
        return Cuisine.peserEtCalculer(plateau, moment, template, besoins, numJour);
    }
};

// planning
export const PlanningLogic = {

    genererSemaine: (tousLesAliments: Aliment[], besoins: any, profil: any): JourneePlanning[] => {
        const journal: JourneePlanning[] = [];
        const regime = profil?.regime || RegimeAlimentaire.STANDARD;
        const caloriesCibleJournee = besoins?.calories || 2000;

        // sur une semaine
        for (let i = 0; i < 5; i++) {
            const numJour = i + 1;
            let journeeRepas: RepasGenere[] = [];

            journeeRepas.push(GenerateurMatin.creer(tousLesAliments, regime, besoins, numJour));

            const choixMidi = [TemplateRepas.HOT, TemplateRepas.SANDWICH, TemplateRepas.WRAP, TemplateRepas.SALADE];
            const templateMidi = melanger(choixMidi)[0];
            journeeRepas.push(GenerateurPlats.creer(tousLesAliments, MomentRepas.DEJEUNER, regime, besoins, numJour, templateMidi));

            journeeRepas.push(GenerateurPause.creer(tousLesAliments, regime, besoins, numJour));

            const choixSoir = [TemplateRepas.HOT, TemplateRepas.SANDWICH, TemplateRepas.WRAP, TemplateRepas.SALADE];
            let templateSoir = melanger(choixSoir)[0];

            if (besoins && besoins.calories > 4000 && templateMidi !== TemplateRepas.HOT) {
                templateSoir = TemplateRepas.HOT;
            }

            journeeRepas.push(GenerateurPlats.creer(tousLesAliments, MomentRepas.DINER, regime, besoins, numJour, templateSoir));

            // sauvegarde 
            journal.push({
                jour: numJour,
                repas: journeeRepas,
                bilan: CalculateurImpact.calculerBilanJournee(journeeRepas, besoins)
            });
        }

        // plus proche calorique
        const deMeilleurAPire = [...journal].sort((a, b) => {
            const caloriesA = ((a.bilan?.prot?.actuel || 0) * 4) + ((a.bilan?.glu?.actuel || 0) * 4) + ((a.bilan?.lip?.actuel || 0) * 9);
            const caloriesB = ((b.bilan?.prot?.actuel || 0) * 4) + ((b.bilan?.glu?.actuel || 0) * 4) + ((b.bilan?.lip?.actuel || 0) * 9);

            const ecartA = Math.abs(caloriesA - caloriesCibleJournee);
            const ecartB = Math.abs(caloriesB - caloriesCibleJournee);
            return ecartA - ecartB;
        });

        const top1 = deMeilleurAPire[0];
        const top2 = deMeilleurAPire[1];

        // clonage
        const repasClone6 = top1.repas.map(repasOriginal => ({
            ...JSON.parse(JSON.stringify(repasOriginal)),
            numJour: 6
        }));
        journal.push({
            jour: 6,
            repas: repasClone6,
            bilan: CalculateurImpact.calculerBilanJournee(repasClone6, besoins)
        });

        // colone
        const repasClone7 = top2.repas.map(repasOriginal => ({
            ...JSON.parse(JSON.stringify(repasOriginal)),
            numJour: 7
        }));
        journal.push({
            jour: 7,
            repas: repasClone7,
            bilan: CalculateurImpact.calculerBilanJournee(repasClone7, besoins)
        });

        return journal;
    }
};