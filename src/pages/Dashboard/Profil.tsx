import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api'
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Bouton, Loading } from '@/components';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User, Target, Activity, Loader2 } from "lucide-react";
import { Genre, ObjectifPhysique, NiveauActivite, RegimeAlimentaire, formatEnum, ProfilFormSchema, type BesoinsNutritionnels } from '@/lib/types';
import type { UserWithRelations } from '@/lib/types';
import { CalculateurImpact } from '@/lib/planning/impact';


function Profil({ user: initialUser, onUpdate }: { user: UserWithRelations, onUpdate: () => void }) {
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const handleSave = async () => {
    if (!user) return;

    if (user.age < 15 || user.age > 100) {
      return toast.error("L'âge doit être compris entre 15 et 100 ans");
    }
    if (user.poids < 30 || user.poids > 120) {
      return toast.error("Le poids doit être compris entre 30 et 120 kg");
    }
    if (user.taille < 100 || user.taille > 220) {
      return toast.error("La taille doit être comprise entre 100 et 220 cm");
    }

    setIsSaving(true);
    try {
      const dataToSave = ProfilFormSchema.parse(user);
      await api.put("/api/utilisateur/update/" + user.email, dataToSave);
      toast.success("Profil mis à jour");
      onUpdate();
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const besoins = useMemo<BesoinsNutritionnels | null>(() => {
    if (!user) return null;
    return CalculateurImpact.calculerBesoinsNutritionnels(user);
  }, [user]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 max-w-7xl -mt-16 space-y-6 pb-10 dark:text-white">

      <div className="flex items-center gap-6 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm w-full">
        <div className="bg-emerald-700 p-4 rounded-2xl text-white shadow-md">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic dark:text-white">
            {user.prenom} <span className="text-emerald-700">{user.nom}</span>
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 font-bold text-lg">{user.email}</p>
        </div>
      </div>

      <Card className="border border-slate-100 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-3 border-b dark:border-zinc-800 flex items-center justify-between font-black text-slate-500 dark:text-zinc-400 text-sm">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-emerald-700" /> VOS BESOINS
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase">Objectifs Quotidiens</span>
        </div>

        <CardContent className="px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-8 md:border-r md:border-slate-100 md:pr-12">
              <div className="text-center md:text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 italic block mb-1">Apport énergétique quotidien</label>
                <div className="flex items-baseline gap-2">
                  <span data-testid="calories-display" className="text-6xl font-black italic text-slate-900 dark:text-white">
                    {besoins?.calories}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl text-emerald-700 font-black italic">Kcal</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase -mt-1">/ jour</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl flex-1 text-center border border-slate-100 dark:border-zinc-800">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{besoins?.proteines}g</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Protéines</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl flex-1 text-center border border-slate-100 dark:border-zinc-800">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{besoins?.lipides}g</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Lipides</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl flex-1 text-center border border-slate-100 dark:border-zinc-800">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{besoins?.glucides}g</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Glucides</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 italic block mb-2">Seuils Max recommandés par jour</label>

              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-sm font-bold text-slate-600">Sucre</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{besoins?.limites.sucre}g</span>
              </div>

              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-bold text-slate-600">Graisses Saturées</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{besoins?.limites.gras_sat}g</span>
              </div>

              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-bold text-slate-600">Sel</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{besoins?.limites.sel}g</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>


      <Card className="border border-slate-100 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-3 border-b dark:border-zinc-800 flex items-center justify-between font-black text-slate-500 dark:text-zinc-400 text-sm">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-emerald-700" /> MORPHOLOGIE
          </div>
        </div>

        <CardContent className="px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Poids (kg)</label>
              <Input
                type="number"
                min="30"
                max="120"
                className="..."
                value={user.poids}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 120) return;
                  setUser({ ...user, poids: val });
                }}
              />
              <p className="text-[9px] text-slate-400">Entre 30 et 120kg</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Taille (cm)</label>
              <Input
                type="number"
                min="100"
                max="220"
                className="..."
                value={user.taille}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 220) return;
                  setUser({ ...user, taille: val });
                }}
              />
              <p className="text-[9px] text-slate-400">Entre 100 et 220cm</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Âge</label>
              <Input
                type="number"
                min="15"
                max="100"
                className="..."
                value={user.age}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 100) return;
                  setUser({ ...user, age: val });
                }}
              />
              <p className="text-[9px] text-slate-400">Entre 15 et 100 ans</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Genre</label>
              <Select value={user.genre} onValueChange={(v) => setUser({ ...user, genre: v as Genre })}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full dark:bg-zinc-900 dark:border-zinc-800 dark:text-white">
                  <SelectValue>{user.genre && formatEnum(user.genre)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50 dark:bg-zinc-950 dark:border-zinc-800">
                  {Genre && Object.values(Genre).map((g) => (
                    <SelectItem key={g} value={g} className="text-sm py-3">
                      {formatEnum(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-3 border-b dark:border-zinc-800 flex items-center justify-between font-black text-slate-500 dark:text-zinc-400 text-sm">
          <div className="flex items-center gap-3">
            <Target size={20} className="text-emerald-700" /> COACHING & OBJECTIFS
          </div>
        </div>

        <CardContent className="px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Objectif Physique</label>
              <Select value={user.objectif} onValueChange={(v) => setUser({ ...user, objectif: v as ObjectifPhysique })}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full dark:bg-zinc-900 dark:border-zinc-800 dark:text-white">
                  <SelectValue>{user.objectif && formatEnum(user.objectif)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50 dark:bg-zinc-950 dark:border-zinc-800">
                  {ObjectifPhysique && Object.values(ObjectifPhysique).map((obj) => (
                    <SelectItem key={obj} value={obj} className="text-sm py-3">
                      {formatEnum(obj)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Niveau d'activité</label>
              <Select value={user.activite} onValueChange={(v) => setUser({ ...user, activite: v as NiveauActivite })}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full dark:bg-zinc-900 dark:border-zinc-800 dark:text-white">
                  <SelectValue>{user.activite && formatEnum(user.activite)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50 dark:bg-zinc-950 dark:border-zinc-800">
                  {NiveauActivite && Object.values(NiveauActivite).map((act) => (
                    <SelectItem key={act} value={act} className="text-sm py-3">
                      {formatEnum(act)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Régime Alimentaire</label>
              <Select value={user.regime} onValueChange={(v) => setUser({ ...user, regime: v as RegimeAlimentaire })}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full dark:bg-zinc-900 dark:border-zinc-800 dark:text-white">
                  <SelectValue>{user.regime && formatEnum(user.regime)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50 dark:bg-zinc-950 dark:border-zinc-800">
                  {RegimeAlimentaire && Object.values(RegimeAlimentaire).map((reg) => (
                    <SelectItem key={reg} value={reg} className="text-sm py-3">
                      {formatEnum(reg)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Bouton
        onClick={handleSave}
        disabled={isSaving}
        className="h-16 rounded-2xl text-xs"
      >
        {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
        Sauvegarder les modifications
      </Bouton>
    </div>
  );
}

export default Profil;