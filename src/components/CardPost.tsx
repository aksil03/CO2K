import { useEffect } from 'react';
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input";
import { type CommentaireComplet, type SemaineProgramme } from "@/lib/types";
import { Trash2, ChevronRight, X, ClipboardList, LayoutGrid, ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { type UserWithRelations } from "@/lib/types";
import { Heart, MessageCircle, MessageSquare } from "lucide-react";
import {
    type PostComplet,
    type PlanningComplet
} from "@/lib/types";
import api from '@/lib/api'
import { toast } from "sonner"
import { CalculateurImpact } from '@/lib/planning/impact';
import { PlanningTimeline } from './Nutrition';
import { alerteSuppression } from './UICommuns';

export function CardPost({
    post,
    user,
    onUpdate,
    onUserClick,
    onDelete
}: {
    post: PostComplet,
    user: UserWithRelations,
    onUpdate?: (postId: number, newLikesCount: number, isLiked: boolean) => void,
    onUserClick?: (id: number, nom: string, prenom: string) => void,
    onDelete?: (postId: number) => void
}) {
    const [reponse, setReponse] = useState<string>("");
    const [viewOpen, setViewOpen] = useState<boolean>(false);
    const [inspectingPlanning, setInspectingPlanning] = useState<PlanningComplet | null>(null);

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
    const [replyTo, setReplyTo] = useState<{ id: number, nom: string, commentId: number } | null>(null);
    const [listeCommentaires, setListeCommentaires] = useState(post.commentaires || []);

    const isAuteur = user?.id === post.auteurId;

    const handleInitiateReply = (auteurId: number, auteurPrenom: string, commentId: number) => {
        setReplyTo({ id: auteurId, nom: auteurPrenom, commentId: commentId });
        setReponse(`@${auteurPrenom} `);
    };

    useEffect(() => {
        setListeCommentaires(post.commentaires || []);
    }, [post.commentaires]);

    useEffect(() => {
        setIsLiked(post.likes && post.likes.length > 0);
        setLikesCount(post._count?.likes || 0);
    }, [post]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user?.id) return;

        const ancienStatut = isLiked;
        const ancienTotal = likesCount;

        const nouveauStatut = !isLiked;
        setIsLiked(nouveauStatut);
        setLikesCount(prev => nouveauStatut ? prev + 1 : prev - 1);

        try {
            const res = await api.post(`/api/posts/${post.id}/like`, {
                userId: user.id
            });

            const nouveauTotalServeur = res.data.likesCount;

            setLikesCount(nouveauTotalServeur);

            if (onUpdate) {
                onUpdate(post.id, nouveauTotalServeur, nouveauStatut);
            }

        } catch (err) {
            setIsLiked(ancienStatut);
            setLikesCount(ancienTotal);
            toast.error("Erreur lors du like");
        }
    };

    const handleSendCommentaire = async () => {
        if (!reponse.trim() || !user?.id) return;

        try {
            const res = await api.post(`/api/posts/${post.id}/commentaires`, {
                auteurId: user.id,
                texte: reponse,
                parentId: replyTo ? replyTo.commentId : null
            });

            const nouveauCom = res.data;
            const nouvelleListe = [...listeCommentaires, nouveauCom];
            setListeCommentaires(nouvelleListe);

            post.commentaires = nouvelleListe;

            if (post._count) {
                post._count.commentaires = nouvelleListe.length;
            }

            setReponse("");
            setReplyTo(null);
            toast.success("Réponse publiée");
        } catch (err) {
            toast.error("Erreur lors de l'envoi");
        }
    };

    const handleDeleteCommentaire = async (commentId: number) => {
        alerteSuppression(async () => {
            const sauvegardeAncienneListe = [...listeCommentaires];

            const nouvelleListe = listeCommentaires.filter(
                c => c.id !== commentId && c.parentId !== commentId
            );

            setListeCommentaires(nouvelleListe);
            try {
                await api.delete(`/api/commentaires/${commentId}`);
                post.commentaires = nouvelleListe;

                if (post._count) {
                    post._count.commentaires = nouvelleListe.length;
                }
                toast.success("Commentaire supprimé");
            } catch (err) {
                setListeCommentaires(sauvegardeAncienneListe);
                toast.error("Impossible de supprimer");
            }
        }, "Supprimer ce commentaire et ses réponses ?");
    };



    const handleUserClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUserClick && post.auteur) {
            onUserClick(post.auteurId, post.auteur.nom, post.auteur.prenom);
        }
    };

    const handleDeletePost = async (e: React.MouseEvent) => {
        e.stopPropagation();

        alerteSuppression(async () => {
            try {
                await api.delete(`/api/posts/${post.id}`);
                toast.success("Supprimé");
                if (onDelete) onDelete(post.id);
            } catch (err) {
                toast.error("Erreur");
            }
        }, "Supprimer cette publication ?");
    };

    const nbSemaines = post.programme?.semaines?.length || 0;

    const handleOpenView = () => {
        if (post.planning) setInspectingPlanning(post.planning as PlanningComplet);
        setViewOpen(true);
    };

    const besoinsAffichage = post.auteur
        ? CalculateurImpact.calculerBesoinsNutritionnels(post.auteur as UserWithRelations)
        : CalculateurImpact.calculerBesoinsNutritionnels(user);

    return (
        <div className="h-full group">
            <Card className={cn(
                "relative h-full rounded-[2rem] transition-all duration-300 overflow-hidden text-left border flex flex-col items-start",
                "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200",
                "dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 dark:shadow-none"
            )}>
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500" />

                <CardHeader className="p-7 pb-0 w-full flex flex-col items-start">
                    <div className="flex justify-between items-start w-full">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleUserClick}
                                    className={cn(
                                        "group/author outline-none text-left px-2.5 py-1 rounded-lg border-2 transition-colors",
                                        "bg-white border-slate-200 shadow-sm",
                                        "dark:bg-zinc-900 dark:border-zinc-800",
                                        "hover:border-emerald-500/50"
                                    )}
                                >
                                    <p className="text-[9px] font-black uppercase italic text-slate-900 dark:text-white leading-none">
                                        {post.auteur?.prenom} <span className="text-emerald-700">{post.auteur?.nom}</span>
                                    </p>
                                </button>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter px-0.5">
                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date inconnue'}
                            </p>
                        </div>

                        {(post.planning || post.programme) && (
                            <Badge className={cn(
                                "border-none font-black italic text-[8px] uppercase px-2 py-1",
                                post.planning ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                            )}>
                                {post.planning ? "Planning" : "Programme"}
                            </Badge>
                        )}
                    </div>

                    <div className="mt-6 text-left w-full">
                        <CardTitle className="text-xl font-black uppercase italic text-slate-900 dark:text-zinc-100 leading-tight">
                            {post.titre}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-7 pt-4 space-y-6 flex flex-col w-full text-left items-start flex-1">
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">
                        {post.contenu}
                    </p>

                    {(post.planning || post.programme) && (
                        <div
                            onClick={handleOpenView}
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 flex justify-between items-center group/btn hover:border-emerald-500/30 transition-all"
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-emerald-500 shadow-sm transition-transform group-hover/btn:scale-110">
                                    {post.planning ? <ClipboardList size={16} /> : <LayoutGrid size={16} />}
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Détails</p>
                                    <p className="text-xs font-black italic uppercase text-slate-900 dark:text-white truncate max-w-37.5">
                                        {post.planning?.nom || post.programme?.nom}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover/btn:text-emerald-500 group-hover/btn:translate-x-1 transition-all" />
                        </div>
                    )}
                    <div className="flex items-center gap-4 pt-4 mt-auto border-t border-slate-50 dark:border-zinc-900 w-full">
                        <div className="flex items-center gap-1.5 py-1">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "transition-all duration-300 active:scale-150 outline-none",
                                    isLiked ? "text-rose-500" : "text-slate-300 hover:text-rose-400"
                                )}
                            >
                                <Heart
                                    size={16}
                                    className={cn("transition-all", isLiked && "fill-rose-500")}
                                />
                            </button>
                            <span className={cn(
                                "text-[10px] font-black transition-colors",
                                isLiked ? "text-rose-600" : "text-slate-400"
                            )}>
                                {likesCount}
                            </span>
                        </div>
                        <Dialog>
                            <DialogTrigger render={
                                <button className="flex items-center gap-1.5 group outline-none">
                                    <div className="p-2 rounded-lg group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all text-slate-300 group-hover:text-emerald-500">
                                        <MessageCircle size={16} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-500">
                                        {post._count?.commentaires || 0}
                                    </span>
                                </button>
                            } />
                            <DialogContent showCloseButton={false} className="max-w-md rounded-[3rem] bg-white dark:bg-zinc-950 p-0 overflow-hidden border-none shadow-2xl">
                                <div className="absolute top-8 right-8 z-50">
                                    <DialogClose render={
                                        <button className="p-2 rounded-full text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors outline-none">
                                            <X size={22} />
                                        </button>
                                    } />
                                </div>

                                <DialogHeader className="p-8 pb-4 border-b border-slate-50 dark:border-zinc-900">
                                    <DialogTitle className="text-xl font-black italic uppercase text-center">Commentaires</DialogTitle>
                                </DialogHeader>

                                <div className="p-6 space-y-6 max-h-87.5 overflow-y-auto custom-scrollbar">
                                    {listeCommentaires && listeCommentaires.length > 0 ? (
                                        listeCommentaires.filter((c: CommentaireComplet) => !c.parentId).map((parentCom: CommentaireComplet) => (
                                            <div key={parentCom.id} className="space-y-4">
                                                <div
                                                    onClick={() => handleInitiateReply(parentCom.auteurId, parentCom.auteur.prenom, parentCom.id)}
                                                    className="group/com flex gap-3 p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all active:scale-95"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase text-emerald-500 shrink-0 shadow-sm">
                                                        {parentCom.auteur?.prenom?.[0]}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase leading-none">
                                                                {parentCom.auteur?.prenom} {parentCom.auteur?.nom}
                                                            </p>
                                                            {parentCom.auteurId === post.auteurId && (
                                                                <span className="bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase italic shadow-sm">
                                                                    Auteur
                                                                </span>
                                                            )}
                                                            {parentCom.auteurId === user?.id && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCommentaire(parentCom.id); }}
                                                                    className="text-slate-300 hover:text-red-500 transition-colors ml-1"
                                                                >
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            )}
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase opacity-0 group-hover/com:opacity-100 transition-opacity"> • Répondre </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-tight italic">{parentCom.texte}</p>
                                                    </div>
                                                </div>

                                                <div className="ml-10 space-y-3 border-l-2 border-slate-100 dark:border-zinc-900 pl-4">
                                                    {listeCommentaires
                                                        .filter((child: CommentaireComplet) => child.parentId === parentCom.id).map((reply: CommentaireComplet) => (
                                                            <div
                                                                key={reply.id}
                                                                className="flex gap-2 p-3 bg-white dark:bg-zinc-950 rounded-xl border border-slate-50 dark:border-zinc-900 shadow-sm"
                                                            >
                                                                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-[8px] flex items-center justify-center font-black text-emerald-500 shrink-0">
                                                                    {reply.auteur?.prenom?.[0]}
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="text-[8px] font-black text-emerald-600 uppercase leading-none">{reply.auteur?.prenom}</p>
                                                                        {reply.auteurId === post.auteurId && (
                                                                            <span className="bg-emerald-500 text-white text-[6px] font-black px-1 py-0.5 rounded-full uppercase italic">
                                                                                Auteur
                                                                            </span>
                                                                        )}
                                                                        {reply.auteurId === user?.id && (
                                                                            <button
                                                                                onClick={() => handleDeleteCommentaire(reply.id)}
                                                                                className="text-slate-300 hover:text-red-500 transition-colors ml-1"
                                                                            >
                                                                                <Trash2 size={8} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic leading-tight">{reply.texte}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>

                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center opacity-30 italic font-black uppercase text-[10px]">Aucune réponse</div>
                                    )}
                                </div>

                                <div className="p-8 pt-4">
                                    {replyTo && (
                                        <div className="flex items-center justify-between mb-2 px-2 animate-in fade-in slide-in-from-bottom-1">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase italic">
                                                En réponse à {replyTo.nom}
                                            </p>
                                            <button
                                                onClick={() => { setReplyTo(null); setReponse(""); }}
                                                className="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    )}
                                    <div className="relative flex items-center gap-2">
                                        <Input
                                            placeholder={replyTo ? `Répondre à ${replyTo.nom}...` : "Répondre..."}
                                            className="rounded-xl h-12 bg-slate-50 dark:bg-zinc-900 border-none font-bold text-xs"
                                            value={reponse}
                                            onChange={(e) => setReponse(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendCommentaire()}
                                        />
                                        <button onClick={handleSendCommentaire} className="p-3 bg-slate-800 text-white rounded-xl active:scale-95 transition-all">
                                            <MessageSquare size={16} />
                                        </button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {isAuteur && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDeletePost}
                            className="absolute bottom-6 right-6 rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-200 h-10 w-10 shrink-0 transition-all"
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setInspectingPlanning(null); }}>
                <DialogContent showCloseButton={false} className={cn("rounded-[3.5rem] bg-white dark:bg-zinc-950 border-none shadow-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]", inspectingPlanning ? "sm:max-w-[95vw]! lg:max-w-[90vw]! xl:max-w-350!" : nbSemaines <= 1 ? "sm:max-w-112.5!" : nbSemaines === 2 ? "sm:max-w-200!" : "sm:max-w-300!")}>
                    <div className="absolute top-8 right-8 z-50">
                        <DialogClose render={<button className="p-2 rounded-full text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors outline-none"><X size={22} /></button>} />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar my-6 px-8 md:px-12 text-left">
                        <DialogHeader className="text-left mb-12 pr-16">
                            <DialogTitle className="text-4xl font-black uppercase italic leading-none dark:text-white">{inspectingPlanning ? inspectingPlanning.nom : (post.planning?.nom || post.programme?.nom)}</DialogTitle>
                            {!inspectingPlanning && post.programme?.description && <p className="text-slate-400 italic text-sm mt-4 max-w-xl leading-relaxed">{post.programme.description}</p>}
                        </DialogHeader>

                        {!inspectingPlanning && post.programme?.semaines ? (
                            <div className={cn("grid gap-6 pb-8", nbSemaines === 1 ? "grid-cols-1" : nbSemaines === 2 ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                                {(post.programme.semaines ?? []).sort((a, b) => a.ordre - b.ordre).map((s: SemaineProgramme) => (
                                    <div key={s.id} onClick={() => s.planning && setInspectingPlanning(s.planning as PlanningComplet)} className="flex items-center justify-between p-6 rounded-[2rem] border bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-emerald-500/50 shadow-sm group/item transition-all">
                                        <div className="flex items-center gap-5 text-left">
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-xs font-black shadow-inner dark:text-white shrink-0">{s.ordre}</div>
                                            <div className="min-w-0"><p className="text-[9px] font-black text-emerald-500 uppercase leading-none mb-1">Nutrition</p><p className="font-black uppercase italic text-base dark:text-white leading-none truncate pr-2">{s.planning?.nom || "Non définie"}</p></div>
                                        </div>
                                        {s.planning && <ChevronRight size={20} className="text-emerald-500 group-hover/item:translate-x-1 transition-all shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        ) : inspectingPlanning && (
                            <PlanningTimeline
                                planning={inspectingPlanning}
                                besoins={besoinsAffichage}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
