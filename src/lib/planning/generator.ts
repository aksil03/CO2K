import { 
    BacAliment, MomentRepas, TemplateRepas, RegimeAlimentaire, 
    type Aliment, type PanierItem, type RepasGenere, type BilanNutritionnel, type JourneePlanning
} from "@/lib/types";
import { ReglesRepas } from "./rules";
import { NutritionSolver } from "./solver";
import { REPARTITION_MACROS, MODELES_REPAS, RATIOS_MOMENTS } from "../constants";

const shuffle = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

export const PlanningLogic = {

    piocherPanier: (aliments: Aliment[], moment: MomentRepas, template: TemplateRepas, regime: RegimeAlimentaire, besoins: any): PanierItem[] => {
        const modele = MODELES_REPAS[template];
        const panier: PanierItem[] = [];

        const ratioMacro = REPARTITION_MACROS[moment]!;
        const cibles = {
            glu: besoins.glucides * ratioMacro.glu,
            prot: besoins.proteines * ratioMacro.prot
        };

        modele.forEach((bacsDuGroupe, index) => {
            let options = aliments.filter(a => 
                bacsDuGroupe.includes(a.bac) && 
                ReglesRepas.verifAcces(a, moment, regime, besoins)
            );

            const estElementVital = bacsDuGroupe.some(b => 
                [BacAliment.RIZ, BacAliment.PATE, BacAliment.PROT_VOLAILLE, BacAliment.PAIN].includes(b as any)
            );

            if (options.length === 0 && estElementVital) {
                options = aliments.filter(a => bacsDuGroupe.includes(a.bac) && ReglesRepas.verifAcces(a, moment, regime));
            }

            if (options.length > 0) {
                const estSourceProt = bacsDuGroupe.some(b => String(b).startsWith("PROT_") || b === BacAliment.LAIT);

                if (estSourceProt && cibles.prot > 25) {
                    options.sort((a, b) => (Number(b.prot) || 0) - (Number(a.prot) || 0));
                } 
                else if (index === 0 && cibles.glu > 50) {
                    options.sort((a, b) => (Number(b.glu) || 0) - (Number(a.glu) || 0));
                }
                else if (bacsDuGroupe.some(b => [BacAliment.HUILE, BacAliment.OLEAGINEUX].includes(b as any))) {
          
                    options.sort((a, b) => (Number(b.lip) || 0) - (Number(a.lip) || 0));
                }

                const pool = options.slice(0, 3);
                panier.push({ aliment: shuffle(pool)[0], poids: 0 });
            }
        });
        return panier;
    },

   genererUnRepas: (dispos: Aliment[], moment: MomentRepas, regime: RegimeAlimentaire, besoins: any): RepasGenere => {
        let tentatives = 0;
        let meilleurEchec: RepasGenere | null = null;
        let scoreMeilleurEchec = -1;
        
        const ratioMacro = REPARTITION_MACROS[moment]!;
        const cibles = {
            prot: besoins.proteines * ratioMacro.prot,
            lip: besoins.lipides * ratioMacro.lip,
            glu: besoins.glucides * ratioMacro.glu,
        };

        while (tentatives < 8) {
            const template = (moment === MomentRepas.PETIT_DEJEUNER) ? TemplateRepas.PETIT_DEJ :
                             (moment === MomentRepas.COLLATION) ? TemplateRepas.COLLATION :
                             shuffle([TemplateRepas.HOT, TemplateRepas.SANDWICH, TemplateRepas.WRAP, TemplateRepas.SALADE])[0];

            const panierInitial = PlanningLogic.piocherPanier(dispos, moment, template, regime, besoins);
            const ratioMoment = RATIOS_MOMENTS[moment];

            const menuFinal = NutritionSolver.resoudreMenu(panierInitial, cibles, moment, {
                gras_sat: besoins.limites.gras_sat * ratioMoment,
                sucre: besoins.limites.sucre * ratioMoment,
                sel: 5 * ratioMoment,
            });

            const stats = {
                prot: NutritionSolver.getSum(menuFinal, 'prot'),
                lip: NutritionSolver.getSum(menuFinal, 'lip'),
                glu: NutritionSolver.getSum(menuFinal, 'glu'),
                sucre: NutritionSolver.getSum(menuFinal, 'sucre'),
                sel: NutritionSolver.getSum(menuFinal, 'sel'),     
                gras_sat: NutritionSolver.getSum(menuFinal, 'gras_sat'),
                co2: NutritionSolver.getSum(menuFinal, 'co2'),
            };

            const repas: RepasGenere = { 
                moment, 
                template,
                aliments: menuFinal, 
                stats, 
                cibles 
            };

            if (stats.prot >= cibles.prot * 0.9 && 
                stats.glu >= cibles.glu * 0.9 && stats.glu <= cibles.glu * 1.15 &&
                stats.lip >= cibles.lip * 0.9) {
                return repas;
            }

            const score = (stats.prot / cibles.prot) + (stats.lip / cibles.lip) + (stats.glu / cibles.glu);
            if (score > scoreMeilleurEchec) { 
                scoreMeilleurEchec = score; 
                meilleurEchec = repas; 
            }

            tentatives++;
        } 

        return meilleurEchec!; 
    },

    genererSemaine: (tousLesAliments: Aliment[], besoins: any, profil: any): JourneePlanning[] => {
        const journal: JourneePlanning[] = [];
        const regime = profil?.regime || RegimeAlimentaire.STANDARD;
        const idsUtilises = new Set<number>();
        let repasPrecedents: Record<string, RepasGenere> = {};

        for (let i = 0; i < 7; i++) {
            const journeeRepas: RepasGenere[] = [];
            const doitRenouveler = i % 2 === 0; 

            [MomentRepas.PETIT_DEJEUNER, MomentRepas.DEJEUNER, MomentRepas.COLLATION, MomentRepas.DINER].forEach(moment => {
                const estCuisinable = (moment === MomentRepas.DEJEUNER || moment === MomentRepas.DINER);
                let repas: RepasGenere;

                if (!doitRenouveler && estCuisinable && repasPrecedents[moment]) {
                    repas = repasPrecedents[moment];
                } else {
                    const dispos = tousLesAliments.filter(a => !idsUtilises.has(a.id));
                    repas = PlanningLogic.genererUnRepas(dispos.length < 50 ? tousLesAliments : dispos, moment, regime, besoins);
                    if (estCuisinable) repasPrecedents[moment] = repas;
                }

                journeeRepas.push(repas);
                if (doitRenouveler) repas.aliments.forEach(item => idsUtilises.add(item.aliment.id));
            });

            journal.push({ 
                        jour: i + 1, 
                        repas: journeeRepas, 
                        bilan: PlanningLogic.calculerBilan(journeeRepas, besoins) 
                    });
        }
        return journal;
    },

    calculerBilan: (repasDuJour: RepasGenere[], besoins: any): BilanNutritionnel => {
        const totals = repasDuJour.reduce((acc, r) => ({
            p: acc.p + r.stats.prot, 
            l: acc.l + r.stats.lip, 
            g: acc.g + r.stats.glu, 
            c: acc.c + r.stats.co2
        }), { p: 0, l: 0, g: 0, c: 0 });

        return {
            prot: { actuel: Math.round(totals.p), cible: besoins.proteines },
            lip: { actuel: Math.round(totals.l), cible: besoins.lipides },
            glu: { actuel: Math.round(totals.g), cible: besoins.glucides },
            co2Total: totals.c
        };
    },

    piochePetitDej: (aliments: Aliment[], regime: RegimeAlimentaire, besoins: any) => PlanningLogic.piocherPanier(aliments, MomentRepas.PETIT_DEJEUNER, TemplateRepas.PETIT_DEJ, regime, besoins),
    piocheCollation: (aliments: Aliment[], regime: RegimeAlimentaire, besoins: any) => PlanningLogic.piocherPanier(aliments, MomentRepas.COLLATION, TemplateRepas.COLLATION, regime, besoins),
    piocheRepasPrincipal: (aliments: Aliment[], moment: MomentRepas, regime: RegimeAlimentaire, besoins: any) => PlanningLogic.piocherPanier(aliments, moment, shuffle([TemplateRepas.HOT, TemplateRepas.SANDWICH, TemplateRepas.WRAP, TemplateRepas.SALADE])[0], regime, besoins)
};