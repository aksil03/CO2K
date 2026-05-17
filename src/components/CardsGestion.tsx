import { useEffect } from 'react';
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { type SavePlanningData, type SemaineProgramme } from "@/lib/types";
import { Utensils, Calendar, Trash2, ChevronRight, Pencil, Check, X, Plus, RotateCcw } from "lucide-react";
import React, { useState } from "react";
import {
    type ProgrammeComplet,
    type PlanningComplet
} from "@/lib/types";
import { alerteSuppression, Bouton } from './UICommuns';

export function CardRepasMaster({ title, icon, colorClass, children, action }: { title: string, icon: React.ReactNode, colorClass?: string, children: React.ReactNode, action?: React.ReactNode }) {
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


export function CardProgrammeMaster({
    programme,
    onDelete,
    onView,
    onUpdate,
    id
}: {
    programme: ProgrammeComplet,
    onDelete: (id: number) => void,
    onView: (programme: ProgrammeComplet) => void,
    onUpdate: (id: number, data: { nom: string, description: string }) => void,
    id?: string
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(programme.nom);
    const [tempDesc, setTempDesc] = useState(programme.description || "");

    const totalSemaines = programme.semaines?.length || 0;
    const semainesRemplies = programme.semaines?.filter((s: SemaineProgramme) => s.planningId !== null).length || 0;
    const estComplet = totalSemaines === semainesRemplies;

    useEffect(() => {
        setTempName(programme.nom);
        setTempDesc(programme.description || "");
    }, [programme]);

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate(programme.id, { nom: tempName, description: tempDesc });
        setIsEditing(false);
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
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 transition-all"
                        >
                            <Pencil size={14} />
                        </button>
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
                            {(programme.semaines ?? []).sort((a, b) => a.ordre - b.ordre).map((s: SemaineProgramme) => (
                                <div key={s.id} className={cn(
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
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(programme); }}
                                    className="flex-1 h-14"
                                >
                                    Ouvrir le Programme <ChevronRight size={14} className="ml-1" />
                                </Bouton>

                                <Button
                                    id={id}
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


export function CardPlanningMaster({
    planning,
    onDelete,
    onView,
    onUpdate,
    id
}: {
    planning: PlanningComplet,
    onDelete: (id: number) => void,
    onView: (id: number) => void,
    onUpdate: (id: number, data: Partial<SavePlanningData>) => void,
    id?: string
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(planning.nom);
    const [tempDesc, setTempDesc] = useState(planning.description || "");

    useEffect(() => {
        setTempName(planning.nom);
        setTempDesc(planning.description || "");
    }, [planning]);

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate(planning.id, { nom: tempName, description: tempDesc });
        setIsEditing(false);
    };

    const handleSuppression = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(planning.id);
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
                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 transition-all">
                                    <Pencil size={14} />
                                </button>
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
                                    id={id}
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(planning.id); }}
                                    className="flex-1 h-14"
                                >
                                    Ouvrir le modèle <ChevronRight size={14} className="ml-1" />
                                </Bouton>
                                <Button variant="ghost" size="icon" onClick={handleSuppression} className="rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-200 h-14 w-14 shrink-0 transition-all">
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
}: {
    date: Date,
    semaineData: SemaineProgramme,
    index: number,
    planningsDisponibles: PlanningComplet[],
    onAssigner: (id: number) => void,
    onRetirer: () => void
}) {
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
                                    {planningsDisponibles.map((p: PlanningComplet) => (
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