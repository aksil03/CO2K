import React, { useState, useMemo, useEffect, useRef } from 'react';
import api from '@/lib/api'
import { toast } from "sonner";
import { type Aliment, type UserWithRelations, MomentRepas, TemplateRepas, type JourneePlanning, BacAliment } from '@/lib/types';
import { cn } from "@/lib/utils";
import { CalculateurImpact } from '@/lib/planning/impact';
import { PlanningLogic } from '@/lib/planning/generator';
import { RepasSolver } from '@/lib/planning/solver';
import { ReglesRepas } from '@/lib/planning/rules';
import { MODELES_REPAS, RATIOS_MOMENTS, REPARTITION_MACROS } from '@/lib/constants-logic';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Rocket, Zap, Leaf, Plus, Save, Copy, ClipboardCheck, LayoutGrid, ClipboardList } from "lucide-react";
import { Loading, CarteRepas, Bouton, BilanNutritionnelCard } from '@/components';
import { CarteImpact } from '@/components/UICommuns';
import { MOMENTS_CONFIG } from '@/lib/constants';

const estRepasComplet = (template: TemplateRepas, alimentsChoisis: { aliment: Aliment }[]): boolean => {
  const structure = MODELES_REPAS[template];
  const selectedBacs = alimentsChoisis.map(a => a.aliment.bac as BacAliment);

  return structure.every((groupe) => {
    if (groupe.isOptional && groupe.isOptional(selectedBacs)) {
      return true;
    }
    return selectedBacs.some(bac => groupe.bacs.includes(bac));
  });
};


export default function Plannings({ user, tousLesAliments, onUpdate }: { user: UserWithRelations, tousLesAliments: Aliment[], onUpdate: () => void }) {
  const limiteAtteinte = (user?.plannings?.length || 0) >= 10;
  const [journal, setJournal] = useState<JourneePlanning[]>([]);
  const planningRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [jour, setJour] = useState(1);
  const [copy, setCopy] = useState<{ manuel: Partial<Record<MomentRepas, { aliment: Aliment, poids: number }[]>>, templates: Record<MomentRepas, TemplateRepas> } | null>(null);

  const [nomPlanning, setNomPlanning] = useState(`IA ${new Date().toLocaleString()}`);

  const [templates, setTemplates] = useState<Record<number, Record<MomentRepas, TemplateRepas>>>({
    1: { [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ, [MomentRepas.DEJEUNER]: TemplateRepas.HOT, [MomentRepas.COLLATION]: TemplateRepas.COLLATION, [MomentRepas.DINER]: TemplateRepas.HOT },
    2: { [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ, [MomentRepas.DEJEUNER]: TemplateRepas.HOT, [MomentRepas.COLLATION]: TemplateRepas.COLLATION, [MomentRepas.DINER]: TemplateRepas.HOT },
    3: { [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ, [MomentRepas.DEJEUNER]: TemplateRepas.HOT, [MomentRepas.COLLATION]: TemplateRepas.COLLATION, [MomentRepas.DINER]: TemplateRepas.HOT },
    4: { [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ, [MomentRepas.DEJEUNER]: TemplateRepas.HOT, [MomentRepas.COLLATION]: TemplateRepas.COLLATION, [MomentRepas.DINER]: TemplateRepas.HOT },
    5: { [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ, [MomentRepas.DEJEUNER]: TemplateRepas.HOT, [MomentRepas.COLLATION]: TemplateRepas.COLLATION, [MomentRepas.DINER]: TemplateRepas.HOT },
    6: { [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ, [MomentRepas.DEJEUNER]: TemplateRepas.HOT, [MomentRepas.COLLATION]: TemplateRepas.COLLATION, [MomentRepas.DINER]: TemplateRepas.HOT },
    7: { [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ, [MomentRepas.DEJEUNER]: TemplateRepas.HOT, [MomentRepas.COLLATION]: TemplateRepas.COLLATION, [MomentRepas.DINER]: TemplateRepas.HOT },
  });


  const [manuel, setManuel] = useState<Record<number, Partial<Record<MomentRepas, { aliment: Aliment, poids: number }[]>>>>({
    1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}
  });

  const besoins = useMemo(() => user ? CalculateurImpact.calculerBesoinsNutritionnels(user) : null, [user]);

  const stats = useMemo(() => {
    const repasDuJour = Object.values(manuel[jour]).map(aliments => ({
      portions: (aliments || []).map(a => ({ quantite: a.poids, aliment: a.aliment }))
    }));
    const { statsDuJour } = CalculateurImpact.calculerStatsJournee(repasDuJour);
    return statsDuJour;
  }, [manuel, jour]);

  const complet = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7].every(j => {
      const journee = manuel[j];
      return [MomentRepas.PETIT_DEJEUNER, MomentRepas.DEJEUNER, MomentRepas.COLLATION, MomentRepas.DINER].every(m => {
        const aliments = journee[m];
        if (!aliments || aliments.length === 0) return false;

        return estRepasComplet(templates[j][m], aliments);
      });
    });
  }, [manuel, templates]);


  const onAdd = (moment: MomentRepas, item: Aliment) => {
    const current = manuel[jour][moment] || [];
    const struct = MODELES_REPAS[templates[jour][moment]];



    let filteredAliments: Aliment[] = [];
    if (item.bac === BacAliment.PROT_VEG && current.some(i => i.aliment.bac === BacAliment.LAIT)) {
      filteredAliments = current
        .filter(i => i.aliment.bac !== BacAliment.PROT_VEG)
        .map(i => i.aliment);
    } else {
      const targetIdx = struct.findIndex(g => (g.bacs as BacAliment[]).includes(item.bac));

      filteredAliments = current.filter(i => {
        const groupOfItem = struct.findIndex(g => (g.bacs as BacAliment[]).includes(i.aliment.bac));
        return groupOfItem !== targetIdx;
      }).map(i => i.aliment);
    }
    const nouveauPlateau = [...filteredAliments, item];

    const repasCalcule = RepasSolver.resoudreRepas(templates[jour][moment], moment, nouveauPlateau, besoins);

    const resultatFormate = repasCalcule.aliments.map(a => ({ aliment: a.aliment, poids: a.poids }));

    setManuel(prev => ({
      ...prev,
      [jour]: { ...prev[jour], [moment]: resultatFormate }
    }));
  };

  const onGenerate = async () => {
    setLoading(true);
    try {
      const gen = PlanningLogic.genererSemaine(tousLesAliments, besoins!, user!);
      setJournal(gen);

      const repasPourBDD = gen.flatMap((journee, index) => {
        return journee.repas.map(repas => ({
          ...repas,
          numJour: index + 1
        }));
      });

      await api.post("/api/planning/sauvegarder", {
        auteurId: user?.id,
        nom: nomPlanning,
        repas: repasPourBDD,
        estPublic: false
      });
      setJournal(gen);
      toast.success("Planning généré");
      onUpdate();
      setTimeout(() => {
        planningRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100)
    } catch (err) { toast.error("Erreur"); } finally { setLoading(false); }
  };

  const onSaveManuel = async () => {
    setLoading(true);
    try {
      const nomFinal = `Manuel - ${new Date().toLocaleString()}`;
      const repasPourBDD = [];

      for (let j = 1; j <= 7; j++) {
        const journee = manuel[j];
        for (const m in journee) {
          const moment = m as MomentRepas;
          const aliments = journee[moment];
          if (aliments && aliments.length > 0) {
            const { statsDuJour } = CalculateurImpact.calculerStatsJournee([{
              portions: aliments.map(a => ({ quantite: a.poids, aliment: a.aliment }))
            }]);

            repasPourBDD.push({
              moment,
              template: templates[j][moment],
              numJour: j,
              aliments: aliments.map(al => ({ aliment: al.aliment, poids: al.poids })),
              stats: statsDuJour,
              cibles: { prot: 0, lip: 0, glu: 0 }
            });
          }
        }
      }
      await api.post("/api/planning/sauvegarder", {
        auteurId: user?.id,
        nom: nomFinal,
        repas: repasPourBDD,
        estPublic: false
      });
      toast.success("Planning manuel sauvegardé");
      onUpdate();
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };


  if (!besoins) return <Loading message="Chargement..." />;

  return (
    <div className="w-full px-4 sm:px-6 max-w-7xl mx-auto pb-20">

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-zinc-950 text-white rounded-xl shadow-lg"><Rocket size={24} /></div>
          <div className="text-left">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase italic leading-none tracking-tighter dark:text-white">
              GÉNÉRATEUR <span className="text-emerald-700">IA</span>
            </h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">Nutrition Intelligente</p>
            {limiteAtteinte && (
              <p className="text-[10px] font-black text-rose-500 uppercase italic mt-2">
                Limite de plannings atteinte, Supprimez-en pour en créer un nouveau
              </p>
            )}
          </div>
        </div>
        <Bouton id="btn-generer-ia" onClick={onGenerate} disabled={loading || limiteAtteinte} className="w-auto px-8 h-12 rounded-xl text-[10px] uppercase font-black italic">
          {loading ? (
            <Loader2 className="animate-spin mr-2" size={14} />
          ) : (
            <Plus className="mr-2" size={16} />
          )}
          {limiteAtteinte ? "Limite de 10 atteinte" : "Générer la semaine"}
        </Bouton>

      </header>

      <Separator className="opacity-50 my-16" />

      <section className="space-y-10">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-4 text-left">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg"><LayoutGrid size={20} /></div>
            <div>
              <h2 className="text-2xl font-black uppercase italic leading-none dark:text-white">Composition Manuelle</h2>
              <div className="h-1.5 w-12 bg-emerald-600 rounded-full mt-2" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Bouton
              id="btn-sauvegarder-planning"
              size="sm"
              onClick={onSaveManuel}
              disabled={loading || !complet || limiteAtteinte}
              className={cn("w-auto px-6 h-10 rounded-lg text-[9px] uppercase italic shadow-none", (loading || !complet || limiteAtteinte) && "bg-zinc-200 text-zinc-400 grayscale")}
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={12} /> : <Save size={14} className="mr-2" />}
              Sauvegarder
            </Bouton>
            <Button id="btn-copier-planning" variant="outline" size="sm" className="rounded-lg font-bold uppercase text-[9px] h-10 px-4 border-zinc-200" onClick={() => setCopy({ manuel: manuel[jour], templates: templates[jour] })}>
              <Copy size={12} className="mr-2" /> Copier
            </Button>
            {copy && (
              <Button id="btn-coller-planning" variant="outline" size="sm" className="rounded-lg font-bold uppercase text-[9px] h-10 px-4 bg-amber-50 border-amber-200 text-amber-700" onClick={() => {
                setManuel(p => ({ ...p, [jour]: JSON.parse(JSON.stringify(copy.manuel)) }));
                setTemplates(p => ({ ...p, [jour]: JSON.parse(JSON.stringify(copy.templates)) }));
              }}>
                <ClipboardCheck size={12} className="mr-2" /> Coller
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full sm:w-fit border dark:border-zinc-700 overflow-x-auto no-scrollbar">
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <button id={`btn-jour-${j}`} key={j} onClick={() => setJour(j)} className={cn("flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs font-black transition-all uppercase", jour === j ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-950 dark:text-white" : "text-zinc-400 hover:text-zinc-600")}>
              J0{j}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          <CarteImpact
            titre={`Impact J0${jour}`}
            calories={stats.cal > 0 ? Math.round(stats.cal) : Math.round(stats.prot * 4 + stats.glu * 4 + stats.lip * 9)}
            co2={stats.co2}
          />
          <BilanNutritionnelCard stats={stats} besoins={besoins} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(MOMENTS_CONFIG) as MomentRepas[]).map((m) => (
            <CarteRepas
              key={m}
              moment={m}
              templateActuel={templates[jour][m]}
              onChangeTemplate={(t) => {
                setTemplates(p => ({
                  ...p,
                  [jour]: {
                    ...p[jour],
                    [m]: t
                  }
                }));
                setManuel(p => ({
                  ...p,
                  [jour]: { ...p[jour], [m]: [] }
                }));
              }}
              estModifiable
              manuelleAliments={manuel[jour][m]}
              onAjouterAliment={(item) => onAdd(m, item)}
              onRetirerAliment={(moment, bac) => setManuel(p => ({ ...p, [jour]: { ...p[jour], [moment]: p[jour][moment]?.filter(i => i.aliment.bac !== bac) } }))}
              tousLesAliments={tousLesAliments}
              userRegime={user?.regime}
              besoins={besoins}
            />

          ))}
        </div>
      </section>
      {journal.length > 0 && (
        <section ref={planningRef} className="space-y-16 pt-24 border-t dark:border-zinc-800">
          <div className="flex items-center gap-4 text-left">
            <div className="p-2.5 bg-white border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-sm"><ClipboardList size={22} /></div>
            <div>
              <h2 className="text-2xl font-black uppercase italic dark:text-white leading-none">Planning</h2>
              <div className="h-1.5 w-12 bg-emerald-600 rounded-full mt-1.5" />
            </div>
          </div>
          {journal.map((j) => {
            const { statsDuJour: statsIA, caloriesFinales: caloriesIA } = CalculateurImpact.calculerStatsJournee(
              j.repas.map(r => ({
                portions: r.aliments.map(a => ({ quantite: a.poids, aliment: a.aliment }))
              }))
            );
            return (
              <div id={`journal-ia-jour-${j.jour}`} key={j.jour} className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-6xl font-black tracking-tighter opacity-10 italic">0{j.jour}</span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <Badge className="bg-emerald-500 text-white rounded-full uppercase text-[8px] px-4 font-black italic">Validé</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  <Card className="bg-zinc-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={80} className="text-emerald-400 fill-emerald-400" /></div>
                    <div className="relative z-10 space-y-4">
                      <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest opacity-70">Bilan Journée</span>
                      <div className="flex items-baseline gap-2">
                        <p id={`stats-ia-kcal-jour-${j.jour}`} className="text-4xl font-black italic tracking-tighter leading-none">
                          {caloriesIA}
                        </p>
                        <span className="text-[10px] opacity-40 uppercase">Kcal</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-500 font-bold text-[9px] uppercase">
                        <Leaf size={12} /> {statsIA.co2.toFixed(2)} KG CO2
                      </div>
                    </div>
                  </Card>

                  <BilanNutritionnelCard stats={statsIA} besoins={besoins} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {j.repas.map((r, ri) => (
                    <CarteRepas key={ri} moment={r.moment} repas={r} templateActuel={r.template} onChangeTemplate={() => { }} estModifiable={false} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}