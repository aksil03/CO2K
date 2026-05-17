import { BacAliment, TemplateRepas, MomentRepas, type Aliment, type RepasGenere } from "@/lib/types";
import { ReglesRepas } from "./rules";
import CalculateurImpact from "./impact";
import { RATIOS_MOMENTS } from "../constants-logic";

export const RepasSolver = {
    // grammage et formatage
    resoudreRepas: (
        template: TemplateRepas,
        moment: MomentRepas,
        alimentsChoisis: Aliment[],
        besoinsProfil: any,
        numJour?: number
    ): RepasGenere => {
        // si assiette vide
        if (!alimentsChoisis || alimentsChoisis.length === 0) {
            return {
                moment,
                template,
                numJour,
                aliments: [],
                stats: { prot: 0, glu: 0, lip: 0, sucre: 0, gras_sat: 0, sel: 0, co2: 0 },
                cibles: { prot: 0, lip: 0, glu: 0 }
            };
        }

        // recupere marge
        const portionsSquelette = alimentsChoisis.map(aliment => {
            const marges = ReglesRepas.obtenirMargesAdaptatives(aliment, moment, besoinsProfil, alimentsChoisis);
            return {
                aliment,
                min: marges.min,
                max: marges.max,
                actuel: Math.round((marges.min + marges.max) / 2)
            };
        });

        // ajustement
        if (besoinsProfil && besoinsProfil.calories) {
            const ratioMoment = RATIOS_MOMENTS[moment] || 0.25;
            const caloriesCibleRepas = besoinsProfil.calories * ratioMoment;

            // cibles specifiques aux macros pour ce repas
            const cibleProt = (besoinsProfil.proteines || (besoinsProfil.calories * 0.25) / 4) * ratioMoment;
            const cibleLip = (besoinsProfil.lipides || (besoinsProfil.calories * 0.30) / 9) * ratioMoment;
            const cibleGlu = (besoinsProfil.glucides || (besoinsProfil.calories * 0.45) / 4) * ratioMoment;

            let meilleurEcart = Infinity;
            let meilleuresQuantites = portionsSquelette.map(p => p.actuel);

            // convergence
            for (let etape = 0; etape < 150; etape++) {
                let caloriesTotales = 0;
                let protTotales = 0;
                let lipTotales = 0;
                let gluTotales = 0;
                let grasSatTotal = 0;
                let selTotal = 0;

                portionsSquelette.forEach(p => {
                    const al = p.aliment as any;
                    const ratio = p.actuel / 100;
                    const calPour100g = Number(al.calories) || Number(al.cal) || 0;

                    caloriesTotales += (calPour100g * p.actuel) / 100;
                    protTotales += (Number(al.proteines) || Number(al.prot) || 0) * ratio;
                    lipTotales += (Number(al.lipides) || Number(al.lip) || 0) * ratio;
                    gluTotales += (Number(al.glucides) || Number(al.glu) || 0) * ratio;
                    grasSatTotal += (Number(al.gras_sat) || 0) * ratio;
                    selTotal += (Number(al.sel) || 0) * ratio;
                });

                if (caloriesTotales === 0) {
                    break;
                }

                const ecartCalories = caloriesCibleRepas - caloriesTotales;
                const ecartProt = cibleProt - protTotales;
                const ecartLip = cibleLip - lipTotales;
                const ecartGlu = cibleGlu - gluTotales;

                const erreurProt = Math.abs(ecartProt) <= (cibleProt * 0.02) ? 0 : ecartProt;
                const erreurLip = Math.abs(ecartLip) <= (cibleLip * 0.02) ? 0 : ecartLip;
                const erreurGlu = Math.abs(ecartGlu) <= (cibleGlu * 0.02) ? 0 : ecartGlu;

                const limitesProfil = besoinsProfil?.limites || { sucre: 50, gras_sat: 20, sel: 5 };
                const limiteGrasSatRepas = limitesProfil.gras_sat * ratioMoment;
                const limiteSelRepas = limitesProfil.sel * ratioMoment;

                let penaliteSante = 0;
                if (grasSatTotal > limiteGrasSatRepas) {
                    penaliteSante += (grasSatTotal - limiteGrasSatRepas) * 100000;
                }
                if (selTotal > limiteSelRepas) {
                    penaliteSante += (selTotal - limiteSelRepas) * 100000;
                }
                if (lipTotales > cibleLip * 1.02) {
                    penaliteSante += (lipTotales - cibleLip) * 200000;
                }

                const scoreGlobal = Math.pow(erreurProt * 4, 2) +
                    Math.pow(erreurLip * 9, 2) +
                    Math.pow(erreurGlu * 4, 2) +
                    penaliteSante;

                if (erreurProt === 0 && erreurLip === 0 && erreurGlu === 0 && penaliteSante === 0) {
                    meilleuresQuantites = portionsSquelette.map(p => p.actuel);
                    break;
                }

                if (scoreGlobal < meilleurEcart) {
                    meilleurEcart = scoreGlobal;
                    meilleuresQuantites = portionsSquelette.map(p => p.actuel);
                }

                portionsSquelette.forEach(p => {
                    const al = p.aliment as any;
                    const pProt = Number(al.proteines) || Number(al.prot) || 0;
                    const pLip = Number(al.lipides) || Number(al.lip) || 0;
                    const pGlu = Number(al.glucides) || Number(al.glu) || 0;

                    let facteur = 1;

                    if (grasSatTotal > limiteGrasSatRepas && (Number(al.gras_sat) || 0) > 2) {
                        facteur = 0.95;
                    } else if (selTotal > limiteSelRepas && (Number(al.sel) || 0) > 0.5) {
                        facteur = 0.95;
                    } else if (besoinsProfil?.calories > 4000 && etape > 40 && ecartGlu > 10 && pGlu > 50) {
                        facteur = 1 + Math.min(0.08, ecartGlu / cibleGlu);
                    } else if (besoinsProfil?.calories > 4000 && etape > 40 && ecartLip > 5 && pLip > 50) {
                        facteur = 1 + Math.min(0.08, ecartLip / cibleLip);
                    } else if (ecartLip > 0 && pLip > pProt && pLip > pGlu) {
                        facteur = 1 + (ecartLip / cibleLip) * 0.5;
                    } else if (ecartLip < 0 && pLip > pProt && pLip > pGlu) {
                        facteur = 1 + (ecartLip / cibleLip) * 0.5;
                    } else if (ecartGlu > 0 && pGlu > pProt && pGlu > pLip) {
                        facteur = 1 + (ecartGlu / cibleGlu) * 0.5;
                    } else if (ecartGlu < 0 && pGlu > pProt && pGlu > pLip) {
                        facteur = 1 + (ecartGlu / cibleGlu) * 0.5;
                    } else if (ecartProt > 0 && pProt > pLip && pProt > pGlu) {
                        facteur = 1 + (ecartProt / cibleProt) * 0.5;
                    } else if (ecartProt < 0 && pProt > pLip && pProt > pGlu) {
                        facteur = 1 + (ecartProt / cibleProt) * 0.5;
                    } else {
                        facteur = ecartCalories > 0 ? 1.03 : 0.97;
                    }

                    if (etape > 100) {
                        facteur = Math.max(0.99, Math.min(1.01, facteur));
                    } else if (etape > 60) {
                        Math.max(0.97, Math.min(1.03, facteur));
                    } else {
                        facteur = Math.max(0.75, Math.min(1.25, facteur));
                    }

                    p.actuel = Math.max(p.min, Math.min(p.max, Math.round(p.actuel * facteur)));
                });
            }

            // meilleurs portions
            portionsSquelette.forEach((p, index) => {
                p.actuel = meilleuresQuantites[index];
            });
        }

        // format final
        const alimentsFormates = portionsSquelette.map(p => ({
            aliment: p.aliment,
            poids: p.actuel
        }));

        // calcul nutritionnel
        const statsNutritionnelles = (CalculateurImpact as any).calculerStatsPortions
            ? (CalculateurImpact as any).calculerStatsPortions(alimentsFormates)
            : { prot: 0, glu: 0, lip: 0, sucre: 0, gras_sat: 0, sel: 0, co2: 0 };

        // objet final
        return {
            moment,
            template,
            numJour,
            aliments: alimentsFormates,
            stats: statsNutritionnelles,
            cibles: {
                prot: besoinsProfil?.proteines || 0,
                lip: besoinsProfil?.lipides || 0,
                glu: besoinsProfil?.glucides || 0
            }
        };
    }
};

export default RepasSolver;