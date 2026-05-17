import React, { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from "sonner"
import { LayoutGrid, ClipboardList } from "lucide-react"
import type { UserWithRelations, PostComplet, CreatePostData } from "@/lib/types"
import { Loading, ModalCreerPost, CardPost, EmptyState, SectionHeader } from '@/components'
import { cn } from "@/lib/utils"

export default function Mon_compte({ user, onUpdate }: { user: UserWithRelations, onUpdate: () => void }) {
  const [mesPosts, setMesPosts] = useState<PostComplet[]>(user?.posts || []);
  const limitePostAtteinte = mesPosts.length >= 10;
  const userId = user?.id;

  const chargerDonnees = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/posts/utilisateur/${user.id}`);
      setMesPosts(res.data);
    } catch (error) {
      console.error("Erreur chargement posts", error);
    }
  };

  const updatePostInList = (postId: number, newLikesCount: number, isLiked: boolean) => {
    setMesPosts((prev) => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          _count: {
            ...post._count,
            likes: newLikesCount,
            commentaires: post.commentaires?.length || post._count?.commentaires || 0
          },
          likes: isLiked ? [{ id: 0, userId: user?.id || 0, postId }] : []
        };
      }
      return post;
    }));
  };

  useEffect(() => {
    chargerDonnees();
  }, [user?.id]);

  const handlePublishPost = async (postData: CreatePostData) => {
    try {
      const res = await api.post<PostComplet>("/api/posts/creer", postData);
      if (res.status === 201 || res.status === 200) {
        toast.success("Publication partagée");
        await chargerDonnees();
        onUpdate();
      }
    } catch (error) {
      toast.error("Erreur lors de la publication");
    }
  };

  const handlePostDeletedLocalement = (postId: number) => {
    setMesPosts(prev => prev.filter(p => p.id !== postId));
    onUpdate();
  };

  const postsProgrammes = mesPosts.filter(p => !!p.programme);
  const postsPlannings = mesPosts.filter(p => !!p.planning && !p.programme);

  return (
    <div className="w-full space-y-24 pb-20 text-left px-4 sm:px-10">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic leading-none">
            Posts <span className="text-emerald-700">{user?.prenom}</span>
          </h1>
          <p id="total-posts-count" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            {mesPosts.length} Publications au total
          </p>
          {limitePostAtteinte && (
            <p className="text-[10px] font-black text-rose-500 uppercase italic mt-2">
              Limite de postes atteinte, Supprimez-en pour en créer un nouveau
            </p>
          )}
        </div>
        <ModalCreerPost id="btn-ouvrir-modal-post" user={user} onPublier={handlePublishPost} disabled={limitePostAtteinte} />
      </div>

      <div className="flex flex-col w-full space-y-32">

        <section className="space-y-8">
          <SectionHeader titre="Programmes" icon={<LayoutGrid size={22} />} variant="dark" />
          {postsProgrammes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {postsProgrammes.map(post => (
                <div key={post.id} className="w-full">
                  <CardPost post={post} user={user} onUpdate={updatePostInList} onDelete={handlePostDeletedLocalement} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun post de programme publié" />
          )}
        </section>

        <section className="space-y-8">
          <SectionHeader titre="Plannings" icon={<ClipboardList size={22} />} variant="light" />
          {postsPlannings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {postsPlannings.map(post => (
                <div key={post.id} className="w-full">
                  <CardPost post={post} user={user} onUpdate={updatePostInList} onDelete={handlePostDeletedLocalement} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun post de planning publié" />
          )}
        </section>

        {mesPosts.length === 0 && (
          <div className="py-20 text-center bg-slate-50 dark:bg-zinc-900/30 rounded-[3rem] border border-slate-100 dark:border-zinc-800">
            <p className="text-slate-500 font-black uppercase italic text-xs mb-2">Votre profil est vide</p>
            <p className="text-slate-400 text-[10px] uppercase font-bold italic">Partagez vos meilleures routines avec la communauté</p>
          </div>
        )}
      </div>
    </div>
  )
}