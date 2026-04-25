import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, ClipboardList } from "lucide-react";
import type { UserWithRelations, PostComplet } from "@/lib/types";
import { Loading, CardPost } from '../../components/componentsCommuns';

export default function Communaute({ user }: { user: UserWithRelations | null }) {
  const [feed, setFeed] = useState<PostComplet[]>([]);
  const [loading, setLoading] = useState(true);

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

  const postsProgrammes = feed.filter(p => !!p.programme);
  const postsPlannings = feed.filter(p => !!p.planning && !p.programme);

  if (loading) return <Loading message="Initialisation du feed..." />;
  if (!user) return null;

  return (
    <div className="w-full space-y-24 pb-20 text-left px-4 sm:px-10">
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-6xl font-black uppercase italic leading-none">
          Fil <span className="text-emerald-500">d'actualité</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
          {feed.length} Publications au total
        </p>
      </div>

      <div className="flex flex-col w-full space-y-32">
        
        <section className="space-y-10 w-full">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase italic leading-none text-slate-900">Programmes</h2>
              <div className="h-1 w-12 bg-emerald-600 rounded-full mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {postsProgrammes.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[3rem] opacity-50">
                <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
                  Aucun programme partagé
                </p>
              </div>
            ) : (
              postsProgrammes.map(post => (
                <div key={post.id} className="w-full">
                  <CardPost post={post} user={user} />
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
              <h2 className="text-3xl font-black uppercase italic leading-none text-slate-900">Plannings</h2>
              <div className="h-1 w-12 bg-emerald-600 rounded-full mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {postsPlannings.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[3rem] opacity-50">
                <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
                  Aucun planning partagé
                </p>
              </div>
            ) : (
              postsPlannings.map(post => (
                <div key={post.id} className="w-full">
                  <CardPost post={post} user={user} />
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}