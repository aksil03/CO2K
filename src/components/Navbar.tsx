import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CHEMIN_LOGIN, CHEMIN_DASHBOARD, CHEMIN_ACCUEIL } from '../App'
import { BoutonVert, LogoCo2K, NavBoutonGhost } from './componentsCommuns'
import { UserCircle, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react'
import { useTheme } from '../providers/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button" 

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const token = localStorage.getItem("token")
  const prenom = localStorage.getItem("user_prenom") || ""
  const email = localStorage.getItem("user_email") || ""

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = CHEMIN_ACCUEIL
  }

return (
  <nav className={`fixed top-0 left-0 w-full h-16 flex items-center z-50 transition-all ${
    isScrolled 
      ? "backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800" 
      : "bg-transparent"
  }`}>
    <div className="flex w-full justify-between items-center px-6">
      
      <LogoCo2K />

      <div className="flex gap-4 items-center">
        
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <NavBoutonGhost>Projet</NavBoutonGhost>

        {token ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="outline-none">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-black dark:text-white">{prenom}</p>
                </div>
                <UserCircle size={32} className="text-black dark:text-white" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-950 border dark:border-zinc-800 shadow-xl rounded-xl">
              <div className="px-3 py-3">
                <p className="text-sm font-bold dark:text-white">{prenom}</p>
                <p className="text-[10px] text-zinc-500">{email}</p>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => navigate(CHEMIN_DASHBOARD(email))} 
                className="flex items-center gap-3 px-3 py-2 cursor-pointer dark:text-zinc-300"
              >
                <LayoutDashboard size={18} />
                <span>Mon Dashboard</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 cursor-pointer text-red-600">
                <LogOut size={18} />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to={CHEMIN_LOGIN}>
            <BoutonVert>Connexion</BoutonVert>
          </Link>
        )}
      </div>
    </div>
  </nav>
)}