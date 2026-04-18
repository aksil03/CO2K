import { useEffect } from 'react';
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion';
import { Button } from './ui/button'
import Co2KLogo from '../assets/Co2K.svg'
import { CHEMIN_ACCUEIL } from '../App'
import { Form } from "@/components/ui/form"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MODELES_REPAS } from "@/lib/constants";
import { type TemplateRepas, type Aliment } from "@/lib/types";
import { Utensils, Calendar, Trash2, ChevronRight, Pencil, Check, X, Plus, Info, RotateCcw, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { type PlanningComplet } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose  } from "@/components/ui/dialog";
import { type CreateProgrammeData } from "@/lib/types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";


export function Loading({ fullPage = true, message = "Chargement Master..." }: { fullPage?: boolean, message?: string }) {
  const containerClasses = fullPage 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-12 w-full";

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-16 h-16 rounded-full border-4 border-emerald-500/20"
        />
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-emerald-500"
        >
          <Loader2 size={40} strokeWidth={3} />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-[10px] font-black uppercase italic tracking-[0.3em] text-emerald-700 dark:text-emerald-500 animate-pulse"
      >
        {message}
      </motion.p>
    </div>
  );
}

export function Bouton({ children, onClick, type = "button", disabled = false, className }: any) {
  return (
    <Button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full h-12 bg-slate-800 text-slate-100 font-black italic uppercase text-[10px] tracking-[0.25em]",
        "rounded-xl transition-all duration-300 border-none shadow-none relative",
        "ring-1 ring-inset ring-white/5",
        "dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/5",
        "hover:bg-slate-700 dark:hover:bg-zinc-700",
        "active:scale-[0.98] active:bg-slate-900",
        "disabled:bg-slate-900/50 disabled:text-slate-600",
        
        className
      )}
    >
      <span className="flex items-center justify-center gap-2">
        {children}
      </span>
    </Button>
  )
}

export function LogoCo2K() {
  return (
    <Link to={CHEMIN_ACCUEIL} className="group flex items-center gap-2">
      <motion.img 
        whileHover={{ rotate: -10, scale: 1.1 }}
        src={Co2KLogo} 
        alt="Logo" 
        className="h-10"
        style={{ filter: 'invert(30%) sepia(75%) saturate(450%) hue-rotate(115deg)' }}
      />
      <span className="text-xl font-bold text-emerald-700">CO2K</span>
    </Link>
  )
}

export function NavBoutonGhost({ children, onClick }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className="text-slate-700 hover:text-emerald-700 font-bold">
      {children}
    </Button>
  )
}

export function CardRepasMaster({ title, icon, colorClass, children, action }: any) {
  return (
    <div className="h-full group">
      <Card className={cn(
        "relative h-full rounded-[2rem] transition-all duration-300 overflow-hidden text-left border",
        "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200",
        "dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 dark:shadow-none"
      )}>
        
        <div className={cn(
          "absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          colorClass?.replace('text', 'bg') || "bg-emerald-500"
        )} />

        <CardHeader className="p-7 pb-0 space-y-0 flex flex-row justify-between items-start">
          <div className="space-y-0.5">
            <CardDescription className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
              Nutrition
            </CardDescription>
            
            <div className="flex items-center gap-2.5">
              <div className={cn("shrink-0 transition-colors duration-300", colorClass)}>
                {icon}
              </div>
              <CardTitle className="text-xl font-black uppercase italic text-slate-900 dark:text-zinc-100">
                {title}
              </CardTitle>
            </div>
          </div>

          <div className="shrink-0">
            {action ? (
              <div className="opacity-40 group-hover:opacity-100 transition-all duration-300">
                {action}
              </div>
            ) : (
              <Utensils size={14} className="text-slate-200 dark:text-zinc-800" />
            )}
          </div>
        </CardHeader>

        <CardContent className={cn(
          "p-7 pt-6 transition-colors duration-300",
          "text-slate-600 dark:text-zinc-400",
          "[&_span]:dark:text-zinc-200 [&_span]:font-black [&_span]:italic [&_span]:text-sm"
        )}>
          <div className="space-y-3.5">
            {children}
          </div>
        </CardContent>

        <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </div>
  );
}

export function BadgePoids({ poids }: { poids: number }) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "rounded-xl font-black italic border-none px-3 py-1 shrink-0 transition-all duration-300",
        "bg-emerald-50 text-emerald-700", 
        "dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500/20"
      )}
    >
      {Math.round(poids)}g
    </Badge>
  );
}


export function AjusterRepasForm({ repas, tousLesAliments, onUpdatePortion }: { 
  repas: any, 
  tousLesAliments: Aliment[], 
  onUpdatePortion: (repasId: number, portionIndex: number, alimentId: string, quantite: number) => void 
}) {
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-4 overflow-y-auto pr-2"
    >
      {repas.portions.map((portion: any, index: number) => {
        const templateKey = repas.nomTemplate as TemplateRepas;
        const structureAttendue = MODELES_REPAS[templateKey] || [];
        const bacsAutorises = structureAttendue.find((groupe: any) => 
          groupe.includes(portion.aliment.bac)
        ) || (structureAttendue[index] || []);
        
        const optionsAliments = (tousLesAliments || []).filter(
          (aliment: any) => String(aliment.bac).toUpperCase() === String(portion.aliment.bac).toUpperCase()
        );

        return (
          <motion.div 
            key={index} 
            className="relative p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 transition-colors"
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-400">
                {index + 1}
              </div>
              <div className="w-full md:w-40">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</p>
                <Select 
                  value={portion.aliment.bac} 
                  onValueChange={(nouveauBac) => {
                    const premierAliment = tousLesAliments.find((a: any) => String(a.bac) === String(nouveauBac));
                    if (premierAliment) onUpdatePortion(repas.id, index, premierAliment.id.toString(), portion.quantite);
                  }}
                >
                  <SelectTrigger className="border-none bg-slate-50 dark:bg-zinc-800 font-bold text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bacsAutorises.map((bac: string) => (
                      <SelectItem key={bac} value={bac} className="text-xs font-bold uppercase">{bac}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 w-full">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Aliment</p>
                <Select 
                  value={portion.aliment.id.toString()} 
                  onValueChange={(nouvelAlimentId) => onUpdatePortion(repas.id, index, nouvelAlimentId, portion.quantite)}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 font-bold">
                    <SelectValue>{portion.aliment.nom}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {optionsAliments.map((opt: any) => (
                      <SelectItem key={opt.id} value={opt.id.toString()} className="font-bold">{opt.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-32">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1 md:text-right">Poids (g)</p>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="rounded-lg border-none bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-right pr-8"
                    value={Math.round(portion.quantite)} 
                    onChange={(e) => onUpdatePortion(repas.id, index, portion.aliment.id.toString(), Number(e.target.value))} 
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-emerald-500 opacity-50">G</span>
                </div>
              </div>

            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function FormTemplate({ title, form, children, footerText, linkText, linkTo }: any) {
  return (
    <div className="py-24 w-full flex justify-center px-4 relative">
      <motion.div 
        layout
        className="w-full max-w-md p-10 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl transition-colors duration-300"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">
            {title}
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6 text-left dark:[&_label]:text-white dark:[&_input]:text-white dark:[&_input]:bg-zinc-800">
              {children}
            </form>
          </Form>

          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {footerText}{" "}
              <Link to={linkTo} className="text-emerald-600 dark:text-white font-bold hover:text-emerald-700 transition-colors">
                {linkText}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


export function CardProgrammeMaster({ 
  programme, 
  onDelete, 
  onView,
  onUpdate 
}: { 
  programme: any, 
  onDelete: (id: number) => void, 
  onView: (programme: any) => void,
  onUpdate: (id: number, data: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(programme.nom);
  const [tempDesc, setTempDesc] = useState(programme.description || "");
  const [isPublic, setIsPublic] = useState(programme.estPublic);

  const totalSemaines = programme.semaines?.length || 0;
  const semainesRemplies = programme.semaines?.filter((s: any) => s.planningId !== null).length || 0;
  const estComplet = totalSemaines === semainesRemplies;

  useEffect(() => {
    setIsPublic(programme.estPublic);
    setTempName(programme.nom);
    setTempDesc(programme.description || "");
  }, [programme]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(programme.id, { nom: tempName, description: tempDesc });
    setIsEditing(false);
  };

  const togglePublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !isPublic;
    setIsPublic(newStatus);
    onUpdate(programme.id, { estPublic: newStatus });
  };

  return (
    <div className="h-full group cursor-pointer" onClick={() => !isEditing && onView(programme)}>
      <Card className={cn(
        "relative h-full rounded-[2rem] transition-all duration-300 overflow-hidden border flex flex-col items-start text-left",
        "bg-white border-slate-100 shadow-sm hover:border-slate-200",
        "dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 dark:shadow-none"
      )}>
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500" />

        <div className="absolute top-7 right-7 flex items-center gap-1 bg-slate-50/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-100 dark:border-zinc-800 z-20">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="p-1.5 rounded-lg text-emerald-600 hover:bg-white dark:hover:bg-zinc-800 shadow-sm transition-all">
                <Check size={14} strokeWidth={3} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="p-1.5 rounded-lg text-red-400 hover:bg-white dark:hover:bg-zinc-800 transition-all">
                <X size={14} strokeWidth={3} />
              </button>
            </>
          ) : (
            <>
              <button onClick={togglePublic} className={cn(
                "p-1.5 rounded-lg transition-all",
                isPublic ? "text-emerald-500 hover:bg-white" : "text-slate-300 hover:text-slate-500"
              )}>
                {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 transition-all">
                <Pencil size={14} />
              </button>
            </>
          )}
        </div>

        <CardHeader className="p-7 pb-0 w-full flex flex-col items-start text-left">
          <Badge className={cn(
            "border-none font-black italic text-[9px] uppercase px-3 py-1.5 mb-4",
            estComplet ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          )}>
            {semainesRemplies}/{totalSemaines} SEMAINES
          </Badge>

          <div className="w-full mt-4 text-left">
            {isEditing ? (
            <Input 
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="h-10 text-lg font-black uppercase italic border-emerald-500/50 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus-visible:ring-emerald-500/30 w-full text-left shadow-inner"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <CardTitle className="text-2xl font-black uppercase italic text-slate-900 dark:text-white leading-tight truncate pr-16 text-left w-full">
                {programme.nom}
              </CardTitle>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-7 pt-6 space-y-6 flex flex-col h-full w-full text-left items-start">
          <div className="w-full text-left">
            {isEditing ? (
            <textarea 
              value={tempDesc}
              onChange={(e) => setTempDesc(e.target.value)}
              className="w-full h-24 text-xs text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 italic outline-none focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
              onClick={(e) => e.stopPropagation()}
            />
            ) : (
              <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-relaxed text-left">
                {programme.description || "Aucune description"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 py-4 border-y border-slate-50 dark:border-zinc-900 w-full">
            <div className="flex -space-x-1.5">
              {programme.semaines?.map((s: any, i: number) => (
                <div key={i} className={cn(
                  "w-9 h-9 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center transition-colors shadow-sm",
                  s.planningId ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-300"
                )}>
                  {s.planningId ? <Check size={14} strokeWidth={4} /> : <Calendar size={14} />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 pt-4 mt-auto border-t border-slate-50 w-full">
            {isEditing ? (
            <Bouton onClick={handleSave} className="h-14">
              Valider les changements
            </Bouton>
            ) : (
              <>
              <Bouton 
                onClick={(e: any) => { e.stopPropagation(); onView(programme); }} 
                className="flex-1 h-14"
              >
                Ouvrir le Programme <ChevronRight size={14} className="ml-1" />
              </Bouton>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); onDelete(programme.id); }} 
                className="rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-300 h-14 w-14 shrink-0 transition-all border border-transparent hover:border-red-100"
              >
                <Trash2 size={20} />
              </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export function CardSemaineTimeline({ 
  date, semaineData, index, planningsDisponibles, onAssigner, onRetirer 
}: any) {
  const hasPlanning = semaineData?.planningId !== null;

  return (
    <div className="h-full group">
      <Card className={cn(
        "relative h-full min-h-70 rounded-[2rem] transition-all duration-300 overflow-hidden text-left border flex flex-col",
        hasPlanning 
          ? "bg-white border-slate-100 shadow-sm dark:bg-zinc-950 dark:border-zinc-800" 
          : "bg-slate-50 dark:bg-zinc-900/40 border-dashed border-slate-200 dark:border-zinc-800"
      )}>
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500" />

        <CardHeader className="p-6 pb-4 h-25 flex shrink-0">
          <div className="flex justify-between items-start w-full">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                Semaine {index + 1}
              </span>
              <CardTitle className="text-xl font-black uppercase italic text-slate-900 dark:text-zinc-100 leading-tight">
                {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '')}
              </CardTitle>
            </div>
            <div className={cn(
              "p-2 rounded-xl shrink-0 transition-colors", 
              hasPlanning 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                : "bg-slate-100 text-slate-300 dark:bg-zinc-800 dark:text-zinc-600"
            )}>
              <Calendar size={16} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-between">
          {hasPlanning ? (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800/50">
                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1">Planning</p>
                <p className="text-xs font-black italic uppercase text-slate-900 dark:text-zinc-100 truncate">
                  {semaineData.planning?.nom || "Modèle assigné"}
                </p>
              </div>
              
              <Bouton 
                onClick={onRetirer}
                className="h-10 text-[9px] mt-4"
              >
                <RotateCcw size={12} className="mr-2" /> Changer le planning
              </Bouton>
            </>
          ) : (
            <div className="mt-auto">
               <Select onValueChange={(val) => onAssigner(Number(val))}>
                <SelectTrigger className={cn(
                  "w-full h-14 rounded-2xl border-none shadow-sm font-black italic text-[10px] uppercase tracking-widest ring-1",
                  "bg-white dark:bg-zinc-900 ring-slate-100 dark:ring-zinc-800 text-slate-900 dark:text-zinc-100"
                )}>
                  <div className="flex items-center gap-2">
                    <Plus size={14} className="text-emerald-500" />
                    <SelectValue placeholder="Choisir" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl dark:bg-zinc-900 dark:border-zinc-800">
                  {planningsDisponibles.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()} className="font-bold italic uppercase text-[10px] focus:bg-emerald-500 focus:text-white">
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CardPlanningMaster({ 
  planning, 
  onDelete, 
  onView, 
  onUpdate 
}: {
  planning: PlanningComplet,
  onDelete: (id: number) => void,
  onView: (id: number) => void,
  onUpdate: (id: number, data: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(planning.nom);
  const [tempDesc, setTempDesc] = useState(planning.description || ""); 
  const [isPublic, setIsPublic] = useState(planning.estPublic);

  useEffect(() => {
    setIsPublic(planning.estPublic);
    setTempName(planning.nom);
    setTempDesc(planning.description || "");
  }, [planning]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(planning.id, { nom: tempName, description: tempDesc });
    setIsEditing(false);
  };

  const togglePublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !isPublic;
    setIsPublic(newStatus);
    onUpdate(planning.id, { estPublic: newStatus });
  };

  return (
    <div className="h-full group cursor-pointer" onClick={() => !isEditing && onView(planning.id)}>
      <Card className={cn(
        "relative h-full rounded-[2rem] transition-all duration-300 overflow-hidden border",
        "bg-white border-slate-100 shadow-sm hover:border-slate-200 text-left items-start flex flex-col", 
        "dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 dark:shadow-none"
      )}>
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500" />

        <CardHeader className="p-7 pb-0 w-full text-left items-start flex flex-col">
          <div className="flex justify-between items-center w-full">
            <CardDescription className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">
              Modèle de Planning
            </CardDescription>

            <div className="flex items-center gap-1 shrink-0 bg-slate-50/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-100 dark:border-zinc-800">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="p-1.5 rounded-lg text-emerald-600 hover:bg-white dark:hover:bg-zinc-800 shadow-sm transition-all">
                    <Check size={14} strokeWidth={3} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="p-1.5 rounded-lg text-red-400 hover:bg-white dark:hover:bg-zinc-800 transition-all">
                    <X size={14} strokeWidth={3} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={togglePublic} className={cn("p-1.5 rounded-lg transition-all", isPublic ? "text-emerald-500 hover:bg-white" : "text-slate-300 hover:text-slate-500")}>
                    {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 transition-all">
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="w-full mt-8 text-left">
            {isEditing ? (
              <Input 
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="h-10 text-lg font-black uppercase italic border-emerald-500/50 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus-visible:ring-emerald-500/30 w-full text-left shadow-inner"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <CardTitle className="text-2xl font-black uppercase italic text-slate-900 dark:text-zinc-100 truncate leading-tight text-left w-full">
                {planning.nom || "Sans titre"}
              </CardTitle>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-7 pt-6 space-y-6 flex flex-col h-full w-full text-left items-start">
          <div className="w-full text-left">
            {isEditing ? (
            <textarea 
              value={tempDesc}
              onChange={(e) => setTempDesc(e.target.value)}
              className="w-full h-24 text-xs text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 italic outline-none focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
              onClick={(e) => e.stopPropagation()}
            />
            ) : (
              <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-relaxed text-left">
                {planning.description || "Aucune description"}
              </p>
            )}
          </div>

          <div className="flex gap-2.5 pt-4 mt-auto border-t border-slate-50 w-full">
            {isEditing ? (
            <Bouton onClick={handleSave} className="h-14">
              Valider les changements
            </Bouton>
            ) : (
              <>
              
                <Bouton 
                  onClick={(e: any) => { e.stopPropagation(); onView(planning.id); }} 
                  className="flex-1 h-14"
                >
                  Ouvrir le modèle <ChevronRight size={14} className="ml-1" />
                </Bouton>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(planning.id); }} className="rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-200 h-14 w-14 shrink-0 transition-all">
                  <Trash2 size={20} />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export function ModalCreerProgramme({ onCreer }: { onCreer: (data: CreateProgrammeData) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ nom: "", description: "", nbSemaines: 1 });

  const handleSubmit = () => {
    const semainesInitiales = Array.from({ length: formData.nbSemaines }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + (i * 7));
      return { ordre: i + 1, semaineDebut: date, planningId: null };
    });

    onCreer({
      nom: formData.nom,
      description: formData.description || undefined,
      auteurId: 0, 
      semaines: semainesInitiales as any,
    });
    
    setOpen(false);
    setFormData({ nom: "", description: "" , nbSemaines: 1 });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Bouton className="w-auto px-8 h-14 rounded-2xl">
            <Plus className="mr-2" size={18} /> Créer un Programme
          </Bouton>
        } 
      />
      
      <DialogContent 
        showCloseButton={false} 
        className="overflow-hidden p-0 max-w-sm w-[95vw] rounded-[3.5rem] border-none bg-white dark:bg-zinc-950 shadow-2xl"
      >
        <div className="absolute top-8 right-8 z-50">
           <DialogClose render={
            <button className="p-2 rounded-full text-slate-300 hover:text-slate-900 transition-colors">
              <X size={22} />
            </button>
          }/>
        </div>

        <div className="w-full flex flex-col items-center justify-center p-10 pt-16 pb-12 space-y-8">
          
          <div className="w-full">
            <DialogHeader className="flex flex-col items-center justify-center">
              <DialogTitle className="text-4xl sm:text-5xl font-black uppercase italic text-slate-950 dark:text-white leading-[0.85] tracking-tighter text-center w-full">
                NOUVEAU<br />
                <span className="text-emerald-500 block w-full text-center">PROGRAMME</span>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="w-full max-w-70 flex flex-col items-center space-y-7">

            <div className="w-full space-y-2 flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-full">Nom du programme</p>
              <Input 
                placeholder="Ex: FORCE ATHLÉTIQUE" 
                className="h-10 text-lg font-black uppercase italic border-emerald-500/50 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus-visible:ring-emerald-500/30 w-full text-left shadow-inner"
                onClick={(e) => e.stopPropagation()}
                value={formData.nom}
                onChange={e => setFormData({...formData, nom: e.target.value})}
              />
            </div>
            <div className="w-full space-y-2 flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-full">Description</p>
              <textarea 
                className="w-full h-24 text-xs text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 italic outline-none focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
                placeholder="Objectifs du programme..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="w-full p-6 rounded-[2.5rem] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 flex flex-col items-center">
              <div className="flex flex-col items-center mb-4">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Durée totale</p>
                <div className="font-black italic flex items-baseline gap-1">
                  <span className="text-4xl text-emerald-700 dark:text-emerald-400 leading-none">{formData.nbSemaines}</span>
                  <span className="text-[10px] uppercase text-emerald-600/60 font-black">Semaines</span>
                </div>
              </div>
              <input 
                type="range" min="1" max="12" step="1" 
                className="w-full h-1.5 bg-emerald-200 dark:bg-emerald-900 rounded-full appearance-none cursor-pointer accent-emerald-500"
                value={formData.nbSemaines}
                onChange={e => setFormData({...formData, nbSemaines: parseInt(e.target.value)})}
              />
            </div>

            <Bouton 
              onClick={handleSubmit} 
              disabled={!formData.nom.trim()}
              className="w-full h-16 rounded-full"
            >
              VALIDER LE PROGRAMME
            </Bouton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}