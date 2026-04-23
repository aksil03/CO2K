import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from "sonner"
import { LayoutGrid, ClipboardList } from "lucide-react"
import type { UserWithRelations, PostComplet } from "@/lib/types"
import { Loading, ModalCreerPost, CardPost } from '../../components/componentsCommuns'

export default function Mon_compte({ user }: { user: UserWithRelations }) {
  const [mesPosts, setMesPosts] = useState<PostComplet[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchMesPosts() {
      setLoading(true);
      try {
        const res = await axios.get<PostComplet[]>(`http://localhost:3000/api/posts/utilisateur/${userId}`);
        setMesPosts(res.data);
      } catch (error) {
        toast.error("Erreur lors de la récupération des posts");
      } finally {
        setLoading(false);
      }
    }
    fetchMesPosts();
  }, [userId]);

  const handlePublishPost = async (postData: any) => {
    try {
      const res = await axios.post<PostComplet>("http://localhost:3000/api/posts/creer", postData);
      
      if (res.status === 201 || res.status === 200) {
        toast.success("Publication partagée");
        setMesPosts(prev => [res.data, ...prev]);
      }
    } catch (error) {
      toast.error("Erreur lors de la publication");
    }
  };

  const postsProgrammes = mesPosts.filter(p => !!p.programme);
  const postsPlannings = mesPosts.filter(p => !!p.planning && !p.programme);

  if (loading) {
    return <Loading message="Initialisation du Compte..." />;
  }

  return (
    <div className="w-full space-y-24 pb-20 text-left px-4 sm:px-10">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl font-black uppercase italic leading-none">
            Posts <span className="text-emerald-700">{user?.prenom}</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            {mesPosts.length} Publications au total
          </p>
        </div>
        <ModalCreerPost user={user} onPublier={handlePublishPost} />
      </div>

      <div className="flex flex-col w-full space-y-32">
        
        <section className="space-y-10 w-full">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase italic leading-none">Programmes</h2>
              <div className="h-1 w-12 bg-emerald-600 rounded-full mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {postsProgrammes.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-[3rem] opacity-50">
                <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
                  Aucun post de programme
                </p>
              </div>
            ) : (
              postsProgrammes.map(post => (
                <div key={post.id} className="w-full">
                  <CardPost post={post} />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-10 w-full">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
              <ClipboardList size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase italic leading-none">Plannings</h2>
              <div className="h-1 w-12 bg-emerald-600 rounded-full mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {postsPlannings.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-[3rem] opacity-50">
                <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
                  Aucun post de planning
                </p>
              </div>
            ) : (
              postsPlannings.map(post => (
                <div key={post.id} className="w-full">
                  <CardPost post={post} />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}