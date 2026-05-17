import { Genre, MomentRepas, TemplateRepas, type UserWithRelations, type Aliment, type RepasGenere, type BilanNutritionnel } from "../types";
import { COEFS_ACTIVITE, AJUSTEMENT_OBJECTIF } from "../constants-logic";
import { heureRepas } from "../constants-logic";

const getSum = (p: { aliment: Aliment; poids: number }[], macro: keyof Aliment): number => {
  return p.reduce((acc, curr) => acc + (Number(curr.aliment[macro]) || 0) * (Number(curr.poids) / 100), 0);
};

const calculerStatsPortions = (portions: { aliment: Aliment; poids: number }[]) => {
  return portions.reduce(
    (acc, curr) => {
      const ratio = (Number(curr.poids) || 0) / 100;
      const al = curr.aliment as any;

      if (!al) return acc;
      acc.cal += (Number(al.calories) || Number(al.cal) || 0) * ratio;

      acc.prot += (Number(al.proteines) || Number(al.prot) || 0) * ratio;
      acc.glu += (Number(al.glucides) || Number(al.glu) || 0) * ratio;
      acc.lip += (Number(al.lipides) || Number(al.lip) || 0) * ratio;

      acc.sucre += (Number(al.sucre) || 0) * ratio;
      acc.gras_sat += (Number(al.gras_sat) || Number(al.grasSat) || 0) * ratio;
      acc.sel += (Number(al.sel) || 0) * ratio;
      acc.co2 += (Number(al.co2) || 0) * ratio;

      return acc;
    },
    { cal: 0, prot: 0, glu: 0, lip: 0, sucre: 0, gras_sat: 0, sel: 0, co2: 0 }
  );
};

const calculerBesoinsNutritionnels = (user: UserWithRelations) => {
  if (!user) return null;

  const base = (10 * user.poids) + (6.25 * user.taille) - (5 * user.age);
  const mb = user.genre === Genre.HOMME ? base + 5 : base - 161;

  const coef = COEFS_ACTIVITE[user.activite] || 1.2;
  const maintenance = mb * coef;
  const calories = Math.round(maintenance + AJUSTEMENT_OBJECTIF[user.objectif]);

  return {
    calories,
    proteines: Math.round((calories * 0.25) / 4),
    lipides: Math.round((calories * 0.30) / 9),
    glucides: Math.round((calories * 0.45) / 4),

    limites: {
      sucre: Math.round((calories * 0.10) / 4),
      gras_sat: Math.round((calories * 0.10) / 9),
      sel: Number((5 * (calories / 2000)).toFixed(1))
    }
  };
};

const calculerStatsJournee = (repasDuJour: { portions: { quantite: number; aliment: Aliment }[] }[]) => {
  const statsDuJour = repasDuJour.reduce((acc, repas) => {
    const portions = repas.portions.map(p => ({ aliment: p.aliment, poids: (p as any).poids || p.quantite }));
    const statsRepas = calculerStatsPortions(portions);

    acc.cal += statsRepas.cal;
    acc.prot += statsRepas.prot;
    acc.glu += statsRepas.glu;
    acc.lip += statsRepas.lip;
    acc.sucre += statsRepas.sucre;
    acc.gras_sat += statsRepas.gras_sat;
    acc.sel += statsRepas.sel;
    acc.co2 += statsRepas.co2;

    return acc;
  }, { cal: 0, prot: 0, glu: 0, lip: 0, sucre: 0, gras_sat: 0, sel: 0, co2: 0 });

  const caloriesFinales = statsDuJour.cal > 0
    ? Math.round(statsDuJour.cal)
    : Math.round((statsDuJour.prot * 4) + (statsDuJour.glu * 4) + (statsDuJour.lip * 9));

  return { statsDuJour, caloriesFinales };
};

const calculerBilanJournee = (repasDuJour: RepasGenere[], besoins: any): BilanNutritionnel => {
  const totals = repasDuJour.reduce((acc, r) => {
    acc.p += r.stats.prot;
    acc.l += r.stats.lip;
    acc.g += r.stats.glu;
    acc.c += r.stats.co2;
    return acc;
  }, { p: 0, l: 0, g: 0, c: 0 });

  return {
    prot: { actuel: Math.round(totals.p), cible: besoins.proteines },
    lip: { actuel: Math.round(totals.l), cible: besoins.lipides },
    glu: { actuel: Math.round(totals.g), cible: besoins.glucides },
    co2Total: totals.c
  };
};

const formaterRepasBDD = (repasBDD: { type?: string; moment?: string; nomTemplate?: TemplateRepas | null; numJour: number; portions: { quantite: number; aliment: Aliment }[] }): RepasGenere => {
  const aliments = repasBDD.portions.map(p => ({ aliment: p.aliment, poids: p.quantite }));

  return {
    moment: (repasBDD.type || repasBDD.moment) as MomentRepas,
    template: repasBDD.nomTemplate || TemplateRepas.HOT,
    numJour: repasBDD.numJour,
    aliments,
    stats: calculerStatsPortions(aliments),
    cibles: { prot: 0, lip: 0, glu: 0 }
  };
};

const trierRepas = (a: { type?: string, moment?: string }, b: { type?: string, moment?: string }) => {
  const typeA = (a.type || a.moment) as MomentRepas;
  const typeB = (b.type || b.moment) as MomentRepas;

  return (heureRepas[typeA] || 0) - (heureRepas[typeB] || 0);
};

export const CalculateurImpact = {
  calculerBesoinsNutritionnels,
  getSum,
  calculerStatsPortions,
  calculerStatsJournee,
  calculerBilanJournee,
  formaterRepasBDD,
  trierRepas
};

export default CalculateurImpact;