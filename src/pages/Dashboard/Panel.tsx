import React, { useState, useEffect } from 'react'
import { Flame, LayoutGrid, ClipboardList, ChevronLeft, Check, Utensils } from 'lucide-react'
import { 
  CardProgrammeMaster, 
  CardPlanningMaster, 
  ModalCreerProgramme,
  CardSemaineTimeline,
  Bouton,
  Loading
} from '../../components/componentsCommuns' 
import { 
  type PlanningComplet, 
  type UserWithRelations, 
  type ProgrammeComplet,
  type CreateProgrammeData,
  type Aliment,
  MomentRepas
} from '@/lib/types'

export default function Panel({ user }: { user: UserWithRelations, tousLesAliments: Aliment[] }) {
  const [programmes, setProgrammes] = useState<ProgrammeComplet[]>([]);
  const [plannings, setPlannings] = useState<PlanningComplet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProg, setSelectedProg] = useState<ProgrammeComplet | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanningComplet | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function chargerDonnees() {
      setLoading(true);
      try {
        const [resProg, resPlan] = await Promise.all([
          fetch(`http://localhost:3000/api/programmes/${userId}`),
          fetch(`http://localhost:3000/api/planning/liste?userId=${userId}`)
        ]);

        if (resProg.ok) setProgrammes(await resProg.json());
        if (resPlan.ok) setPlannings(await resPlan.json());
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    chargerDonnees();
  }, [userId]);

  const creerProgramme = async (data: CreateProgrammeData) => {
    const res = await fetch('http://localhost:3000/api/programmes/creer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, auteurId: userId })
    });

    if (res.ok) {
      const nouveau = await res.json();
      setProgrammes([nouveau, ...programmes]); 
    }
  };

  const supprimerProgramme = async (id: number) => {
    if (!confirm("Supprimer ce programme ?")) return;
    
    const res = await fetch(`http://localhost:3000/api/programmes/${id}`,
       { method: 'DELETE' });
    if (res.ok) {
      setProgrammes(programmes.filter(p => p.id !== id));
    }
  };

  const assignerPlanning = async (semaineId: number, planningId: number) => {
    const res = await fetch(`http://localhost:3000/api/programmes/semaine/${semaineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planningId })
    });

    if (res.ok) {
      const updated = await res.json();

      if (selectedProg) {
        const nouvellesSemaines = selectedProg.semaines.map(s => (s as any).id === semaineId ? updated : s);
        setSelectedProg({ ...selectedProg, semaines: nouvellesSemaines } as any);
      }

      setProgrammes(prev => prev.map(p => {
        if (p.id === selectedProg?.id) {
          return {
            ...p,
            semaines: p.semaines.map(s => (s as any).id === semaineId ? updated : s)
          };
        }
        return p;
      }));
    }
  };

  const modifierProgramme = async (id: number, data: any) => {
    const res = await fetch(`http://localhost:3000/api/programmes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const updated = await res.json();
      setProgrammes(prev => prev.map(p => p.id === id ? updated : p));
      
      
    }
  };

  const modifierPlanningBase = async (id: number, data: any) => {
    const res = await fetch(`http://localhost:3000/api/planning/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const updated = await res.json();
      setPlannings(prev => prev.map(p => p.id === id ? updated : p));
    }
  };

  const handleDeletePlanning = async (id: number) => {
  if (!confirm("Supprimer ce modèle de planning ?")) return;

  const res = await fetch(`http://localhost:3000/api/planning/${id}`, {
    method: 'DELETE'
  });
  if (res.ok) {
    setPlannings(prev => prev.filter(p => p.id !== id));
  } 
};

  if (loading) {
    return <Loading message="Initialisation du Panel..." />;
  }

  if (selectedPlan) {
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    
    return (
      <div className="w-full space-y-12 pb-20 text-left">
        <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]">
          <ChevronLeft size={14} /> Retour
        </button>

        <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-8 rounded-3xl border border-slate-100 dark:border-zinc-800">
          <div>
            <h1 className="text-5xl font-black uppercase italic">{selectedPlan.nom}</h1>
          </div>
          <Bouton onClick={() => setSelectedPlan(null)} className="w-auto px-10 h-14 text-[10px]">Fermer</Bouton>
        </div>

        {jours.map((jour, index) => {
          const repasDuJour = selectedPlan.repas.filter(r => {
             const date = new Date(r.dateConsom);
             const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
             return dayIndex === index;
          });

          return (
            <section key={jour} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-xl"><Utensils size={20} /></div>
                <div>
                  <h2 className="text-3xl font-black uppercase italic">{jour}</h2>
                  <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {repasDuJour
                  .sort((a, b) => {
                    const scores: Record<string, number> = {
                      [MomentRepas.PETIT_DEJEUNER]: 1,
                      [MomentRepas.DEJEUNER]: 2,
                      [MomentRepas.COLLATION]: 3,
                      [MomentRepas.DINER]: 4,
                    };
                    return (scores[a.type] || 0) - (scores[b.type] || 0);
                  })
                  .map((repas, idx) => (
                    <div key={idx} className="p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full">
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg mb-4 w-fit">
                        <p className="text-[10px] font-black text-emerald-700 uppercase italic">
                          {repas.type.replace('_', ' ')}
                        </p>
                      </div>

                      <div className="space-y-3 flex-1">
                        {repas.portions.map((port, pi) => (
                          <div key={pi} className="flex justify-between items-start gap-4 border-b border-slate-50 dark:border-zinc-900/50 pb-2 last:border-none">
                            <span className="text-slate-800 dark:text-zinc-200 font-bold italic text-smwrap-break-word flex-1">
                              {port.aliment.nom}
                            </span>
                            <span className="text-emerald-600 font-black italic text-xs shrink-0">
                              {Math.round(port.quantite)}g
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
        <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-8 rounded-3xl border border-slate-100 dark:border-zinc-800">
          <div>
            <h1 className="text-5xl font-black uppercase italic">{selectedProg.nom}</h1>
          </div>
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
        <ModalCreerProgramme onCreer={creerProgramme} />
      </div>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl"><LayoutGrid size={22} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic">Programmes</h2>
            <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programmes.map((p) => (
            <CardProgrammeMaster key={p.id} programme={p} onDelete={supprimerProgramme} onView={() => setSelectedProg(p)} onUpdate={modifierProgramme}/>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl"><ClipboardList size={22} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic">Plannings</h2>
            <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plannings.map((p) => (
            <CardPlanningMaster key={p.id} planning={p} onDelete={() => handleDeletePlanning(p.id)} onView={() => setSelectedPlan(p)} onUpdate={modifierPlanningBase} />
          ))}
        </div>
      </section>
    </div>
  );
}