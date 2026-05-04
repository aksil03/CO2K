import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { 
  type Aliment, 
  type UserWithRelations, 
  MomentRepas, 
  TemplateRepas,
  type RepasGenere, 
  type JourneePlanning,
  type SavePlanningData, 
  type BesoinsNutritionnels, 
  type PlanningComplet 
} from '@/lib/types';
import { CalculateurImpact } from '@/lib/planning/impact';
import { PlanningLogic } from '@/lib/planning/generator';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, Rocket, Zap, Leaf, Sun, Utensils, Apple, Moon } from "lucide-react";
import { Loading, CarteRepas } from '@/components/componentsCommuns';

const MOMENTS_CONFIG: Record<MomentRepas, { t: string; icon: React.ReactNode; color: string; bg: string }> = {
  [MomentRepas.PETIT_DEJEUNER]: { t: "MATIN", icon: <Sun size={14}/>, color: "text-amber-600", bg: "bg-amber-50" },
  [MomentRepas.DEJEUNER]: { t: "MIDI", icon: <Utensils size={14}/>, color: "text-emerald-600", bg: "bg-emerald-50" },
  [MomentRepas.COLLATION]: { t: "PAUSE", icon: <Apple size={14}/>, color: "text-rose-600", bg: "bg-rose-50" },
  [MomentRepas.DINER]: { t: "SOIR", icon: <Moon size={14}/>, color: "text-indigo-600", bg: "bg-indigo-50" }
};

export default function Plannings({ user: u, tousLesAliments: a, onUpdate }: { user: UserWithRelations, tousLesAliments: Aliment[], onUpdate: () => void }) {
  const [journal, setJournal] = useState<JourneePlanning[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Record<MomentRepas, TemplateRepas>>({
    [MomentRepas.PETIT_DEJEUNER]: TemplateRepas.PETIT_DEJ,
    [MomentRepas.DEJEUNER]: TemplateRepas.HOT,
    [MomentRepas.COLLATION]: TemplateRepas.COLLATION,
    [MomentRepas.DINER]: TemplateRepas.HOT,
  });

  const besoins = useMemo<BesoinsNutritionnels | null>(() => u ? CalculateurImpact.calculerBesoinsNutritionnels(u) : null, [u]);

  const handleGeneration = async () => {
    if (!besoins || !u) return;
    setLoading(true);
    try {
      const gen = PlanningLogic.genererSemaine(a, besoins, u);
      const dataToSave: SavePlanningData = {
        auteurId: u.id,
        nom: `Planning ${new Date().toLocaleDateString()}`,
        journal: gen,
        estPublic: false,
        description: "Planning généré automatiquement"
      };
      await axios.post<PlanningComplet>("http://localhost:3000/api/planning/sauvegarder", dataToSave);
      setJournal(gen);
      toast.success("Planning sauvegardé");
      onUpdate();
    } catch (err: any) {
      toast.error("Données invalides");
    } finally {
      setLoading(false);
    }
  };

  if (!besoins) return <Loading message="Calcul de vos besoins..." />;

  return (
    <div className="w-full px-6 pb-20">
      <Card className="rounded-2xl shadow-xl mb-12">
        <CardContent className="flex justify-between p-6 text-left">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter">GÉNÉRATEUR IA</h1>
            <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">CO2K Intelligence Artificielle</p>
          </div>
          <Button onClick={handleGeneration} className="bg-slate-900 h-12 rounded-xl">
             {loading ? <Loader2 className="animate-spin" /> : <Rocket className="text-white" />}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-24 mt-12 text-left">
        {journal.map((j, i) => (
          <div key={i} className="space-y-8 animate-in">
            <div className="flex items-center gap-6">
              <span className="text-8xl font-black tracking-tighter opacity-10 italic">0{j.jour}</span>
              <div className="h-1 flex-1 bg-slate-900" />
              <Badge className="bg-emerald-500 px-6 py-1.5 rounded-full font-black text-[10px]">VALIDÉ</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-950 p-8 rounded-[2rem] border-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={100} className="text-amber-400 fill-amber-400" /></div>
                <div className="relative z-10">
                  <div className="flex justify-between mb-4">
                    <span className="text-emerald-400 font-black text-[10px] tracking-widest uppercase">Énergie Totale</span>
                    <Zap size={20} className="fill-amber-400 text-amber-400"/>
                  </div>
                  <p className="text-6xl font-black text-white italic tracking-tighter">
                    {Math.round(j.bilan.prot.actuel*4 + j.bilan.glu.actuel*4 + j.bilan.lip.actuel*9)}
                    <span className="text-lg opacity-40 ml-2 font-black tracking-normal">KCAL</span>
                  </p>
                  <Separator className="bg-white/10 my-6" />
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-sm italic">
                    <Leaf size={18} /> {j.bilan.co2Total.toFixed(2)} KG CO2
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-2 border shadow-lg p-8 rounded-[2rem] bg-white dark:bg-zinc-900/50">
                <div className="grid grid-cols-3 gap-8">
                  {[
                    { l: "PROT", a: j.bilan.prot.actuel, c: j.bilan.prot.cible, bg: "bg-emerald-500" },
                    { l: "LIP", a: j.bilan.lip.actuel, c: j.bilan.lip.cible, bg: "bg-amber-500" },
                    { l: "GLU", a: j.bilan.glu.actuel, c: j.bilan.glu.cible, bg: "bg-blue-600" }
                  ].map((m) => (
                    <div key={m.l} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest">{m.l}</span>
                        <span className="text-2xl font-black italic">{Math.round(m.a)}g</span>
                      </div>
                      <div className="space-y-2">
                        <Progress value={(m.a / m.c) * 100} className="h-2.5" />
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase italic">
                          <span>{Math.round((m.a / m.c) * 100)}%</span>
                          <span>Cible: {Math.round(m.c)}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(Object.keys(MOMENTS_CONFIG) as MomentRepas[]).map((moment) => (
                <CarteRepas 
                  key={moment}
                  moment={moment}
                  repas={j.repas.find(r => r.moment === moment)}
                  templateActuel={templates[moment]}
                  onChangeTemplate={(t) => setTemplates(prev => ({ ...prev, [moment]: t }))}
                  estModifiable={false} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}