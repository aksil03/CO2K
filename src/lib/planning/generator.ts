import { 
    BacAliment, MomentRepas, TemplateRepas, RegimeAlimentaire, 
    type Aliment, type PanierItem, type RepasGenere, type BilanNutritionnel, type JourneePlanning
} from "@/lib/types";
import { ReglesRepas } from "./rules";
import { NutritionSolver } from "./solver";
import { REPARTITION_MACROS, MODELES_REPAS, RATIOS_MOMENTS } from "../constants";

const shuffle = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const suivisVide = { 
    fromages: 0, 
    lait: new Set(), 
    oleagineux: new Set(), 
    sauces: new Set(), 
    viandesPoissons: new Set() 
};

export const PlanningLogic = {
    piocherPanier: (aliments: Aliment[], moment: MomentRepas, template: TemplateRepas, regime: RegimeAlimentaire, besoins: any, suivis: any): PanierItem[] => {
        const modele = MODELES_REPAS[template];
        const panier: PanierItem[] = [];
        const estBacProtStrict = (b: BacAliment) => String(b).startsWith("PROT_") && b !== BacAliment.PROT_VEG && b !== BacAliment.PROT_P;
        const estBacFruit = (b: BacAliment) => b === BacAliment.FRUIT_ENTIER || b === BacAliment.FRUIT_PULPE;
        const estBacSensible = (b: BacAliment) => 
            estBacProtStrict(b) || estBacFruit(b) || 
            ([BacAliment.HUILE, BacAliment.LAIT, BacAliment.OLEAGINEUX] as BacAliment[]).includes(b);

        modele.forEach((groupe, index) => {
            const { bacs, isOptional } = groupe;
            const alimentsActuels = panier.map(p => p.aliment);
            
            if (!ReglesRepas.estLigneAutorisee(index, template, alimentsActuels)) return;
            if (isOptional && isOptional(alimentsActuels.map(a => a.bac as BacAliment)) && Math.random() > 0.8) return; 

            const bacsCompatibles = ReglesRepas.getBacsCompatibles(index, template, bacs, alimentsActuels, regime);

            let options = aliments.filter(a => {
                if (!bacsCompatibles.includes(a.bac)) return false;
                if (!ReglesRepas.verifAcces(a, moment, regime, besoins)) return false;

                let cle = a.bac as string;
                if (estBacProtStrict(a.bac)) cle = "VERROU_PROT_ANIMALE";
                if (estBacFruit(a.bac)) cle = "VERROU_FRUITS";

                if (estBacSensible(a.bac)) {
                    const elus = suivis.verrouillage[cle] || new Set();
                    if (elus.size >= 2 && !elus.has(a.id)) return false;
                }
                return true;
            });

            if (options.length > 0) {
                const premier = options[0];
                let cle = premier.bac as string;
                if (estBacProtStrict(premier.bac)) cle = "VERROU_PROT_ANIMALE";
                if (estBacFruit(premier.bac)) cle = "VERROU_FRUITS";

                if (estBacSensible(premier.bac)) {
                    const elus = suivis.verrouillage[cle] || new Set();
                    const optionsDejaElues = options.filter(o => elus.has(o.id));
                    if (optionsDejaElues.length > 0) {
                        options = optionsDejaElues;
                    }
                }

                const bacChoisi = shuffle(Array.from(new Set(options.map(o => o.bac))))[0];
                const el = shuffle(options.filter(a => a.bac === bacChoisi))[0];

                if (el) {
                    panier.push({ aliment: el, poids: 0 });
                    if (estBacSensible(el.bac)) {
                        let key = el.bac as string;
                        if (estBacProtStrict(el.bac)) key = "VERROU_PROT_ANIMALE";
                        if (estBacFruit(el.bac)) key = "VERROU_FRUITS";
                        if (!suivis.verrouillage[key]) suivis.verrouillage[key] = new Set();
                        suivis.verrouillage[key].add(el.id);
                    }
                }
            }
        });
        return panier;
    },

    genererUnRepas: (dispos: Aliment[], moment: MomentRepas, regime: RegimeAlimentaire, besoins: any, suivis: any): RepasGenere => {
        let tentatives = 0;
        let meilleurEchec: RepasGenere | null = null;
        let scoreMeilleurEchec = -1;
        let verrousGagnants: Record<string, Set<number>> | null = null;

        const ratioMacro = REPARTITION_MACROS[moment]!;
        const cibles = {
            prot: besoins.proteines * ratioMacro.prot,
            lip: besoins.lipides * ratioMacro.lip,
            glu: besoins.glucides * ratioMacro.glu,
        };

        while (tentatives < 50) {
            const verrouillageCopie: Record<string, Set<number>> = {};
            for (const key in suivis.verrouillage) {
                verrouillageCopie[key] = new Set(suivis.verrouillage[key]);
            }

            const suivisTemporaires = {
                global: { ...suivis.global },
                verrouillage: verrouillageCopie
            };

            const template = (moment === MomentRepas.PETIT_DEJEUNER) ? TemplateRepas.PETIT_DEJ :
                             (moment === MomentRepas.COLLATION) ? TemplateRepas.COLLATION :
                             shuffle([TemplateRepas.HOT, TemplateRepas.SANDWICH, TemplateRepas.WRAP, TemplateRepas.SALADE])[0];

            const panierInitial = PlanningLogic.piocherPanier(dispos, moment, template, regime, besoins, suivisTemporaires);
            
            const ratioMoment = RATIOS_MOMENTS[moment];
            const menuFinal = NutritionSolver.resoudreMenu(
                panierInitial, 
                cibles, 
                moment, 
                {
                    gras_sat: besoins.limites.gras_sat * ratioMoment,
                    sucre: besoins.limites.sucre * ratioMoment,
                    sel: besoins.limites.sel * ratioMoment,
                },
                besoins 
            );

            const stats = {
                prot: NutritionSolver.getSum(menuFinal, 'prot'),
                lip: NutritionSolver.getSum(menuFinal, 'lip'),
                glu: NutritionSolver.getSum(menuFinal, 'glu'),
                sucre: NutritionSolver.getSum(menuFinal, 'sucre'),
                sel: NutritionSolver.getSum(menuFinal, 'sel'),     
                gras_sat: NutritionSolver.getSum(menuFinal, 'gras_sat'),
                co2: NutritionSolver.getSum(menuFinal, 'co2'),
            };

            const repas: RepasGenere = { moment, template, aliments: menuFinal, stats, cibles };

            if (stats.prot >= cibles.prot * 0.96 && 
                stats.glu >= cibles.glu * 0.96 && stats.glu <= cibles.glu * 1.05 &&
                stats.lip >= cibles.lip * 0.96) {
                
                suivis.verrouillage = suivisTemporaires.verrouillage;
                return repas;
            }

            const score = (stats.prot / cibles.prot) + (stats.lip / cibles.lip) + (stats.glu / cibles.glu);
            if (score > scoreMeilleurEchec) { 
                scoreMeilleurEchec = score; 
                meilleurEchec = repas;
                verrousGagnants = suivisTemporaires.verrouillage;
            }

            tentatives++;
        } 

        if (verrousGagnants) suivis.verrouillage = verrousGagnants;
        return meilleurEchec!; 
    },

    genererSemaine: (tousLesAliments: Aliment[], besoins: any, profil: any): JourneePlanning[] => {
        const journal: JourneePlanning[] = [];
        const regime = profil?.regime || RegimeAlimentaire.STANDARD;

        const suivisHebdo = {
            global: {} as Record<BacAliment, { utilisations: number, differents: Set<number> }>,
            verrouillage: {} as Record<string, Set<number>>
        };


        let indicesACopier: number[] = [];
        const joursPossibles = [1, 2, 3, 4, 5, 6];
        const j1 = joursPossibles[Math.floor(Math.random() * joursPossibles.length)];
        indicesACopier.push(j1);
        const restants = joursPossibles.filter(j => j !== j1 && j !== j1 - 1 && j !== j1 + 1);
        if (restants.length > 0) {
            indicesACopier.push(restants[Math.floor(Math.random() * restants.length)]);
        }

        for (let i = 0; i < 7; i++) {
            let journeeRepas: RepasGenere[] = [];

            if (indicesACopier.includes(i) && journal[i - 1]) {
                journeeRepas = JSON.parse(JSON.stringify(journal[i - 1].repas));
            } else {
                [MomentRepas.PETIT_DEJEUNER, MomentRepas.DEJEUNER, MomentRepas.COLLATION, MomentRepas.DINER].forEach(moment => {
                    const repas = PlanningLogic.genererUnRepas(tousLesAliments, moment, regime, besoins, suivisHebdo);

                    repas.aliments.forEach(item => {
                        const b = item.aliment.bac as BacAliment;
                        if (!suivisHebdo.global[b]) suivisHebdo.global[b] = { utilisations: 0, differents: new Set() };
                        suivisHebdo.global[b].utilisations += 1;
                        suivisHebdo.global[b].differents.add(item.aliment.id);
                    });
                    
                    journeeRepas.push(repas);
                });
            }

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

    piochePetitDej: (aliments: Aliment[], regime: RegimeAlimentaire, besoins: any) => 
        PlanningLogic.piocherPanier(aliments, MomentRepas.PETIT_DEJEUNER, TemplateRepas.PETIT_DEJ, regime, besoins, { global: {}, verrouillage: {} }),

    piocheCollation: (aliments: Aliment[], regime: RegimeAlimentaire, besoins: any) => 
        PlanningLogic.piocherPanier(aliments, MomentRepas.COLLATION, TemplateRepas.COLLATION, regime, besoins, { global: {}, verrouillage: {} }),

    piocheRepasPrincipal: (aliments: Aliment[], moment: MomentRepas, regime: RegimeAlimentaire, besoins: any) => 
        PlanningLogic.piocherPanier(aliments, moment, shuffle([TemplateRepas.HOT, TemplateRepas.SANDWICH, TemplateRepas.WRAP, TemplateRepas.SALADE])[0], regime, besoins, { global: {}, verrouillage: {} })
};