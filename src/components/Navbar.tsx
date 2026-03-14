import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CHEMIN_LOGIN } from '../App'
import { BoutonVert, LogoCo2K, NavBoutonGhost } from './componentsCommuns'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 w-full h-16 flex items-center z-50 transition-all ${
      isScrolled 
        ? "backdrop-blur-md border-b border-white/10" 
        : "bg-transparent"
    }`}>
      <div className="flex w-full justify-between items-center px-6">
        
        <LogoCo2K />

        <div className="flex gap-3">
          <NavBoutonGhost>Projet</NavBoutonGhost>

          <Link to={CHEMIN_LOGIN}>
            <BoutonVert>Connexion</BoutonVert>
          </Link>
        </div>

      </div>
    </nav>
  )
}