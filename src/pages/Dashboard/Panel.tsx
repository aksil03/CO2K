import React, { useState, useEffect } from 'react'
import { Flame, LayoutGrid, ClipboardList, ChevronLeft, Check, Utensils, Leaf } from 'lucide-react'
import { 
  CardProgrammeMaster, 
  CardPlanningMaster, 
  ModalCreerProgramme,
  CardSemaineTimeline,
  Bouton,
  Loading,
  CarteRepas,
  BilanNutritionnelCard,
  alerteSuppression
} from '../../components/componentsCommuns' 
import { 
  type PlanningComplet, 
  type UserWithRelations, 
  type ProgrammeComplet,
  type CreateProgrammeData,
  type Aliment,
  MomentRepas,
  type SavePlanningData,
  TemplateRepas
} from '@/lib/types'
import axios from 'axios'
import { toast } from "sonner"
import { CalculateurImpact } from '@/lib/planning/impact'

export default function Panel({ user, tousLesAliments, onUpdate }: { user: UserWithRelations, tousLesAliments: Aliment[], onUpdate: () => void }) {
  const [programmes, setProgrammes] = useState<ProgrammeComplet[]>([]);
  const [plannings, setPlannings] = useState<PlanningComplet[]>([]);
  const [selectedProg, setSelectedProg] = useState<ProgrammeComplet | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanningComplet | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (user?.programmes) setProgrammes(user.programmes as unknown as ProgrammeComplet[]);
    if (user?.plannings) setPlannings(user.plannings as unknown as PlanningComplet[]);
  }, [user]);

  const creerProgramme = async (data: CreateProgrammeData) => {
    try {
      await axios.post('http://localhost:3000/api/programmes/creer', {
        ...data, 
        auteurId: userId 
      });
      toast.success("Programme créé");
      onUpdate();
    } catch (err) {
      toast.error("Erreur de création");
    }
  };

  const supprimerProgramme = async (id: number) => {
    alerteSuppression(async () => {
      try {
        await axios.delete(`http://localhost:3000/api/programmes/${id}`);
        setProgrammes(programmes.filter(p => p.id !== id));
        toast.success("Programme supprimé");
      } catch (err) {
        toast.error("Erreur lors de la suppression");
      }
    }, "Supprimer ce programme ?");
  };

  const assignerPlanning = async (semaineId: number, planningId: number) => {
    try {
      const res = await axios.patch<any>(`http://localhost:3000/api/programmes/semaine/${semaineId}`, { 
        planningId 
      });
      const updated = res.data;

      if (selectedProg) {
        const nouvellesSemaines = selectedProg.semaines.map(s => (s as any).id === semaineId ? updated : s);
        setSelectedProg({ ...selectedProg, semaines: nouvellesSemaines } as any);
      }
      onUpdate();
    } catch (err) {
      toast.error("Erreur d'assignation");
    }
  };

  const modifierProgramme = async (id: number, data: Partial<CreateProgrammeData>) => {
    try {
      const res = await axios.patch<ProgrammeComplet>(`http://localhost:3000/api/programmes/${id}`, data);
      setProgrammes(prev => prev.map(p => p.id === id ? res.data : p));
      toast.success("Programme mis à jour");
    } catch (err) {
      toast.error("Erreur de modification");
    }
  };

  const modifierPlanningBase = async (id: number, data: Partial<SavePlanningData>) => {
    try {
      const res = await axios.patch<PlanningComplet>(`http://localhost:3000/api/planning/${id}`, data);
      setPlannings(prev => prev.map(p => p.id === id ? res.data : p));
      toast.success("Planning mis à jour");
    } catch (err) {
      toast.error("Erreur de modification");
    }
  };

  const handleDeletePlanning = async (id: number) => {
    alerteSuppression(async () => {
      try {
        await axios.delete(`http://localhost:3000/api/planning/${id}`);
        setPlannings(prev => prev.filter(p => p.id !== id));
        toast.success("Planning supprimé");
        onUpdate();
      } catch (err) {
        toast.error("Erreur de suppression");
      }
    }, "Supprimer ce planning ? Il sera retiré de votre panel");
  };


  if (selectedPlan) {
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    
    const besoins = CalculateurImpact.calculerBesoinsNutritionnels(user);

    return (
      <div className="w-full space-y-12 pb-20 text-left">
        <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]">
          <ChevronLeft size={14} /> Retour
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 id="view-planning-title" className="text-5xl font-black uppercase italic leading-none">{selectedPlan.nom}</h1>
          <Bouton onClick={() => setSelectedPlan(null)} className="w-auto px-10 h-14 text-[10px]">Fermer</Bouton>
        </div>

        {jours.map((jour, index) => {
          const repasDuJour = selectedPlan.repas.filter(r => {
             const date = new Date(r.dateConsom);
             const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
             return dayIndex === index;
          });

          if (repasDuJour.length === 0) return null;

          const statsDuJour = repasDuJour.reduce((acc, r) => {
            r.portions.forEach(p => {
              const poids = p.quantite;
              acc.prot += ((p.aliment.prot || 0) * poids) / 100;
              acc.glu += ((p.aliment.glu || 0) * poids) / 100;
              acc.lip += ((p.aliment.lip || 0) * poids) / 100;
              acc.sucre += ((p.aliment.sucre || 0) * poids) / 100;
              acc.gras_sat += ((p.aliment.gras_sat || 0) * poids) / 100;
              acc.sel += ((p.aliment.sel || 0) * poids) / 100;
              acc.co2 += (p.aliment.co2 * poids) / 1000;
            });
            return acc;
          }, { prot: 0, glu: 0, lip: 0, sucre: 0, gras_sat: 0, sel: 0, co2: 0 });

          return (
            <section key={jour} className="space-y-6">
              <div className="flex items-center gap-4">
                <Utensils size={20} />
                <h2 className="text-3xl font-black uppercase italic">{jour}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-zinc-950 rounded-3xl text-white flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Flame size={40} className="text-emerald-400 fill-emerald-400" /></div>
                  
                  <div className="relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 opacity-70 mb-2 block">
                      Total Journée
                    </span>
                    <p id="stats-kcal-valeur" className="text-4xl font-black italic leading-none mb-2">
                      {Math.round(statsDuJour.prot * 4 + statsDuJour.glu * 4 + statsDuJour.lip * 9)} <span className="text-xs opacity-40 uppercase">Kcal</span>
                    </p>
                    
                    <div id="stats-co2-valeur" className="flex items-center gap-2 text-emerald-500 font-bold text-[9px] uppercase">
                      <Leaf size={12} /> {statsDuJour.co2.toFixed(2)} KG CO2
                    </div>
                  </div>
                </div>
                
                <BilanNutritionnelCard stats={statsDuJour} besoins={besoins} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {repasDuJour
                  .sort((a, b) => {
                    const scores: any = { [MomentRepas.PETIT_DEJEUNER]: 1, [MomentRepas.DEJEUNER]: 2, [MomentRepas.COLLATION]: 3, [MomentRepas.DINER]: 4 };
                    return (scores[a.type] || 0) - (scores[b.type] || 0);
                  })
                  .map((repas, idx) => {
                    const repasFormate = {
                      ...repas,
                      template: (repas as any).nomTemplate || TemplateRepas.HOT,
                      aliments: repas.portions.map((p) => ({
                        aliment: p.aliment,
                        poids: p.quantite
                      })),
                      stats: {
                        prot: repas.portions.reduce((acc: number, p) => acc + ((p.aliment.prot || 0) * p.quantite) / 100, 0),
                        glu: repas.portions.reduce((acc: number, p) => acc + ((p.aliment.glu || 0) * p.quantite) / 100, 0),
                        lip: repas.portions.reduce((acc: number, p) => acc + ((p.aliment.lip || 0) * p.quantite) / 100, 0),
                      }
                    };

                    return (
                      <CarteRepas
                        key={idx}
                        moment={repas.type as MomentRepas}
                        repas={repasFormate as any}
                        templateActuel={repasFormate.template}
                        onChangeTemplate={() => {}} 
                        estModifiable={false}      
                      />
                    );
                  })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  if (selectedProg) {
    return (
      <div className="w-full space-y-12 pb-20 text-left">
        <button onClick={() => setSelectedProg(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><ChevronLeft size={14} /> Retour</button>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-black uppercase italic leading-none">{selectedProg.nom}</h1>
          <Bouton onClick={() => setSelectedProg(null)} className="w-auto px-10 h-14 text-[10px]"><Check size={16} className="mr-2" /> Valider</Bouton>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {selectedProg.semaines.map((s, i) => (
            <CardSemaineTimeline key={(s as any).id} index={i} date={new Date(s.semaineDebut)} semaineData={s} planningsDisponibles={plannings} onAssigner={(id: number) => assignerPlanning((s as any).id, id)} onRetirer={() => assignerPlanning((s as any).id, 0)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-20 pb-20 text-left">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic">Panel <span className="text-emerald-700">{user?.prenom}</span></h1>
        </div>
        <ModalCreerProgramme onCreer={creerProgramme} auteurId={user?.id as number} />
      </div>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl"><LayoutGrid size={22} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic">Programmes</h2>
            <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
          </div>
        </div>

        {programmes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programmes.map((p) => (
              <CardProgrammeMaster id={`btn-delete-prog-${p.id}`} key={p.id} programme={p} onDelete={supprimerProgramme} onView={() => setSelectedProg(p)} onUpdate={modifierProgramme}/>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-[2rem] w-full">
            <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
              Aucun programme créé pour le moment
            </p>
          </div>
        )}
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl"><ClipboardList size={22} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic">Plannings</h2>
            <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
          </div>
        </div>

        {plannings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plannings.map((p) => (
              <CardPlanningMaster id={`btn-view-plan-${p.id}`} key={p.id} planning={p} onDelete={() => handleDeletePlanning(p.id)} onView={() => setSelectedPlan(p)} onUpdate={modifierPlanningBase} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-[2rem] w-full">
            <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
              Aucun planning enregistré
            </p>
          </div>
        )}
      </section>
      {programmes.length === 0 && plannings.length === 0 && (
        <div className="py-20 text-center bg-slate-50 dark:bg-zinc-900/30 rounded-[3rem] border border-slate-100 dark:border-zinc-800">
          <p className="text-slate-500 font-black uppercase italic text-xs mb-2">Votre panel est vide</p>
          <p className="text-slate-400 text-[10px] uppercase font-bold italic">Commencez par générer un planning ou créer un programme</p>
        </div>
      )}
    </div>
  );
}