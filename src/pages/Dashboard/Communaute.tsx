import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, ClipboardList, ChevronLeft, Check, Plus } from "lucide-react";
import type { UserWithRelations, PostComplet } from "@/lib/types";
import { Loading, CardPost, Bouton } from '../../components/componentsCommuns';
import { cn } from "@/lib/utils";

export default function Communaute({ user }: { user: UserWithRelations | null }) {
  const [feed, setFeed] = useState<PostComplet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAuthor, setSelectedAuthor] = useState<{id: number, nom: string, prenom: string} | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'abonnements'>('explorer');
  const [suivisIds, setSuivisIds] = useState<number[]>([]);

  useEffect(() => {
    if (user?.mesAbonnements) {
      setSuivisIds(user.mesAbonnements.map((f: any) => f.id_star));
    }
  }, [user]);

  useEffect(() => {
    async function fetchFeed() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await axios.get<PostComplet[]>(`http://localhost:3000/api/communaute/feed`, {
          params: { exclureId: user.id }
        });
        setFeed(res.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, [user?.id]);

  useEffect(() => {
    async function checkStatus() {
      if (selectedAuthor && user?.id) {
        try {
          const res = await axios.get(`http://localhost:3000/api/follow/status`, {
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
          likes: (isLiked ? [{ userId: user?.id, postId }] : []) as any 
        };
      }
      return post;
    }));
  };

  const handleFollowToggle = async () => {
    if (!user?.id || !selectedAuthor) return;
    try {
      const res = await axios.post(`http://localhost:3000/api/follow/toggle`, {
        abonneId: user.id,
        starId: selectedAuthor.id
      });
      setIsFollowing(res.data.isFollowing);

      if (res.data.isFollowing) {
        setSuivisIds(prev => [...prev, selectedAuthor.id]);
      } else {
        setSuivisIds(prev => prev.filter(id => id !== selectedAuthor.id));
      }
    } catch (error) {
    }
  };
  

  if (loading) return <Loading message="Initialisation du feed..." />;
  if (!user) return null;

  if (selectedAuthor) {
    const postsAuteur = feed.filter(p => p.auteurId === selectedAuthor.id);
    const auteurProgrammes = postsAuteur.filter(p => !!p.programme);
    const auteurPlannings = postsAuteur.filter(p => !!p.planning && !p.programme);

    return (
      <div className="w-full space-y-12 pb-20 text-left px-4 sm:px-10">
        <div className="flex justify-between items-start w-full">
                  <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic leading-none">
            Profil <span className="text-emerald-700">{selectedAuthor.prenom}</span>
          </h1>
          
          <div className="flex flex-col items-start gap-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              {postsAuteur.length} Partages trouvés
            </p>
            
            <button 
              onClick={() => setSelectedAuthor(null)} 
              className="flex items-center gap-1.5 text-slate-400 font-black uppercase text-[10px] hover:text-emerald-600 transition-colors outline-none"
            >
              <ChevronLeft size={14} strokeWidth={3} /> Retour
            </button>
          </div>
        </div>

        {user?.id !== selectedAuthor.id && (
          <div className="w-48">
            <Bouton
              onClick={handleFollowToggle}
              className={cn(
                "h-10 transition-all", 
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


        <div className="space-y-24">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-xl"><LayoutGrid size={22} /></div>
              <div>
                <h2 className="text-2xl font-black uppercase italic">Programmes</h2>
                <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {auteurProgrammes.map(post => (
                <CardPost key={post.id} post={post} user={user} onUpdate={updatePostInFeed}/>
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
              {auteurPlannings.map(post => (
                <CardPost key={post.id} post={post} user={user} />
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

 
  const feedAffiche = feed.filter(post => {
    if (activeTab === 'explorer') return true;
    return suivisIds.includes(post.auteurId);
  });

  const postsProgrammes = feedAffiche.filter(p => !!p.programme);
  const postsPlannings = feedAffiche.filter(p => !!p.planning && !p.programme);

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-[2rem] w-full">
      <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
        {message}
      </p>
    </div>
  );

  return (
    <div className="w-full space-y-20 pb-20 text-left px-4 sm:px-10">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic leading-none">
            Fil <span className="text-emerald-700">Social</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            {feedAffiche.length} Publications {activeTab === 'abonnements' ? 'de vos abonnements' : 'communautaires'}
          </p>
        </div>
        
        <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl w-full md:w-auto">
        <button
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

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl"><LayoutGrid size={22} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic">Programmes</h2>
            <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
          </div>
        </div>
        {postsProgrammes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {postsProgrammes.map(post => (
            <CardPost 
              key={post.id} 
              post={post} 
              user={user} 
              onUpdate={updatePostInFeed}
              onUserClick={(id, nom, prenom) => setSelectedAuthor({id, nom, prenom})} 
            />
            ))}
          </div>
        ) : (
          activeTab === 'abonnements' && <EmptyState message="Aucun programme publié par vos abonnements" />
        )}
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl"><ClipboardList size={22} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic">Plannings</h2>
            <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
          </div>
        </div>
        {postsPlannings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {postsPlannings.map(post => (
            <CardPost 
              key={post.id} 
              post={post} 
              user={user} 
              onUpdate={updatePostInFeed}
              onUserClick={(id, nom, prenom) => setSelectedAuthor({id, nom, prenom})} 
            />
          ))}
        </div>
        ) : (
          activeTab === 'abonnements' && <EmptyState message="Aucun planning publié par vos abonnements" />
        )}
      </section>
      {activeTab === 'abonnements' && feedAffiche.length === 0 && (
        <div className="py-20 text-center bg-slate-50 dark:bg-zinc-900/30 rounded-[3rem] border border-slate-100 dark:border-zinc-800">
          <p className="text-slate-500 font-black uppercase italic text-xs mb-2">Votre feed est vide</p>
          <p className="text-slate-400 text-[10px] uppercase font-bold italic">Abonnez-vous pour voir leurs partages ici</p>
        </div>
      )}
    </div>
  );
}