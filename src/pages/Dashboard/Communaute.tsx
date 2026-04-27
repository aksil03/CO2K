import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, ClipboardList, ChevronLeft } from "lucide-react";
import type { UserWithRelations, PostComplet } from "@/lib/types";
import { Loading, CardPost } from '../../components/componentsCommuns';

export default function Communaute({ user }: { user: UserWithRelations | null }) {
  const [feed, setFeed] = useState<PostComplet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAuthor, setSelectedAuthor] = useState<{id: number, nom: string, prenom: string} | null>(null);

  
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

  if (loading) return <Loading message="Initialisation du feed..." />;
  if (!user) return null;

  if (selectedAuthor) {
    const postsAuteur = feed.filter(p => p.auteurId === selectedAuthor.id);
    const auteurProgrammes = postsAuteur.filter(p => !!p.programme);
    const auteurPlannings = postsAuteur.filter(p => !!p.planning && !p.programme);

    return (
      <div className="w-full space-y-12 pb-20 text-left px-4 sm:px-10">
        
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
                <CardPost key={post.id} post={post} user={user} />
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

  const postsProgrammes = feed.filter(p => !!p.programme);
  const postsPlannings = feed.filter(p => !!p.planning && !p.programme);

  return (
    <div className="w-full space-y-20 pb-20 text-left px-4 sm:px-10">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic leading-none">
            Fil <span className="text-emerald-700">Social</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            {feed.length} Publications
          </p>
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
      </section>
    </div>
  );
}