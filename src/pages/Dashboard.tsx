import React, { useState } from 'react'
import { LayoutDashboard, Utensils, Dumbbell, Leaf, Settings, LogOut, User, CalendarDays } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Repas from "./Dashboard/Repas"
import Sport from "./Dashboard/Sport"
import Profil from "./Dashboard/Profil"
import { useParams } from 'react-router-dom'
import Plannings from './Dashboard/Plannings'

interface SidebarProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const Sidebar = ({ icon, label, active, onClick }: SidebarProps) => (
  <Button 
    variant={active ? "secondary" : "ghost"} 
    onClick={onClick}
    className={`w-full justify-start px-4 py-6 rounded-xl font-bold ${
      active ? "bg-white text-emerald-700 shadow-sm" : "text-emerald-800"
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </Button>
);

function Dashboard() {
  const [page, setPage] = useState("alimentation")
 
  const { email } = useParams<{ email: string }>();
  
  return (
    <div className="flex min-h-screen pt-16">
      <aside className="w-64 fixed left-0 top-16 bottom-0 bg-emerald-700/1 backdrop-blur-sm p-6 flex flex-col justify-between border-r border-white/20">
        <nav className="space-y-2">
          <Sidebar icon={<Utensils />} label="Alimentation" active={page === "alimentation"} onClick={() => setPage("alimentation")} />
          <Sidebar icon={<Dumbbell />} label="Sport" active={page === "sport"} onClick={() => setPage("sport")} />
          <Sidebar icon={<User />} label="Profil" active={page === "profil"} onClick={() => setPage("profil")} />
          <Sidebar icon={<CalendarDays />} label="Plannings" active={page === "plannings"} onClick={() => setPage("plannings")} />
        </nav>
        <Button variant="ghost" className="justify-start text-red-600 font-bold py-6">
          <LogOut /> <span>Quitter</span>
        </Button>
      </aside>

      <main className="flex-1 ml-64 p-10">
        {page === "alimentation" && <Repas />}
        {page === "sport" && <Sport />}
        {page === "profil" && <Profil email={email || ""}/>}
        {page === "plannings" && <Plannings />}
      </main>
    </div>
  )
}

export default Dashboard