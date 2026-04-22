import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Utensils, Dumbbell, LogOut, User, CalendarDays, Users, Share2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Repas from "./Dashboard/Repas"
import Sport from "./Dashboard/Sport"
import Profil from "./Dashboard/Profil"
import { useParams } from 'react-router-dom'
import Plannings from './Dashboard/Plannings'
import Panel from './Dashboard/Panel'
import { type UserWithRelations, type Aliment } from '@/lib/types'
import Mon_compte from './Dashboard/Mon_compte'
import Communaute from './Dashboard/Communaute'
import { cn } from "@/lib/utils"
import { Loading } from '../components/componentsCommuns'

interface SidebarProps {
  icon: React.ElementType; 
  label: string;
  active: boolean;
  onClick: () => void;
}

const Sidebar = ({ icon: Icon, label, active, onClick }: SidebarProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "group relative w-full flex items-center justify-start gap-4 px-6 py-7 transition-all duration-300 outline-none",
      "bg-transparent hover:bg-transparent active:bg-transparent",
      active 
        ? "text-slate-950 dark:text-zinc-50" 
        : "text-slate-500 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-zinc-100"
    )}
  >
    <div className={cn(
      "absolute left-0 w-1 bg-emerald-500 shadow-sm rounded-r-full transition-all duration-500",
      active ? "h-8 opacity-100" : "h-0 opacity-0 group-hover:h-5 group-hover:opacity-100"
    )} />
    <Icon 
      size={22} 
      strokeWidth={active ? 2.5 : 2}
      className={cn(
        "shrink-0 transition-transform duration-300",
        active ? "text-emerald-600 dark:text-emerald-400 scale-110" : "group-hover:text-emerald-500"
      )}
    />
    <span className={cn(
      "text-[11px] uppercase transition-all duration-300 font-bold",
      active && "font-black italic translate-x-1"
    )}>
      {label}
    </span>
  </button>
);

function Dashboard() {
  const [page, setPage] = useState("alimentation")
 
  const { email } = useParams<{ email: string }>();
  
  const [user, setUser] = useState<UserWithRelations>(null);
  const [aliments, setAliments] = useState<Aliment[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true); 

        const [resUser, resAliments] = await Promise.all([
          fetch(`http://localhost:3000/api/utilisateur?email=${email}`),
          fetch(`http://localhost:3000/api/aliments/all`)
        ]);

        if (!resUser.ok || !resAliments.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }

        const userData = await resUser.json();
        const alimentsDataGroupes = await resAliments.json();
        const alimentsPlats = Object.values(alimentsDataGroupes).flat() as Aliment[];
        setUser(userData);
        setAliments(alimentsPlats);

      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
    if (email && email !== ":email") {
      initDashboard();
    }
  }, [email]);

  if (loading) return <Loading message="Initialisation du tableau de bord..." />;

  return (
    <div className="flex h-screen overflow-hidden pt-16">
    <aside className="w-64 fixed left-0 top-16 bottom-0 p-6 flex flex-col justify-between z-20 bg-transparent overflow-y-auto overflow-x-hidden">
      <nav className="space-y-4">
        <div className="px-4 mb-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase">Menu</p>
        </div>
        
        <Sidebar icon={User} label="Profil" active={page === "profil"} onClick={() => setPage("profil")} />
        <Sidebar icon={CalendarDays} label="Plannings" active={page === "plannings"} onClick={() => setPage("plannings")} />
        <Sidebar icon={LayoutDashboard} label="Panel de Gestion" active={page === "panel"} onClick={() => setPage("panel")} />
        <div className="px-4 mb-2 mt-8">
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase">Communauté</p>
        </div>
        <Sidebar icon={Share2} label="Mon Profil" active={page === "mon-profil"} onClick={() => setPage("mon-profil")} />
        <Sidebar icon={Users} label="Explorer" active={page === "communaute"} onClick={() => setPage("communaute")} />
      </nav>

      <div className="mt-10">
      <Button 
        variant="ghost" 
        className="justify-start gap-4 text-red-500 dark:text-red-400 font-black italic uppercase text-xs hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl py-8"
      >
        <LogOut size={20} /> <span>Quitter</span>
      </Button>
      </div>
    </aside>

      <main className="flex-1 ml-64 p-10 min-h-[calc(100vh-64px)] overflow-x-hidden">
        {page === "profil" && <Profil email={email || ""}/>}
        {page === "plannings" && (
          <Plannings user={user} tousLesAliments={aliments} />
        )}
        {page === "panel" && user && (
          <Panel user={user} tousLesAliments={aliments} />
        )}
        {page === "mon-profil" && user && <Mon_compte user={user} /> }
        {page === "communaute" && user && <Communaute user={user} /> }
      </main>
    </div>
  )
}

export default Dashboard