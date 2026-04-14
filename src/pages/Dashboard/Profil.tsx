import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User, Target, Activity, Loader2 } from "lucide-react";
import { Genre, ObjectifPhysique, NiveauActivite, RegimeAlimentaire, formatEnum, ProfilFormSchema } from '@/lib/types';
import type { UserWithRelations } from '@/lib/types';
import { CalculateurImpact } from '@/lib/planning/impact';

function Profil({ email }: { email: string }) {
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:3000/api/utilisateur?email=" + email)
      .then((res) => setUser(res.data));
  }, [email]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dataToSave = ProfilFormSchema.parse(user);

      await axios.put("http://localhost:3000/api/utilisateur/update/" + email, dataToSave);
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const besoins = useMemo(() => {
    if (!user) return null;
    return CalculateurImpact.calculerBesoinsNutritionnels(user);
  }, [user]);

  if (!user) return <div className="p-20 text-center font-bold text-emerald-500">Chargement...</div>;

  return (
    <div className="container mx-auto px-4 max-w-7xl -mt-16 space-y-6 pb-10">

      <div className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm w-full">
        <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-md">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic">
            {user.prenom} <span className="text-emerald-500">{user.nom}</span>
          </h1>
          <p className="text-slate-400 font-bold text-lg">{user.email}</p>
        </div>
      </div>

      <Card className="border border-slate-100 shadow-lg bg-white rounded-3xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b flex items-center justify-between font-black text-slate-500 text-sm">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-emerald-500" /> VOS BESOINS
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase">Objectifs Quotidiens</span>
        </div>

        <CardContent className="px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-8 md:border-r md:border-slate-100 md:pr-12">
              <div className="text-center md:text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 italic block mb-1">Apport énergétique quotidien</label>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic text-slate-900">
                    {besoins?.calories}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl text-emerald-500 font-black italic">Kcal</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase -mt-1">/ jour</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex-1 text-center border border-slate-100">
                  <p className="text-2xl font-black text-slate-900">{besoins?.proteines}g</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Protéines</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex-1 text-center border border-slate-100">
                  <p className="text-2xl font-black text-slate-900">{besoins?.lipides}g</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Lipides</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex-1 text-center border border-slate-100">
                  <p className="text-2xl font-black text-slate-900">{besoins?.glucides}g</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Glucides</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 italic block mb-2">Seuils Max recommandés par jour</label>
              
              <div className="flex justify-between items-center bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-sm font-bold text-slate-600">Sucre</span>
                </div>
                <span className="font-black text-slate-900">{besoins?.limites.sucre}g</span>
              </div>

              <div className="flex justify-between items-center bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-bold text-slate-600">Graisses Saturées</span>
                </div>
                <span className="font-black text-slate-900">{besoins?.limites.gras_sat}g</span>
              </div>

              <div className="flex justify-between items-center bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-bold text-slate-600">Sel</span>
                </div>
                <span className="font-black text-slate-900">{besoins?.limites.sel}g</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    
      
      <Card className="border border-slate-100 shadow-lg bg-white rounded-3xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b flex items-center gap-3 font-black text-slate-500 text-sm">
          <Activity size={20} className="text-emerald-500" /> MORPHOLOGIE
        </div>
        
        <CardContent className="px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Poids (kg)</label>
              <Input 
                type="number" 
                className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full" 
                value={user.poids} 
                onChange={(e) => setUser({...user, poids: Number(e.target.value)})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Taille (cm)</label>
              <Input 
                type="number" 
                className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full" 
                value={user.taille} 
                onChange={(e) => setUser({...user, taille: Number(e.target.value)})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Âge</label>
              <Input 
                type="number" 
                className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full" 
                value={user.age} 
                onChange={(e) => setUser({...user, age: Number(e.target.value)})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Genre</label>
              <Select value={user.genre} onValueChange={(v) => setUser({...user, genre: v as Genre})}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full">
                  <SelectValue>{user.genre && formatEnum(user.genre)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50">
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

      <Card className="border border-slate-100 shadow-lg bg-white rounded-3xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b flex items-center gap-3 font-black text-slate-500 text-sm">
          <Target size={20} className="text-emerald-500" /> COACHING & OBJECTIFS
        </div>

        <CardContent className="px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic">Objectif Physique</label>
              <Select value={user.objectif} onValueChange={(v) => setUser({...user, objectif: v as ObjectifPhysique})}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full">
                  <SelectValue>{user.objectif && formatEnum(user.objectif)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50">
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
              <Select value={user.activite} onValueChange={(v) => setUser({...user, activite: v as NiveauActivite})}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full">
                  <SelectValue>{user.activite && formatEnum(user.activite)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50">
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
              <Select value={user.regime} onValueChange={(v) => setUser({...user, regime: v as RegimeAlimentaire})}>
                <SelectTrigger className="h-14 text-base font-medium border-slate-200 rounded-2xl w-full">
                  <SelectValue>{user.regime && formatEnum(user.regime)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl z-50">
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

      <Button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg transition-all shadow-md active:opacity-90"
      >
        {loading ? <Loader2 className="animate-spin mr-3 h-5 w-5" /> : <Save className="mr-3 h-5 w-5" />}
        Sauvegarder les modifications
      </Button>
    </div>
  );
}

export default Profil;