import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { type Aliment, type UserWithRelations, MomentRepas, type RepasGenere, type JourneePlanning } from '@/lib/types';
import { CalculateurImpact } from '@/lib/planning/impact';
import { PlanningLogic } from '@/lib/planning/generator';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, Rocket, Sun, Utensils, Apple, Moon, Check, Zap, Leaf } from "lucide-react";

const MOMENTS_CONFIG = {
  [MomentRepas.PETIT_DEJEUNER]: { t: "MATIN", icon: <Sun size={14}/>, color: "text-amber-600", bg: "bg-amber-50" },
  [MomentRepas.DEJEUNER]: { t: "MIDI", icon: <Utensils size={14}/>, color: "text-emerald-600", bg: "bg-emerald-50" },
  [MomentRepas.COLLATION]: { t: "PAUSE", icon: <Apple size={14}/>, color: "text-rose-600", bg: "bg-rose-50" },
  [MomentRepas.DINER]: { t: "SOIR", icon: <Moon size={14}/>, color: "text-indigo-600", bg: "bg-indigo-50" }
};

export default function Plannings({ user: u, tousLesAliments: a }: { user: UserWithRelations, tousLesAliments: Aliment[] }) {
  const [journal, setJournal] = useState<JourneePlanning[]>([]);
  const [loading, setLoading] = useState(false);
  const besoins = useMemo(() => u ? CalculateurImpact.calculerBesoinsNutritionnels(u) : null, [u]);

  const handleGeneration = async () => {
    if (!besoins || !u) return;
    setLoading(true);

    try {
      const gen = PlanningLogic.genererSemaine(a, besoins, u);
      const dataToSave = {
        utilisateurId: u.id,
        nom: `Planning ${new Date().toLocaleDateString()}`,
        journal: gen
      };
      await axios.post("http://localhost:3000/api/planning/sauvegarder", dataToSave);
      setJournal(gen);
      toast.success("Planning sauvegardé");
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  if (!besoins) return null;

  return (
    <div className="w-full px-6 pb-20">
      <Card className="rounded-2xl shadow-xl">
        <CardContent className="flex justify-between p-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black">GÉNÉRER UN PLANNING</h1>
            <p className="text-slate-400 text-[9px]">CO2K</p>
          </div>
          <Button onClick={handleGeneration} className="bg-slate-900 h-12">
             {loading ? <Loader2 className="animate-spin" /> : <Rocket className="text-white" />}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-24 mt-12">
        {journal.map((j, i) => (
          <div key={i} className="space-y-8 animate-in">
            
            <div className="flex items-center gap-6">
              <span className="text-8xl font-black">0{j.jour}</span>
              <div className="h-1 flex-1 bg-slate-900" />
              <Badge className="bg-emerald-500 px-6">VALIDÉ</Badge>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <Card className="bg-slate-950 p-8 rounded-3xl">
                <div className="flex justify-between mb-4">
                  <span className="text-emerald-400 font-black text-[10px]">ÉNERGIE</span>
                  <Zap size={20} className="fill-amber-400 text-amber-400"/>
                </div>
                <p className="text-5xl font-black text-white">
                  {Math.round(j.bilan.prot.actuel*4 + j.bilan.glu.actuel*4 + j.bilan.lip.actuel*9)}
                  <span className="text-lg opacity-40 ml-2">KCAL</span>
                </p>
                <Separator className="bg-white/10 my-4" />
                <div className="flex items-center gap-2 text-emerald-500 text-xs">
                  <Leaf size={16} /> {j.bilan.co2Total.toFixed(2)} KG
                </div>
              </Card>

              <Card className="col-span-2 border shadow-lg p-8">
              <div className="grid grid-cols-3 gap-8">
                {[
                  { l: "PROT", a: j.bilan.prot.actuel, c: j.bilan.prot.cible, bg: "bg-emerald-500" },
                  { l: "LIP", a: j.bilan.lip.actuel, c: j.bilan.lip.cible, bg: "bg-amber-500" },
                  { l: "GLU", a: j.bilan.glu.actuel, c: j.bilan.glu.cible, bg: "bg-blue-600" }
                ].map((m: { l: string, a: number, c: number, bg: string }) => (
                  <div key={m.l} className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black">{m.l}</span>
                      <span className="text-xl font-black italic">{Math.round(m.a)}g</span>
                    </div>
                    <Progress value={(m.a / m.c) * 100} className={`h-2 ${m.bg}`} />
                  </div>
                ))}
              </div>
            </Card>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {j.repas.map((r: RepasGenere, ri: number) => {
                const s = MOMENTS_CONFIG[r.moment];
                return (
                  <Card key={ri} className="rounded-xl overflow-hidden shadow-md">
                    <CardHeader className={`${s.bg} p-3 border-b`}>
                      <CardTitle className={`${s.color} flex items-center gap-2 text-[10px]`}>
                        {s.icon} {s.t}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {r.aliments.map((al, ai) => (
                        <div key={ai} className="flex justify-between text-[10px]">
                          <span className="truncate pr-1 text-slate-600">{al.aliment.nom}</span>
                          <span className="font-black text-emerald-600">{Math.round(al.poids)}g</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}