import React, { useState, useEffect } from 'react'
import type { UserWithRelations } from "@/lib/types"
import { Loading, ModalCreerPost } from '../../components/componentsCommuns'
import { toast } from "sonner"

export default function Mon_compte({ user }: { user: UserWithRelations }) {
  const [mesPosts, setMesPosts] = useState<any[]>([]);
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
        const res = await fetch(`http://localhost:3000/api/posts/utilisateur/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setMesPosts(data);
        }
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
      const res = await fetch("http://localhost:3000/api/posts/creer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData)
      });
      
      if (res.ok) {
        toast.success("Publication partagée");
        const updatedRes = await fetch(`http://localhost:3000/api/posts/utilisateur/${userId}`);
        if (updatedRes.ok) setMesPosts(await updatedRes.json());
      }
    } catch (error) {
      toast.error("Erreur réseau");
    }
  };

  if (loading) {
    return <Loading message="Chargement de vos publications..." />;
  }
  return (
    <div className="w-full space-y-20 pb-20 text-left">
      
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic">
            Posts <span className="text-emerald-700">{user?.prenom}</span>
          </h1>
        </div>
        <ModalCreerPost user={user} onPublier={handlePublishPost} />
      </div>
    </div>
  )
}