import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import Co2KLogo from '../assets/Co2K.svg'

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
        ? "backdrop-blur-md" 
        : "bg-transparent"
    }`}>
      <div className="flex w-full justify-between items-center px-6">
        
        <Link to="/" className="group flex items-center gap-2">
          <motion.img 
            whileHover={{ rotate: -10, scale: 1.1 }}
            src={Co2KLogo} 
            alt="Logo" 
            className="h-10"
            style={{ filter: 'invert(30%) sepia(75%) saturate(450%) hue-rotate(115deg)' }}
          />
          <span className="text-xl font-bold text-emerald-700">
            CO2K
          </span>
        </Link>

        <div className="flex gap-3">
          <Button variant="ghost" className="text-slate-700 hover:text-emerald-700 font-bold">
            Projet
          </Button>

          <Link to="/login">
            <Button className="bg-emerald-700 text-white border-none font-bold hover:bg-emerald-800 transition-all">
              Connexion
            </Button>
          </Link>
        </div>

      </div>
    </nav>
  )
}