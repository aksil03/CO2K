import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { 
  type Aliment, 
  type UserWithRelations, 
  MomentRepas, 
  TemplateRepas,
  type RepasGenere, 
  type JourneePlanning,
  type BesoinsNutritionnels, 
  BacAliment
} from '@/lib/types';
import { cn } from "@/lib/utils";
import { CalculateurImpact } from '@/lib/planning/impact';
import { PlanningLogic } from '@/lib/planning/generator';
import { NutritionSolver } from '@/lib/planning/solver';
import { MODELES_REPAS, RATIOS_MOMENTS, REPARTITION_MACROS } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, Rocket, Zap, Leaf, Plus, Save, Copy, ClipboardCheck, LayoutGrid, ClipboardList } from "lucide-react";
import { Loading, CarteRepas, MOMENTS_CONFIG, Bouton } from '@/components/componentsCommuns';
import { ReglesRepas } from '@/lib/planning/rules';

export default function Plannings({ user, tousLesAliments, onUpdate }: { user: UserWithRelations, tousLesAliments: Aliment[], onUpdate: () => void }) {
  const [journal, setJournal] = useState<JourneePlanning[]>([]);
  const [loading, setLoading] = useState(false);
  const [jour, setJour] = useState(1);
  const [copy, setCopy] = useState<Partial<Record<MomentRepas, { aliment: Aliment, poids: number }[]>> | null>(null);
  
  const [templates, setTemplates] = useState<Record<MomentRepas, TemplateRepas>>({
    [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ,
    [MomentRepas.DEJEUNER]: TemplateRepas.HOT,
    [MomentRepas.COLLATION]: TemplateRepas.COLLATION,
    [MomentRepas.DINER]: TemplateRepas.HOT,
  });

  const [manuel, setManuel] = useState<Record<number, Partial<Record<MomentRepas, { aliment: Aliment, poids: number }[]>>>>({
    1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}
  });

  const besoins = useMemo(() => user ? CalculateurImpact.calculerBesoinsNutritionnels(user) : null, [user]);

  const complet = useMemo(() => {
    return Object.values(manuel).every(d => 
      [MomentRepas.PETIT_DEJEUNER, MomentRepas.DEJEUNER, MomentRepas.COLLATION, MomentRepas.DINER].every(m => d[m] && d[m]!.length > 0)
    );
  }, [manuel]);

  const stats = useMemo(() => {
    const res = { prot: 0, glu: 0, lip: 0, co2: 0 };
    Object.values(manuel[jour]).forEach(repas => {
      repas?.forEach(i => {
        res.prot += ((i.aliment.prot || 0) * i.poids) / 100;
        res.glu += ((i.aliment.glu || 0) * i.poids) / 100;
        res.lip += ((i.aliment.lip || 0) * i.poids) / 100;
        res.co2 += (i.aliment.co2 * i.poids) / 1000;
      });
    });
    return res;
  }, [manuel, jour]);

  const onAdd = (moment: MomentRepas, item: Aliment) => {
    const current = manuel[jour][moment] || [];
    const struct = MODELES_REPAS[templates[moment]];

    const targetIdx = struct.findIndex(g => g.bacs.includes(item.bac as any));
    
    const filtered = current.filter(i => {
      const groupOfItem = struct.findIndex(g => g.bacs.includes(i.aliment.bac as any));
      return groupOfItem !== targetIdx;
    });

    const targets = { 
      prot: besoins!.proteines * REPARTITION_MACROS[moment]!.prot, 
      lip: besoins!.lipides * REPARTITION_MACROS[moment]!.lip, 
      glu: besoins!.glucides * REPARTITION_MACROS[moment]!.glu 
    };
    
    const limits = { 
      gras_sat: besoins!.limites.gras_sat * RATIOS_MOMENTS[moment], 
      sucre: besoins!.limites.sucre * RATIOS_MOMENTS[moment], 
      sel: 5 * RATIOS_MOMENTS[moment] 
    };

    const res = NutritionSolver.resoudreMenu([...filtered, { aliment: item, poids: 100 }], targets, moment, limits);
    setManuel(prev => ({ ...prev, [jour]: { ...prev[jour], [moment]: res } }));
  };

  const onGenerate = async () => {
    setLoading(true);
    try {
      const gen = PlanningLogic.genererSemaine(tousLesAliments, besoins!, user);
      await axios.post("http://localhost:3000/api/planning/sauvegarder", { auteurId: user?.id, nom: `IA ${new Date().toLocaleDateString()}`, journal: gen, estPublic: false });
      setJournal(gen);
      toast.success("Planning généré");
      onUpdate();
    } catch (err) { toast.error("Erreur"); } finally { setLoading(false); }
  };

  if (!besoins) return <Loading message="Chargement..." />;

  return (
    <div className="w-full px-6 max-w-7xl mx-auto pb-20">
      
      <header className="flex justify-between items-center gap-6 pt-4 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-zinc-950 text-white rounded-xl shadow-lg"><Rocket size={24} /></div>
          <div className="text-left">
            <h1 className="text-6xl font-black uppercase italic leading-none tracking-tighter dark:text-white">GÉNÉRATEUR <span className="text-emerald-700">IA</span></h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">Nutrition Intelligente</p>
          </div>
        </div>
        <Bouton onClick={onGenerate} disabled={loading} className="w-auto px-8 h-12 rounded-xl text-[10px] uppercase font-black italic">
          {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus className="mr-2" size={16} />}
          Générer la semaine
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
              size="sm" 
              onClick={() => {}} 
              disabled={loading || !complet} 
              className={cn("w-auto px-6 h-10 rounded-lg text-[9px] uppercase italic shadow-none", !complet && "bg-zinc-200 text-zinc-400 grayscale")}
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={12} /> : <Save size={14} className="mr-2" />}
              Sauvegarder
            </Bouton>
            <Button variant="outline" size="sm" className="rounded-lg font-bold uppercase text-[9px] h-10 px-4 border-zinc-200" onClick={() => setCopy(manuel[jour])}>
              <Copy size={12} className="mr-2" /> Copier
            </Button>
            {copy && (
              <Button variant="outline" size="sm" className="rounded-lg font-bold uppercase text-[9px] h-10 px-4 bg-amber-50 border-amber-200 text-amber-700" onClick={() => setManuel(p => ({ ...p, [jour]: JSON.parse(JSON.stringify(copy)) }))}>
                <ClipboardCheck size={12} className="mr-2" /> Coller
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit border dark:border-zinc-700">
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <button key={j} onClick={() => setJour(j)} className={cn("px-6 py-2 rounded-lg text-xs font-black transition-all uppercase", jour === j ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-950 dark:text-white" : "text-zinc-400 hover:text-zinc-600")}>
              J0{j}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          <Card className="bg-zinc-950 p-6 rounded-3xl border-none shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={80} className="text-emerald-400 fill-emerald-400" /></div>
            <div className="relative z-10 space-y-4">
              <span className="text-emerald-400 font-black text-[9px] tracking-widest uppercase opacity-70">Impact J0{jour}</span>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black italic tracking-tighter leading-none">{Math.round(stats.prot * 4 + stats.glu * 4 + stats.lip * 9)}</p>
                <span className="text-xs opacity-40 font-black uppercase">Kcal</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-[9px] uppercase"><Leaf size={14} /> {stats.co2.toFixed(2)} KG CO2</div>
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border flex items-center shadow-sm">
            <div className="grid grid-cols-3 gap-6 w-full">
              {[
                { l: "PROTÉINES", a: stats.prot, c: besoins.proteines },
                { l: "LIPIDES", a: stats.lip, c: besoins.lipides },
                { l: "GLUCIDES", a: stats.glu, c: besoins.glucides }
              ].map((m) => (
                <div key={m.l} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">{m.l}</span>
                    <span className="text-lg font-black italic dark:text-white">{Math.round(m.a)}g</span>
                  </div>
                  <Progress value={(m.a / m.c) * 100} className="h-1" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Cible: {Math.round(m.c)}g</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(MOMENTS_CONFIG) as MomentRepas[]).map((m) => (
            <CarteRepas key={m} moment={m} templateActuel={templates[m]} onChangeTemplate={(t) => setTemplates(p => ({ ...p, [m]: t }))} estModifiable manuelleAliments={manuel[jour][m]} onAjouterAliment={(item) => onAdd(m, item)} onRetirerAliment={(moment, bac) => setManuel(p => ({ ...p, [jour]: { ...p[jour], [moment]: p[jour][moment]?.filter(i => i.aliment.bac !== bac) } }))} tousLesAliments={tousLesAliments} userRegime={user?.regime} besoins={besoins} />
          ))}
        </div>
      </section>

      {journal.length > 0 && (
        <section className="space-y-16 pt-24 border-t dark:border-zinc-800">
          <div className="flex items-center gap-4 text-left">
            <div className="p-2.5 bg-white border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-sm"><ClipboardList size={22} /></div>
            <div>
              <h2 className="text-2xl font-black uppercase italic dark:text-white leading-none">Planning</h2>
              <div className="h-1.5 w-12 bg-emerald-600 rounded-full mt-1.5" />
            </div>
          </div>

          {journal.map((j) => (
            <div key={j.jour} className="space-y-8">
              <div className="flex items-center gap-4 px-2">
                <span className="text-6xl font-black tracking-tighter opacity-10 italic">0{j.jour}</span>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                <Badge className="bg-emerald-500 text-white rounded-full uppercase text-[8px] px-4 font-black italic">Validé</Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                <Card className="bg-zinc-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={80} className="text-emerald-400 fill-emerald-400" /></div>
                  <div className="relative z-10 space-y-4">
                    <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest opacity-70">Bilan Journée</span>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{Math.round(j.bilan.prot.actuel * 4 + j.bilan.glu.actuel * 4 + j.bilan.lip.actuel * 9)}</p>
                      <span className="text-[10px] opacity-40 uppercase">Kcal</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-[9px] uppercase"><Leaf size={12} /> {j.bilan.co2Total.toFixed(2)} KG CO2</div>
                  </div>
                </Card>

                <Card className="lg:col-span-2 p-8 rounded-3xl bg-white dark:bg-zinc-900 border shadow-sm flex items-center">
                  <div className="grid grid-cols-3 gap-6 w-full">
                    {[
                      { l: "PROTÉINES", a: j.bilan.prot.actuel, c: j.bilan.prot.cible },
                      { l: "LIPIDES", a: j.bilan.lip.actuel, c: j.bilan.lip.cible },
                      { l: "GLUCIDES", a: j.bilan.glu.actuel, c: j.bilan.glu.cible }
                    ].map((m) => (
                      <div key={m.l} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">{m.l}</span>
                          <span className="text-lg font-black italic dark:text-white">{Math.round(m.a)}g</span>
                        </div>
                        <Progress value={(m.a / m.c) * 100} className="h-1" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Cible: {Math.round(m.c)}g</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {j.repas.map((r, ri) => <CarteRepas key={ri} moment={r.moment} repas={r} templateActuel={r.template} onChangeTemplate={() => {}} estModifiable={false} />)}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}