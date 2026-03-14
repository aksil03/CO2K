import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import Co2KLogo from '../assets/Co2K.svg'
import { CHEMIN_ACCUEIL } from '../App'


export function BoutonVert({ children, onClick, type = "button", disabled = false }: any) {
  return (
    <Button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-all border-none shadow-md"
    >
      {children}
    </Button>
  )
}


export function LogoCo2K() {
  return (
    <Link to={CHEMIN_ACCUEIL} className="group flex items-center gap-2">
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
  )
}

export function NavBoutonGhost({ children, onClick }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className="text-slate-700 hover:text-emerald-700 font-bold"
    >
      {children}
    </Button>
  )
}

export function FormTemplate({ title, children, footerText, linkText, linkTo }: any) {
  return (
    <div className="pt-24 w-full flex justify-center px-4"> 
      {/* Conteneur principal avec animation d'entrée et effet de verre renforcé */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 md:p-10 space-y-8 bg-white/40 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 relative overflow-hidden"
      >
        {/* Effet de brillance subtil en arrière-plan du formulaire */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-3xl font-black italic text-center bg-gradient-to-br from-emerald-900 to-emerald-600 bg-clip-text text-transparent uppercase tracking-tighter mb-2">
            {title}
          </h1>
          <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full mb-8" />
          
          <div className="space-y-5">
            {children}
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-900/5">
            <p className="text-sm text-center text-slate-600 font-medium">
              {footerText}{" "}
              <Link 
                to={linkTo} 
                className="text-emerald-700 font-extrabold hover:text-emerald-500 transition-colors duration-300 underline-offset-4 hover:underline"
              >
                {linkText}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}