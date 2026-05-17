import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CHEMIN_LOGIN, CHEMIN_DASHBOARD, CHEMIN_ACCUEIL } from '../App'
import { Bouton, LogoCo2K, NavBoutonGhost } from '@/components'
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
  const [estConnecte, setEstConnecte] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const verifierToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return false;

    try {
      const payload = JSON.parse(window.atob(token.split('.')[1]));
      const maintenant = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < maintenant) {
        localStorage.clear();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    setEstConnecte(verifierToken());
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15)
    const syncAuth = () => setEstConnecte(verifierToken())

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('storage', syncAuth)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user_prenom')
    setEstConnecte(false)
    window.location.href = CHEMIN_ACCUEIL
  }

  const prenom = sessionStorage.getItem("user_prenom") || ""
  const email = sessionStorage.getItem("user_email") || ""



  const initiale = prenom.charAt(0).toUpperCase();

  return (
    <nav className={`fixed top-0 left-0 w-full h-16 flex items-center z-50 transition-all ${isScrolled
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

          {estConnecte ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger id="menu-utilisateur" className="outline-none">
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-black dark:text-white">{prenom}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-emerald-700 flex items-center justify-center shadow-sm border border-emerald-800/20 transition-all duration-300 group-hover:bg-emerald-600 group-hover:shadow-emerald-500/20 group-hover:shadow-lg">
                    <span className="text-xs font-black text-white tracking-widest">
                      {initiale}
                    </span>
                  </div>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-950 border dark:border-zinc-800 shadow-xl rounded-xl">
                <div className="px-3 py-3">
                  <p className="text-sm font-bold dark:text-white">{prenom}</p>
                  <p className="text-[10px] text-zinc-500">{email}</p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  id="nav-dashboard"
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
              <Bouton>Connexion</Bouton>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}