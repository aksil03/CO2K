import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { type CreateProgrammeData, type UserWithRelations } from "@/lib/types";
import { CreatePostSchema, CreateProgrammeSchema } from "@/lib/types";
import { Bouton } from './UICommuns';
import type z from 'zod';

export function ModalCreerProgramme({
    onCreer,
    auteurId,
    disabled = false
}: {
    onCreer: (data: CreateProgrammeData) => void,
    auteurId: number,
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        nom: "",
        description: "",
        nbSemaines: 1
    });

    const genererSemaines = (nb: number) => {
        return Array.from({ length: nb }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + (i * 7));
            return { ordre: i + 1, semaineDebut: date, planningId: null };
        });
    };

    const validation = CreateProgrammeSchema.safeParse({
        nom: formData.nom,
        description: formData.description || undefined,
        auteurId: auteurId,
        semaines: genererSemaines(formData.nbSemaines)
    });

    const handleSubmit = () => {
        if (validation.success) {
            onCreer(validation.data);
            setOpen(false);
            setFormData({ nom: "", description: "", nbSemaines: 1 });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Bouton disabled={disabled} className="w-auto px-8 h-14 rounded-2xl">
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
                        <button className="p-2 rounded-full text-slate-300 hover:text-slate-900 transition-colors outline-none">
                            <X size={22} />
                        </button>
                    } />
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
                                value={formData.nom}
                                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                            />
                        </div>

                        <div className="w-full space-y-2 flex flex-col items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-full">Description</p>
                            <textarea
                                style={{ resize: 'none' }}
                                className="w-full h-24 text-xs text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 italic outline-none focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
                                placeholder="Objectifs du programme..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                                onChange={e => setFormData({ ...formData, nbSemaines: parseInt(e.target.value) })}
                            />
                        </div>

                        <Bouton
                            onClick={handleSubmit}
                            disabled={!validation.success}
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

export function ModalCreerPost({
    user,
    onPublier,
    id,
    disabled = false
}: {
    user: UserWithRelations,
    onPublier: (data: z.infer<typeof CreatePostSchema>) => void,
    id?: string,
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false);
    const [typeContent, setTypeContent] = useState<'programme' | 'planning'>('programme');
    const [formData, setFormData] = useState({
        titre: "",
        contenu: "",
        selectedId: "" as string | null
    });

    const handleSwitchType = (newType: 'programme' | 'planning') => {
        setTypeContent(newType);
        setFormData({ ...formData, selectedId: null });
    };

    const validation = CreatePostSchema.safeParse({
        titre: formData.titre,
        contenu: formData.contenu,
        auteurId: user?.id || 0,
        programmeId: typeContent === 'programme' ? Number(formData.selectedId) : null,
        planningId: typeContent === 'planning' ? Number(formData.selectedId) : null,
    });

    const handleSubmit = () => {
        if (!validation.success || !user?.id) return;
        onPublier(validation.data);
        setOpen(false);
        setFormData({ titre: "", contenu: "", selectedId: null });
    };

    const options = typeContent === 'programme' ? user?.programmes : user?.plannings;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Bouton id={id} disabled={disabled} className="w-auto px-8 h-14 rounded-2xl">
                        <Plus className="mr-2" size={18} /> Créer un Post
                    </Bouton>
                }
            />

            <DialogContent
                showCloseButton={false}
                className="overflow-hidden p-0 max-w-sm w-[95vw] rounded-[3.5rem] border-none bg-white dark:bg-zinc-950 shadow-2xl"
            >
                <div className="absolute top-8 right-8 z-50">
                    <DialogClose render={
                        <button id="btn-close-modal-post" className="p-2 rounded-full text-slate-300 hover:text-slate-900 transition-colors">
                            <X size={22} />
                        </button>
                    } />
                </div>

                <div className="w-full flex flex-col items-center justify-center p-10 pt-16 pb-12 space-y-8">
                    <div className="w-full text-center">
                        <DialogHeader>
                            <DialogTitle className="text-4xl sm:text-5xl font-black uppercase italic text-slate-950 dark:text-white leading-[0.85] tracking-tighter text-center">
                                PARTAGER<br />
                                <span className="text-emerald-500 block">UN CONTENU</span>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="w-full max-w-70 flex flex-col items-center space-y-7">
                        <div className="flex w-full p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl">
                            <button
                                id="tab-select-programme"
                                type="button"
                                onClick={() => handleSwitchType('programme')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                                    typeContent === 'programme' ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm" : "text-slate-400"
                                )}
                            >
                                Programme
                            </button>
                            <button
                                id="tab-select-planning"
                                type="button"
                                onClick={() => handleSwitchType('planning')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                                    typeContent === 'planning' ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm" : "text-slate-400"
                                )}
                            >
                                Planning
                            </button>
                        </div>

                        <div className="w-full space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-full">Sélectionner</p>
                            <Select
                                key={typeContent}
                                value={formData.selectedId || ""}
                                onValueChange={(val) => setFormData({ ...formData, selectedId: val })}
                            >
                                <SelectTrigger className="h-10 text-[10px] font-black uppercase italic border-emerald-500/30 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white w-full shadow-inner rounded-xl px-4">
                                    <SelectValue placeholder="Choisir...">
                                        {formData.selectedId
                                            ? options?.find((o: any) => o.id.toString() === formData.selectedId)?.nom
                                            : "Choisir..."}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {options?.map((opt: any) => {
                                        const dejaPublie = opt.posts && opt.posts.length > 0;
                                        const estIncomplet = typeContent === 'programme' && opt.semaines?.some((s: any) => !s.planningId);
                                        const isDisabled = dejaPublie || estIncomplet;
                                        return (<SelectItem key={opt.id} value={opt.id.toString()} className="font-black uppercase text-[10px]" disabled={isDisabled}>
                                            <div className="flex justify-between items-center w-full gap-4">
                                                <span>{opt.nom}</span>
                                                {dejaPublie && (
                                                    <span className="text-[8px] text-rose-500 italic opacity-70">
                                                        Déjà partagé
                                                    </span>
                                                )}
                                                {estIncomplet && (
                                                    <span className="text-[8px] text-amber-600 italic opacity-70">
                                                        Incomplet (planning manquant)
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                        );
                                    })}
                                </SelectContent>

                            </Select>
                        </div>

                        <div className="w-full space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-full">Titre du post</p>
                            <Input
                                id="input-post-titre"
                                placeholder="Ex: MA ROUTINE FORCE"
                                className="h-10 text-lg font-black uppercase italic border-emerald-500/50 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus-visible:ring-emerald-500/30 w-full text-left shadow-inner"
                                value={formData.titre}
                                onChange={e => setFormData({ ...formData, titre: e.target.value })}
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-full">Description</p>
                            <textarea
                                id="input-post-contenu"
                                style={{ resize: 'none' }}
                                className="w-full h-24 text-xs text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 italic outline-none focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
                                placeholder="Aujourd'hui je vous partage..."
                                value={formData.contenu}
                                onChange={e => setFormData({ ...formData, contenu: e.target.value })}
                            />
                        </div>

                        <Bouton
                            id="btn-valider-publication"
                            onClick={handleSubmit}
                            disabled={!validation.success || !formData.selectedId}
                            className="w-full h-16 rounded-full"
                        >
                            VALIDER LA PUBLICATION
                        </Bouton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
