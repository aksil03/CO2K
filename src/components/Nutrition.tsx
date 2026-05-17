import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { JOURS_SEMAINE, LABELS_BACS, MODELES_REPAS } from "@/lib/constants-logic";
import { BacAliment, RegimeAlimentaire, TemplateRepas, type Aliment, type BesoinsNutritionnels } from "@/lib/types";
import { Utensils, Trash2, Check, Plus, Leaf, Search } from "lucide-react";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    type PlanningComplet,
    MomentRepas
} from "@/lib/types";
import { Flame, Sandwich, Disc, Salad } from "lucide-react";
import { type RepasGenere } from '@/lib/types';
import { Separator } from "@/components/ui/separator";
import { CalculateurImpact } from '@/lib/planning/impact';
import { MOMENTS_CONFIG } from "@/lib/constants";
import { CarteImpact } from './UICommuns';
import { ReglesRepas } from '@/lib/planning/rules';

export function AjusterRepasForm({ repas, tousLesAliments, onUpdatePortion }: {
    repas: { id: number, nomTemplate: TemplateRepas, portions: { quantite: number, aliment: Aliment }[] },
    tousLesAliments: Aliment[],
    onUpdatePortion: (repasId: number, portionIndex: number, alimentId: string, quantite: number) => void
}) {

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-4 overflow-y-auto pr-2"
        >
            {repas.portions.map((portion: { quantite: number, aliment: Aliment }, index: number) => {
                const templateKey = repas.nomTemplate as TemplateRepas;
                const structureAttendue = MODELES_REPAS[templateKey] || [];
                const groupeTrouve = structureAttendue.find((groupe: { bacs: string[] }) =>
                    groupe.bacs.includes(portion.aliment.bac)
                );
                const bacsAutorises = groupeTrouve ? groupeTrouve.bacs : [];

                const optionsAliments = (tousLesAliments || []).filter(
                    (aliment: Aliment) => String(aliment.bac).toUpperCase() === String(portion.aliment.bac).toUpperCase()
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
                                        const premierAliment = tousLesAliments.find((a: Aliment) => String(a.bac) === String(nouveauBac));
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
                                    onValueChange={(nouvelAlimentId) => { if (nouvelAlimentId) onUpdatePortion(repas.id, index, nouvelAlimentId, portion.quantite); }}
                                >
                                    <SelectTrigger className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 font-bold">
                                        <SelectValue>{portion.aliment.nom}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {optionsAliments.map((opt: Aliment) => (
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


export function CarteRepas({
    moment, repas, templateActuel, onChangeTemplate, estModifiable = false,
    manuelleAliments = [], onAjouterAliment, onRetirerAliment, tousLesAliments = [],
    userRegime = RegimeAlimentaire.STANDARD, besoins
}: {
    moment: MomentRepas, repas?: RepasGenere, templateActuel: TemplateRepas,
    onChangeTemplate: (t: TemplateRepas) => void, estModifiable?: boolean,
    manuelleAliments?: { aliment: Aliment, poids: number }[], onAjouterAliment?: (a: Aliment) => void,
    onRetirerAliment?: (moment: MomentRepas, bac: string) => void, tousLesAliments?: Aliment[],
    userRegime?: RegimeAlimentaire, besoins?: BesoinsNutritionnels | null
}) {
    const [recherche, setRecherche] = useState("");
    const [openModalIndex, setOpenModalIndex] = useState<number | null>(null);
    const config = MOMENTS_CONFIG[moment];
    const estRepasPrincipal = moment === MomentRepas.DEJEUNER || moment === MomentRepas.DINER;
    const structure = MODELES_REPAS[templateActuel] || [];
    const alimentsManuelsSelectionnes = manuelleAliments.map(m => m.aliment);

    return (
        <Card className="rounded-3xl overflow-hidden shadow-sm h-full flex flex-col border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader className={cn(config.bg, "p-4 border-b dark:bg-zinc-800/50 space-y-4")}>
                <div className="flex items-center justify-between">
                    <CardTitle className={cn(config.color, "flex items-center gap-2 text-xs font-black uppercase")}>
                        {config.icon}
                        {config.t}
                    </CardTitle>
                    {repas && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 italic">
                            {Math.round(repas.stats.prot * 4 + repas.stats.glu * 4 + repas.stats.lip * 9)} KCAL
                        </span>
                    )}
                </div>

                {estRepasPrincipal && (
                    <div className="flex gap-1 p-1 bg-white/60 dark:bg-zinc-950/40 rounded-xl border border-white/20">
                        {[
                            { k: TemplateRepas.HOT, i: <Flame size={14} /> },
                            { k: TemplateRepas.SANDWICH, i: <Sandwich size={14} /> },
                            { k: TemplateRepas.WRAP, i: <Disc size={14} /> },
                            { k: TemplateRepas.SALADE, i: <Salad size={14} /> }
                        ].map(t => (
                            <button
                                key={t.k}
                                type="button"
                                disabled={!estModifiable}
                                onClick={() => onChangeTemplate(t.k)}
                                className={cn(
                                    "flex-1 flex justify-center py-1.5 rounded-lg transition-all",
                                    templateActuel === t.k
                                        ? "bg-white dark:bg-zinc-800 shadow-sm text-slate-900 dark:text-emerald-500"
                                        : "text-slate-400 opacity-40 hover:opacity-100"
                                )}
                            >
                                {t.i}
                            </button>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-4 flex-1 space-y-4">
                <div className="space-y-2">
                    {(estModifiable ? manuelleAliments : repas?.aliments || []).map((al, ai) => (
                        <div key={ai} className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-zinc-800/50 pb-2 last:border-none gap-2">
                            <span className="truncate font-medium text-slate-600 dark:text-zinc-400 flex-1">{al.aliment.nom}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-500 shrink-0">{Math.round(al.poids)}g</span>
                        </div>
                    ))}
                    {!estModifiable && (!repas || repas.aliments.length === 0) && (
                        <p className="text-center py-4 text-[10px] uppercase font-bold text-slate-300 dark:text-zinc-700 italic">Vide</p>
                    )}
                </div>

                {estModifiable && (
                    <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-zinc-800/50">
                        {structure.map((groupe, idx) => {
                            const { bacs, isOptional } = groupe;
                            const categoriesActuelles = alimentsManuelsSelectionnes.map(a => a.bac as BacAliment);
                            const estOptionnelActuel = categoriesActuelles.length === 0
                                ? true
                                : (isOptional ? isOptional(categoriesActuelles) : false);

                            if (!ReglesRepas.estLigneAutorisee(idx, templateActuel, alimentsManuelsSelectionnes, besoins)) return null;

                            const alimentChoisi = manuelleAliments.find(m => bacs.includes(m.aliment.bac as BacAliment));
                            const bacsCompatibles = ReglesRepas.getBacsCompatibles(idx, templateActuel, bacs, alimentsManuelsSelectionnes);
                            const label = bacsCompatibles.map((bac: string) => LABELS_BACS[bac] || bac.replace('_', ' ')).join(' / ');

                            return (
                                <div key={idx} className="flex items-center gap-1.5 w-full">
                                    <Dialog
                                        open={openModalIndex === idx}
                                        onOpenChange={(isOpen) => {
                                            setOpenModalIndex(isOpen ? idx : null);
                                            if (!isOpen) setRecherche("");
                                        }}
                                    >
                                        <DialogTrigger className={cn(
                                            "flex-1 min-w-0 flex items-center justify-between p-2.5 rounded-xl border-2 text-[9px] font-black uppercase transition-colors overflow-hidden",
                                            alimentChoisi
                                                ? "border-emerald-100 bg-emerald-50/30 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400 border-solid"
                                                : estOptionnelActuel
                                                    ? "border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 border-dotted hover:bg-slate-50 dark:hover:bg-zinc-800/30 opacity-100"
                                                    : "border-slate-300 bg-slate-50 dark:border-zinc-500 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 border-solid shadow-sm"
                                        )}>
                                            <span className="truncate flex-1 text-left mr-2">
                                                {alimentChoisi ? alimentChoisi.aliment.nom : label}
                                            </span>
                                            <div className="shrink-0">
                                                {alimentChoisi ? <Check size={12} /> : <Plus size={12} className={estOptionnelActuel ? "opacity-40" : "opacity-100"} />}
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md w-[90vw] rounded-3xl dark:bg-zinc-900 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl border-none flex flex-col">
                                            <DialogHeader className="p-6 pb-0">
                                                <DialogTitle className="text-lg font-black uppercase italic dark:text-white truncate pr-6">Choisir : {label}</DialogTitle>
                                                <div className="relative mt-4 w-full">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <Input
                                                        placeholder="Rechercher..."
                                                        className="pl-9 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl w-full h-10 shadow-inner"
                                                        value={recherche}
                                                        onChange={(e) => setRecherche(e.target.value)}
                                                    />
                                                </div>
                                            </DialogHeader>
                                            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-1 custom-scrollbar">
                                                {tousLesAliments
                                                    .filter(alim => bacsCompatibles.includes(alim.bac as BacAliment) && ReglesRepas.verifAcces(alim, moment, userRegime, besoins || undefined) && alim.nom.toLowerCase().includes(recherche.toLowerCase()))
                                                    .map(alim => (
                                                        <button
                                                            key={alim.id}
                                                            type="button"
                                                            onClick={() => {
                                                                onAjouterAliment?.(alim);
                                                                setOpenModalIndex(null);
                                                            }}
                                                            className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-sm font-bold flex justify-between items-center transition-colors gap-2 group"
                                                        >
                                                            <span className="dark:text-zinc-300 truncate flex-1 mr-2">{alim.nom}</span>
                                                            <Plus size={14} className="text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    ))}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    {alimentChoisi && (
                                        <button onClick={() => onRetirerAliment?.(moment, alimentChoisi.aliment.bac)} className="p-2 text-slate-300 hover:text-red-500 dark:text-zinc-700 dark:hover:text-red-400 transition-colors shrink-0">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function BilanNutritionnelCard({ stats, besoins }: { stats: { prot: number, lip: number, glu: number, sucre: number, gras_sat: number, sel: number }, besoins: BesoinsNutritionnels | null }) {
    if (!besoins) return null;
    return (
        <Card className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="grid grid-cols-3 gap-6 w-full lg:w-2/3">
                {[
                    { l: "PROTÉINES", a: stats.prot, c: besoins.proteines, id: "stats-prot" },
                    { l: "LIPIDES", a: stats.lip, c: besoins.lipides, id: "stats-lip" },
                    { l: "GLUCIDES", a: stats.glu, c: besoins.glucides, id: "stats-glu" }
                ].map((m) => (
                    <div key={m.l} className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">{m.l}</span>
                            <span id={m.id} className="text-lg font-black italic dark:text-white">{Math.round(m.a)}g</span>
                        </div>
                        <Progress value={(m.a / m.c) * 100} className="h-1" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Cible: {Math.round(m.c)}g</span>
                    </div>
                ))}
            </div>

            <Separator orientation="vertical" className="hidden lg:block h-20 opacity-20" />

            <div className="w-full lg:w-1/3 space-y-3 border-t lg:border-t-0 pt-4 lg:pt-0">
                {[
                    { l: "Sucre", a: stats.sucre, c: besoins.limites.sucre },
                    { l: "Gras Sat.", a: stats.gras_sat, c: besoins.limites.gras_sat },
                    { l: "Sel", a: stats.sel, c: besoins.limites.sel }
                ].map((lim) => (
                    <div key={lim.l} className="flex items-center gap-3">
                        <span className="text-[7px] font-black text-slate-400 w-12 uppercase">{lim.l}</span>
                        <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500",
                                    lim.a > lim.c ? "bg-red-500" : "bg-emerald-500/50"
                                )}
                                style={{ width: `${Math.min((lim.a / lim.c) * 100, 100)}%` }}
                            />
                        </div>
                        <span className={cn("text-[9px] font-bold w-10 text-right", lim.a > lim.c ? "text-red-500" : "text-slate-500")}>
                            {lim.a.toFixed(1)}g
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}


export function PlanningTimeline({
    planning,
    besoins
}: {
    planning: PlanningComplet,
    besoins: BesoinsNutritionnels | null
}) {
    return (
        <div className="space-y-20 pb-12">
            {[1, 2, 3, 4, 5, 6, 7].map((numeroJour) => {
                const repasDuJour = (planning.repas || []).filter((r) => r.numJour === numeroJour).sort(CalculateurImpact.trierRepas);
                if (repasDuJour.length === 0) return null;
                const { statsDuJour, caloriesFinales } = CalculateurImpact.calculerStatsJournee(repasDuJour);
                return (
                    <section key={numeroJour} className="space-y-8 text-left">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 text-white rounded-xl dark:bg-zinc-800"><Utensils size={20} /></div>
                            <div>
                                <h2 className="text-3xl font-black uppercase italic dark:text-white leading-none">
                                    {JOURS_SEMAINE[numeroJour - 1]}
                                </h2>
                                <div className="h-1 w-12 bg-emerald-600 rounded-full mt-2" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <CarteImpact
                                titre="Total Journée"
                                calories={caloriesFinales}
                                co2={statsDuJour.co2}
                            />
                            <BilanNutritionnelCard stats={statsDuJour} besoins={besoins} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {repasDuJour.map((repas, idx) => (
                                <CarteRepas
                                    key={idx}
                                    moment={repas.type as MomentRepas}
                                    repas={CalculateurImpact.formaterRepasBDD(repas)}
                                    templateActuel={repas.nomTemplate || TemplateRepas.HOT}
                                    onChangeTemplate={() => { }}
                                    estModifiable={false}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}