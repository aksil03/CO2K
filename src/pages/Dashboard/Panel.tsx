import React, { useState, useEffect } from 'react'
import { Flame, LayoutGrid, ClipboardList, ChevronLeft, Check, Utensils, Leaf } from 'lucide-react'
import { CardProgrammeMaster, CardPlanningMaster, ModalCreerProgramme, CardSemaineTimeline, Bouton, Loading, CarteRepas, BilanNutritionnelCard, alerteSuppression, SectionHeader } from '@/components'
import { type PlanningComplet, type UserWithRelations, type ProgrammeComplet, type CreateProgrammeData, type Aliment, MomentRepas, type SavePlanningData, TemplateRepas, type RepasGenere } from '@/lib/types'
import api from '@/lib/api'
import { toast } from "sonner"
import { CalculateurImpact } from '@/lib/planning/impact'
import { JOURS_SEMAINE } from '@/lib/constants-logic'
import { PlanningTimeline } from '@/components/Nutrition'

export default function Panel({ user, tousLesAliments, onUpdate }: { user: UserWithRelations, tousLesAliments: Aliment[], onUpdate: () => void }) {
  const limiteProgAtteinte = (user?.programmes?.length || 0) >= 10;
  const [programmes, setProgrammes] = useState<ProgrammeComplet[]>([]);
  const [plannings, setPlannings] = useState<PlanningComplet[]>([]);
  const [selectedProg, setSelectedProg] = useState<ProgrammeComplet | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanningComplet | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (user?.programmes) setProgrammes(user.programmes as ProgrammeComplet[]);
    if (user?.plannings) setPlannings(user.plannings as PlanningComplet[]);
  }, [user]);

  const creerProgramme = async (data: CreateProgrammeData) => {
    try {
      await api.post('/api/programmes/creer', {
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
    const prog = programmes.find(p => p.id === id);
    const enLigne = prog?.posts && prog.posts.length > 0;
    const titre = enLigne
      ? "Suppression Critique : Ce programme est diffusé, le post associé dans la communauté sera supprimé"
      : "Supprimer ce programme ?";
    alerteSuppression(async () => {
      try {
        await api.delete(`/api/programmes/${id}`);
        setProgrammes(programmes.filter(p => p.id !== id));
        toast.success("Programme supprimé");
        onUpdate();
      } catch (err) {
        toast.error("Erreur lors de la suppression");
      }
    }, titre);
  };


  const assignerPlanning = async (semaineId: number, planningId: number) => {
    const executer = async () => {
      try {
        const res = await api.patch<ProgrammeComplet["semaines"][number]>(`/api/programmes/semaine/${semaineId}`, {
          planningId
        });
        const updated = res.data;

        if (selectedProg) {
          const nouvellesSemaines = selectedProg.semaines.map(s => s.id === semaineId ? updated : s);
          setSelectedProg({ ...selectedProg, semaines: nouvellesSemaines });
        }
        onUpdate();
      } catch (err) {
        toast.error("Erreur d'assignation");
      }
    };

    if (selectedProg && (selectedProg as any).posts?.length > 0) {
      alerteSuppression(executer, "Modifier ce programme ? Le post associé sera supprimé");
    } else {
      executer();
    }
  };

  const modifierProgramme = async (id: number, data: Partial<CreateProgrammeData>) => {
    const executer = async () => {
      try {
        const res = await api.patch<ProgrammeComplet>(`/api/programmes/${id}`, data);
        setProgrammes(prev => prev.map(p => p.id === id ? res.data : p));
        toast.success("Programme mis à jour");
      } catch (err) {
        toast.error("Erreur de modification");
      }
    };

    const prog = programmes.find(p => p.id === id);
    if (prog && (prog as any).posts?.length > 0) {
      alerteSuppression(executer, "Modifier les infos ? Le post associé sera supprimé");
    } else {
      executer();
    }
  };


  const modifierPlanningBase = async (id: number, data: Partial<SavePlanningData>) => {
    try {
      const res = await api.patch<PlanningComplet>(`/api/planning/${id}`, data);
      setPlannings(prev => prev.map(p => p.id === id ? res.data : p));
      toast.success("Planning mis à jour");
      onUpdate();
    } catch (err) {
      toast.error("Erreur de modification");
    }
  };

  const handleDeletePlanning = async (id: number) => {
    const planning = plannings.find(p => p.id === id);
    console.log("CONTENU DU PLANNING:", planning)
    const aPostDirect = planning?.posts && planning.posts.length > 0;
    const aProgPoste = planning?.calendriers?.some(c => c.programme?.posts && c.programme.posts.length > 0);
    const titre = (aPostDirect || aProgPoste)
      ? "Suppression Critique : Ce planning est diffusé, tous les posts associés dans la communauté seront supprimés"
      : "Supprimer ce planning ?";
    alerteSuppression(async () => {
      try {
        await api.delete(`/api/planning/${id}`);
        setPlannings(prev => prev.filter(p => p.id !== id));
        toast.success("Planning supprimé");
        onUpdate();
      } catch (err) {
        toast.error("Erreur de suppression");
      }
    }, titre);
  };


  if (selectedPlan) {
    const besoins = CalculateurImpact.calculerBesoinsNutritionnels(user);

    const repasTries = [...selectedPlan.repas].sort((a, b) =>
      new Date(a.dateConsom).getTime() - new Date(b.dateConsom).getTime()
    );

    return (
      <div className="w-full space-y-12 pb-20 text-left">
        <div className="flex justify-between items-center mb-8">
          <h1 id="view-planning-title" className="text-5xl font-black uppercase italic leading-none">{selectedPlan.nom}</h1>
          <Bouton onClick={() => setSelectedPlan(null)} className="w-auto px-10 h-14 text-[10px]">Fermer</Bouton>
        </div>
        <PlanningTimeline
          planning={selectedPlan}
          besoins={besoins}
        />
      </div>
    );
  }

  if (selectedProg) {
    return (
      <div className="w-full space-y-12 pb-20 text-left">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-black uppercase italic leading-none">{selectedProg.nom}</h1>
          <Bouton onClick={() => setSelectedProg(null)} className="w-auto px-10 h-14 text-[10px]"><Check size={16} className="mr-2" /> Valider</Bouton>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {selectedProg.semaines.map((s, i) => (
            <CardSemaineTimeline key={s.id} index={i} date={new Date(s.semaineDebut)} semaineData={s} planningsDisponibles={plannings} onAssigner={(id: number) => assignerPlanning(s.id, id)} onRetirer={() => assignerPlanning(s.id, 0)} />
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
        <ModalCreerProgramme onCreer={creerProgramme} auteurId={user?.id as number} disabled={limiteProgAtteinte} />
      </div>

      <section className="space-y-8">
        <SectionHeader titre="Programmes" icon={<LayoutGrid size={22} />} variant="dark" />
        {limiteProgAtteinte && (
          <p className="text-[10px] font-black text-rose-500 uppercase italic mt-2">
            Limite de programmes atteinte, supprimez-en un pour en créer un nouveau
          </p>
        )}
        {programmes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programmes.map((p) => (
              <CardProgrammeMaster id={`btn-delete-prog-${p.id}`} key={p.id} programme={p} onDelete={supprimerProgramme} onView={() => setSelectedProg(p)} onUpdate={modifierProgramme} />
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
        <SectionHeader titre="Plannings" icon={<ClipboardList size={22} />} variant="light" />
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