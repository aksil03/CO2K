import React, { useState, useEffect } from 'react';
import api from '@/lib/api'
import { LayoutGrid, ClipboardList, ChevronLeft, Check, Plus, Search } from "lucide-react";
import type { UserWithRelations, PostComplet } from "@/lib/types";
import { Loading, CardPost, Bouton, EmptyState, SectionHeader } from '@/components';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function Communaute({ user, onUpdate, initialFeed }: { user: UserWithRelations | null, onUpdate: () => void, initialFeed: PostComplet[] }) {
  const [feed, setFeed] = useState<PostComplet[]>(initialFeed);

  const [selectedAuthor, setSelectedAuthor] = useState<{ id: number, nom: string, prenom: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'abonnements'>('explorer');
  const [suivisIds, setSuivisIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState<'tous' | 'programme' | 'planning'>('tous');

  useEffect(() => {
    setFeed(initialFeed);
  }, [initialFeed]);

  useEffect(() => {
    if (user?.mesAbonnements) {
      setSuivisIds(user.mesAbonnements.map(f => f.id_star));
    }
  }, [user?.mesAbonnements]);

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab, selectedAuthor]);

  useEffect(() => {
    async function checkStatus() {
      if (selectedAuthor && user?.id) {
        try {
          const res = await api.get(`/api/follow/status`, {
            params: { abonneId: user.id, starId: selectedAuthor.id }
          });
          setIsFollowing(res.data.isFollowing);
        } catch (error) {
        }
      }
    }
    checkStatus();
  }, [selectedAuthor, user?.id]);

  const updatePostInFeed = (postId: number, newLikesCount: number, isLiked: boolean) => {
    setFeed((prevFeed: PostComplet[]) => prevFeed.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          _count: {
            ...post._count,
            likes: newLikesCount,
            commentaires: post._count?.commentaires || 0
          },
          likes: isLiked ? [{ id: 0, userId: user?.id || 0, postId }] : []
        };
      }
      return post;
    }));
  };

  const handleFollowToggle = async () => {
    if (!user?.id || !selectedAuthor) return;
    try {
      const res = await api.post(`/api/follow/toggle`, {
        abonneId: user.id,
        starId: selectedAuthor.id
      });
      setIsFollowing(res.data.isFollowing);

      onUpdate();

      if (res.data.isFollowing) {
        setSuivisIds(prev => [...prev, selectedAuthor.id]);
      } else {
        setSuivisIds(prev => prev.filter(id => id !== selectedAuthor.id));
      }

      toast.success(res.data.isFollowing ? "Abonnement ajouté" : "Désabonné");
    } catch (error) {
      toast.error("Erreur de synchronisation");
    }
  };

  if (!user) return null;

  if (selectedAuthor) {
    const query = searchQuery.toLowerCase().trim();
    const postsAuteur = feed.filter(p => {
      if (p.auteurId !== selectedAuthor.id) return false;
      if (!query) return true;
      return (
        p.titre?.toLowerCase().includes(query) ||
        p.contenu?.toLowerCase().includes(query) ||
        p.programme?.nom?.toLowerCase().includes(query) ||
        p.planning?.nom?.toLowerCase().includes(query)
      );
    });
    const auteurProgrammes = postsAuteur.filter(p => !!p.programme);
    const auteurPlannings = postsAuteur.filter(p => !!p.planning && !p.programme);

    return (
      <div className="w-full space-y-8 pb-20 text-left px-4 sm:px-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 w-full">
          <div className="space-y-2">
            <h1 className="text-6xl font-black uppercase italic leading-none">
              Profil <span className="text-emerald-700">{selectedAuthor.prenom}</span>
            </h1>

            <div className="flex flex-col items-start gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                {postsAuteur.length} Partages trouvés
              </p>

              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                className="flex items-center gap-1.5 text-slate-400 font-black uppercase text-[10px] hover:text-emerald-600 transition-colors outline-none"
              >
                <ChevronLeft size={14} strokeWidth={3} /> Retour
              </button>
            </div>
          </div>

          {user?.id !== selectedAuthor.id && (
            <div className="w-full sm:w-48 shrink-0">
              <Bouton
                onClick={handleFollowToggle}
                className={cn(
                  "h-10 transition-all rounded-xl w-full",
                  isFollowing
                    ? "bg-zinc-100 text-zinc-700 border-none hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-rose-950/40"
                    : "bg-slate-900 text-white hover:bg-black shadow-lg"
                )}
              >
                {isFollowing ? (
                  <>
                    <Check size={12} className="mr-1" /> Abonné
                  </>
                ) : (
                  <>
                    <Plus size={12} className="mr-1" /> S'abonner
                  </>
                )}
              </Bouton>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={14} />
            <Input
              placeholder="Chercher programme, planning..."
              className="pl-9 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl w-full h-10 shadow-inner text-xs font-black uppercase italic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setContentTypeFilter('tous')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all",
                contentTypeFilter === 'tous' ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Tout
            </button>
            <button
              type="button"
              onClick={() => setContentTypeFilter('programme')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all",
                contentTypeFilter === 'programme' ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Programmes
            </button>
            <button
              type="button"
              onClick={() => setContentTypeFilter('planning')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all",
                contentTypeFilter === 'planning' ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Plannings
            </button>
          </div>
        </div>

        <div className="space-y-12 pt-4">
          {contentTypeFilter !== 'planning' && (
            <section className="space-y-8">
              <SectionHeader titre="Programmes" icon={<LayoutGrid size={22} />} variant="dark" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {auteurProgrammes.map(post => (
                  <CardPost key={post.id} post={post} user={user} onUpdate={updatePostInFeed} />
                ))}
              </div>
            </section>
          )}

          {contentTypeFilter !== 'programme' && (
            <section className="space-y-8">
              <SectionHeader titre="Plannings" icon={<ClipboardList size={22} />} variant="light" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {auteurPlannings.map(post => (
                  <CardPost key={post.id} post={post} user={user} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  const query = searchQuery.toLowerCase().trim();

  const feedAffiche = feed.filter(post => {
    if (activeTab === 'abonnements' && !suivisIds.includes(post.auteurId)) return false;
    if (!query) return true;

    return (
      post.titre?.toLowerCase().includes(query) ||
      post.contenu?.toLowerCase().includes(query) ||
      post.auteur?.nom?.toLowerCase().includes(query) ||
      post.auteur?.prenom?.toLowerCase().includes(query) ||
      post.programme?.nom?.toLowerCase().includes(query) ||
      post.planning?.nom?.toLowerCase().includes(query)
    );
  });

  const postsProgrammes = feedAffiche.filter(p => !!p.programme);
  const postsPlannings = feedAffiche.filter(p => !!p.planning && !p.programme);

  return (
    <div className="w-full space-y-8 pb-20 text-left px-4 sm:px-10">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic leading-none">
            Fil <span className="text-emerald-700">Social</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            {feedAffiche.length} Publications {activeTab === 'abonnements' ? 'de vos abonnements' : 'communautaires'}
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={cn(
              "flex-1 md:w-32 py-2.5 rounded-xl text-[10px] font-black uppercase italic transition-all",
              activeTab === 'explorer'
                ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            Explorer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('abonnements')}
            className={cn(
              "flex-1 md:w-32 py-2.5 rounded-xl text-[10px] font-black uppercase italic transition-all",
              activeTab === 'abonnements'
                ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            Abonnements
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={14} />
          <Input
            placeholder="Chercher utilisateur, programme, planning..."
            className="pl-9 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl w-full h-10 shadow-inner text-xs font-black uppercase italic"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setContentTypeFilter('tous')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all",
              contentTypeFilter === 'tous' ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Tout
          </button>
          <button
            type="button"
            onClick={() => setContentTypeFilter('programme')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all",
              contentTypeFilter === 'programme' ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Programmes
          </button>
          <button
            type="button"
            onClick={() => setContentTypeFilter('planning')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all",
              contentTypeFilter === 'planning' ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Plannings
          </button>
        </div>
      </div>

      {contentTypeFilter !== 'planning' && (
        <section className="space-y-8 pt-4">
          <SectionHeader titre="Programmes" icon={<LayoutGrid size={22} />} variant="dark" />
          {postsProgrammes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {postsProgrammes.map(post => (
                <CardPost
                  key={post.id}
                  post={post}
                  user={user}
                  onUpdate={updatePostInFeed}
                  onUserClick={(id, nom, prenom) => setSelectedAuthor({ id, nom, prenom })}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={activeTab === 'abonnements' ? "Aucun programme publié par vos abonnements" : "Aucun programme disponible pour le moment"} />
          )}
        </section>
      )}

      {contentTypeFilter !== 'programme' && (
        <section className="space-y-8">
          <SectionHeader titre="Plannings" icon={<ClipboardList size={22} />} variant="light" />
          {postsPlannings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {postsPlannings.map(post => (
                <CardPost
                  key={post.id}
                  post={post}
                  user={user}
                  onUpdate={updatePostInFeed}
                  onUserClick={(id, nom, prenom) => setSelectedAuthor({ id, nom, prenom })}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={activeTab === 'abonnements' ? "Aucun planning publié par vos abonnements" : "Aucun planning disponible pour le moment"} />
          )}
        </section>
      )}

      {feedAffiche.length === 0 && (
        <div className="py-20 text-center bg-slate-50 dark:bg-zinc-900/30 rounded-[3rem] border border-slate-100 dark:border-zinc-800">
          <p className="text-slate-500 font-black uppercase italic text-xs mb-2">
            {activeTab === 'abonnements' ? "Votre feed est vide" : "La communauté est calme"}
          </p>
          <p className="text-slate-400 text-[10px] uppercase font-bold italic">
            {activeTab === 'abonnements'
              ? "Abonnez-vous pour voir leurs partages ici"
              : "Revenez plus tard pour découvrir de nouveaux partages"}
          </p>
        </div>
      )}

    </div>
  );
}